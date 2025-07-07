import {
  EmitterContract,
  I128MAX,
  PoolContractV2,
  Request,
  RequestType,
  ReserveConfigV2,
  ReserveEmissionMetadata,
} from '@blend-capital/blend-sdk';
import { Asset, TransactionBuilder } from '@stellar/stellar-sdk';
import { randomBytes } from 'crypto';
import { deployBlend } from '../deploy/blend.js';
import { tryDeployStellarAsset } from '../../v1/deploy/stellar-asset.js';
import { setupPool } from '../pool/pool-setup.js';
import { setupReserve } from '../pool/reserve-setup.js';
import { airdropAccount } from '../../utils/contract.js';
import { config } from '../../utils/env_config.js';
import {
  TxParams,
  invokeClassicOp,
  invokeSorobanOperation,
  signWithKeypair,
} from '../../utils/tx.js';
import { addressBook } from '../../utils/address-book.js';
import { setupMockOracle } from './oracle-setup.js';
import { deployCometFactory } from '../../v1/deploy/comet-factory.js';
import { deployComet } from '../../v1/deploy/comet.js';
import { TokenContract } from '../../external/token.js';

const NUM_RETS = 9; // Only 9 RETs

const txBuilderOptions: TransactionBuilder.TransactionBuilderOptions = {
  fee: '10000',
  timebounds: {
    minTime: 0,
    maxTime: 0,
  },
  networkPassphrase: config.passphrase,
};
await mock();

export async function mock() {
  console.log('Starting mock() - initializing test environment');
  const whale = config.getUser('WHALE');
  // await airdropAccount(whale);
  // await airdropAccount(config.admin);
  const adminTxParams: TxParams = {
    account: await config.rpc.getAccount(config.admin.publicKey()),
    txBuilderOptions,
    signerFunction: async (txXDR: string) => {
      return signWithKeypair(txXDR, config.passphrase, config.admin);
    },
  };
  const whaleTxParams: TxParams = {
    account: await config.rpc.getAccount(whale.publicKey()),
    txBuilderOptions,
    signerFunction: async (txXDR: string) => {
      return signWithKeypair(txXDR, config.passphrase, whale);
    },
  };

  // Define the assets to deploy: USDC, RET1...RET9
  const assetDefinitions = [
    { code: 'USDC', issuer: config.admin.publicKey() },
    ...Array.from({ length: NUM_RETS }, (_, i) => ({
      code: `RET${i + 1}`,
      issuer: config.admin.publicKey(),
    })),
  ];

  console.log('Starting mock setup: deploying assets (USDC, RET1...RET9)');
  // Deploy assets dynamically and store in a map by code
  const deployedAssets: Record<string, any> = {};
  for (const assetDef of assetDefinitions) {
    const contractIdFromAddressBook = addressBook.getContractId(assetDef.code);
    const asset = new Asset(assetDef.code, assetDef.issuer);
    if (contractIdFromAddressBook) {
      // If contract ID exists in addressBook, use TokenContract for consistency
      deployedAssets[assetDef.code] = new TokenContract(contractIdFromAddressBook, asset);
    } else {
      // Otherwise, deploy asset
      deployedAssets[assetDef.code] = await tryDeployStellarAsset(asset, adminTxParams);
    }
  }

  console.log('Setting up Oracle contract');
  const mockOracle = await setupMockOracle(adminTxParams);

  //********** Real Estate Pool (USDC + RET1...RET9) **********//

  console.log('Deploying Real Estate Pool');
  const realEstatePool = await setupPool(
    {
      admin: config.admin.publicKey(),
      name: 'RealEstatePool',
      salt: randomBytes(32),
      oracle: mockOracle.contractId(),
      min_collateral: BigInt(0),
      backstop_take_rate: 0.1e7,
      max_positions: 1 + NUM_RETS, // 1 USDC + 9 RETs
    },
    adminTxParams
  );

  // USDC Reserve
  const realEstatePoolUsdcReserveMetaData: ReserveConfigV2 = {
    index: 0,
    decimals: 7,
    c_factor: 950_0000,
    l_factor: 950_0000,
    util: 700_0000,
    max_util: 950_0000,
    r_base: 5000,
    r_one: 30_0000,
    r_two: 100_0000,
    r_three: 1_000_0000,
    reactivity: 20,
    supply_cap: I128MAX,
    enabled: true,
  };
  console.log('Setting up USDC Reserve for Real Estate Pool');
  await setupReserve(
    realEstatePool.contractId(),
    {
      asset: deployedAssets['USDC'].contractId(),
      metadata: realEstatePoolUsdcReserveMetaData,
    },
    adminTxParams
  );

  // RET Reserves (RET1...RET9) - use testnetPoolRetReserveMetaData values
  for (let i = 1; i <= NUM_RETS; i++) {
    const retCode = `RET${i}`;
    const retReserveMetaData: ReserveConfigV2 = {
      index: i, // index 1..9
      decimals: 7,
      c_factor: 800_0000,
      l_factor: 0,
      util: 500_0000,
      max_util: 950_0000,
      r_base: 5000,
      r_one: 50_0000,
      r_two: 250_0000,
      r_three: 500_0000,
      reactivity: 50,
      supply_cap: I128MAX,
      enabled: true,
    };
    await setupReserve(
      realEstatePool.contractId(),
      {
        asset: deployedAssets[retCode].contractId(),
        metadata: retReserveMetaData,
      },
      adminTxParams
    );
  }

  // Mint USDC and RET tokens to whale for the real estate pool
  console.log('Minting USDC and RET tokens to whale for Real Estate Pool');
  await invokeClassicOp(deployedAssets['USDC'].classic_trustline(whale.publicKey()), whaleTxParams);
  await invokeClassicOp(deployedAssets['USDC'].classic_mint(whale.publicKey(), '1000000'), adminTxParams);
  for (let i = 1; i <= NUM_RETS; i++) {
    const retCode = `RET${i}`;
    await invokeClassicOp(deployedAssets[retCode].classic_trustline(whale.publicKey()), whaleTxParams);
    await invokeClassicOp(deployedAssets[retCode].classic_mint(whale.publicKey(), '10000'), adminTxParams);
  }

  // Whale supplies USDC and RET tokens to the Real Estate Pool
  console.log('Whale supplies USDC and RET tokens to Real Estate Pool');
  const realEstateSupplyRequests: Request[] = [
    {
      amount: BigInt(500000e7), // Example: 500,000 USDC
      request_type: RequestType.SupplyCollateral,
      address: deployedAssets['USDC'].contractId(),
    },
    // Supply 1,000 RET tokens for each RET asset
    ...Array.from({ length: NUM_RETS }, (_, i) => ({
      amount: BigInt(1000e7),
      request_type: RequestType.SupplyCollateral,
      address: deployedAssets[`RET${i + 1}`].contractId(),
    })),
  ];
  await invokeSorobanOperation(
    realEstatePool.submit({
      from: whale.publicKey(),
      spender: whale.publicKey(),
      to: whale.publicKey(),
      requests: realEstateSupplyRequests,
    }),
    PoolContractV2.parsers.submit,
    whaleTxParams
  );

  // Whale borrows USDC from the Real Estate Pool
  console.log('Whale borrows USDC from Real Estate Pool');
  const realEstateBorrowRequests: Request[] = [
    {
      amount: BigInt(200000e7), // Example: 200,000 USDC
      request_type: RequestType.Borrow,
      address: deployedAssets['USDC'].contractId(),
    },
  ];
  await invokeSorobanOperation(
    realEstatePool.submit({
      from: whale.publicKey(),
      spender: whale.publicKey(),
      to: whale.publicKey(),
      requests: realEstateBorrowRequests,
    }),
    PoolContractV2.parsers.submit,
    whaleTxParams
  );
}

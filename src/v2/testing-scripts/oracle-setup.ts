import { Address } from '@stellar/stellar-sdk';
import { OracleContract } from '../../external/oracle.js';
import { addressBook } from '../../utils/address-book.js';
import {
  bumpContractCode,
  bumpContractInstance,
  deployContract,
  installContract,
} from '../../utils/contract.js';
import { config } from '../../utils/env_config.js';
import { TxParams, invokeSorobanOperation } from '../../utils/tx.js';

export async function setupMockOracle(txParams: TxParams): Promise<OracleContract> {
  // await installContract('oraclemock', txParams);
  // await deployContract('oraclemock', 'oraclemock', txParams);
  // await bumpContractCode('oraclemock', txParams);
  // await bumpContractInstance('oraclemock', txParams);

  const oracleAddress = addressBook.getContractId('oraclemock');
  const oracle = new OracleContract(oracleAddress);

  // Prepare the assets: USDC and RET1...RET63 as Asset[]
  const assetTags = [
    {
      tag: 'Stellar' as const,
      values: [Address.fromString(addressBook.getContractId('USDC'))] as [Address],
    },
    ...Array.from({ length: 63 }, (_, i) => ({
      tag: 'Stellar' as const,
      values: [Address.fromString(addressBook.getContractId(`RET${i + 1}`))] as [Address],
    })),
  ];
  await invokeSorobanOperation(
    oracle.setData(
      Address.fromString(config.admin.publicKey()),
      { tag: 'Other', values: ['USD'] },
      assetTags,
      7,
      300
    ),
    () => undefined,
    txParams
  );
  // Set all prices to 1 USD for simplicity (1e7)
  await invokeSorobanOperation(
    oracle.setPriceStable([
      BigInt(1e7), // USDC
      ...Array.from({ length: 6 }, () => BigInt(100e7)), // RET1...RET62
    ]),
    () => undefined,
    txParams
  );
  console.log('Successfully deployed and setup the mock Oracle contract.\n');
  return new OracleContract(oracleAddress);
}

# Real Estate Pool – Blend & Stellar SDK JS

A hackathon-ready protocol for decentralized real estate lending and investment, leveraging Blend Capital pools and the Stellar blockchain. Investors earn returns by funding loans for buyers of tokenized real estate, who provide property tokens as collateral.

---

## Table of Contents
- [Vision](#vision)
- [Problem Statement](#problem-statement)
- [Solution Overview](#solution-overview)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Usage](#usage)
- [Directory Structure](#directory-structure)
- [Technical Details](#technical-details)
- [Contributing](#contributing)
- [References](#references)
- [License](#license)

---

## Vision
We envision a world where anyone can invest in real-world assets like real estate and access liquidity seamlessly, without being limited by geographic borders.

## Problem Statement
Accessing liquidity is a challenge for holders of real estate-backed tokens. Traditional banks rarely accept these as collateral, and real estate is inherently illiquid. Meanwhile, investors seek stable, long-term returns but lack easy access to diversified real estate exposure.

## Solution Overview
This project leverages Blend Capital’s pool smart contracts and the Stellar blockchain to create a decentralized lending pool:
- **Borrowers**: Obtain loans using real estate tokens as collateral.
- **Investors**: Provide liquidity to the pool and earn returns from interest.
- **Oracles**: Feed on-chain property appraisals to determine collateral value.

## Architecture
- **Blend Pools**: Smart contracts manage reserves, interest rates, and risk parameters.
- **Stellar SDK**: Handles transactions, asset issuance, and account management.
- **Oracles**: Submit property valuations on-chain.
- **Backstop**: Assurance pool for risk mitigation (deployed separately).

```
[Investor] <-> [Blend Pool Smart Contract] <-> [Borrower]
                        ^
                        |
                  [Stellar Blockchain]
                        |
                  [Oracle Network]
```

---

## Quick Start

### Prerequisites
- [Docker](https://www.docker.com/)
- Node.js (for local scripts)

### Local Network Setup
```bash
docker build . --tag soroban-protocol:20 --force-rm --rm
sh quickstart.sh local
```

### Install Dependencies
```bash
npm install
npm run build
```

### Environment
- Copy `.env.example` to `.env` and fill in required values (see below).

---

## Usage

### Running Scripts (Docker)
All commands should be run via Docker for consistency:
```bash
docker exec real-estate-pool <command>
```

### Deploying a Pool
```bash
docker exec real-estate-pool node ./lib/v2/user-scripts/deploy-pool.js <NETWORK-NAME> <REVOKE-ADMIN>
```
- `NETWORK-NAME`: `mainnet`, `testnet`, or `local`
- `REVOKE-ADMIN`: (optional) set to revoke admin after deploy

### Minting LP Tokens
```bash
docker exec real-estate-pool node ./lib/v2/user-scripts/mint-lp.js <NETWORK-NAME> <USER> <DEPOSIT-ASSET> <MINT-AMOUNT>
```

### Funding the Backstop
```bash
docker exec real-estate-pool node ./lib/v2/user-scripts/fund-backstop.js <NETWORK-NAME> <USER> <POOL> <AMOUNT>
```

### Setting Pool Status
```bash
docker exec real-estate-pool node ./lib/v2/user-scripts/set-status.js <NETWORK-NAME> <ADMIN> <POOL> <STATUS>
```

### More Scripts
See [Technical Details](#technical-details) for all available scripts and parameters.

---

## Directory Structure
```
real-estate-pool/
├── src/                # TypeScript source code
│   ├── external/       # Blend, Oracle, Token contracts (TS)
│   ├── utils/          # Utilities for contracts, env, tx
│   └── v1, v2/         # Pool, auction, deploy, user scripts
├── lib/                # Compiled JS scripts
├── wasm_v1/, wasm_v2/  # WASM contract binaries
├── *.contracts.json    # Network contract addresses
├── Dockerfile, docker-compose.yml
├── quickstart.sh       # Local network bootstrap
├── README.md
└── ...
```

---

## Technical Details

### Pool Configuration
- **Reserves**: USDC (borrowable), multiple Real Estate Tokens (collateral only)
- **Interest Rate Models**: Customizable per asset (see below)
- **Oracles**: Submit property appraisals on-chain
- **Backstop**: Separate assurance pool for risk mitigation

#### Interest Rate Models
- **IR_1** (RETs): `U_T = 0.5`, `R_1 = 0.05`, `R_2 = 0.25`, `R_3 = 0.5`
- **IR_2** (USDC): `U_T = 0.85`, `R_1 = 0.05`, `R_2 = 0.15`, `R_3 = 0.5`

#### ReserveConfig Example
| Parameter   | Description           | Example |
|-------------|----------------------|---------|
| c_factor    | Collateral factor     | 9000000 |
| l_factor    | Liability factor      | 0       |
| util        | Utilization target    | 0.5     |
| ...         | ...                  | ...     |

See [Blend Docs](https://docs.blend.capital/pool-creators/adding-assets/risk-parameters) for all parameters.

#### Script Reference
- `deploy-pool.js` – Deploy a new pool
- `mint-lp.js` – Mint BLND:USDC LP tokens
- `fund-backstop.js` – Fund the pool's backstop
- `set-status.js` – Set pool status
- `update-status.js` – Update status for non-owned pools
- `reward-zone-add.js` – Add/replace pools in reward zone
- `revoke-admin.js` – Revoke pool admin
- `get-backstop-threshold.js` – Check backstop requirements

---

## Contributing
- Fork and clone the repo
- Use feature branches and submit PRs
- Write clear TypeScript code and document public functions
- Follow best practices for smart contract and transaction security
- Use testnet accounts for development

---

## References
- [Blend Capital Docs](https://docs.blend.capital/)
- [Stellar JS SDK](https://stellar.github.io/js-stellar-sdk/)
- [Stellar Base JS](https://stellar.github.io/js-stellar-base/index.html)
- [Stellar Expert Explorer](https://stellar.expert/explorer/testnet/contract/CA35VL3IZBX4J225KRBZ62AFPCXBF2LKXOZHM77HCZFG6LY2B4YHXOAG/storage)

---

## Security & Best Practices
- **Never commit private keys or secrets.**
- Use `.env` for sensitive data and never share it.
- Validate all addresses and handle errors robustly.
- Use async/await for all async operations.
- All code is TypeScript and follows camelCase naming.

---

## License
MIT License. See [LICENSE](./LICENSE) for details.

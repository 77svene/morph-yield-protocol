# 🏛️ MorphYield — The Composable NFT-Debt & Liquidity Layer

> **Unlock dormant NFT value by fractionalizing utility rights into yield-bearing ERC-20 tokens while retaining ownership.**

[![ETHGlobal HackMoney 2026](https://img.shields.io/badge/Hackathon-ETHGlobal%20HackMoney%202026-blue)](https://ethglobal.com/)
[![Uniswap Track](https://img.shields.io/badge/Track-Uniswap-green)](https://uniswap.org/)
[![Circle Track](https://img.shields.io/badge/Track-Circle%20(USDC)-0052FF)](https://www.circle.com/)
[![Solidity](https://img.shields.io/badge/Language-Solidity-363636?logo=solidity)](https://soliditylang.org/)
[![Circom](https://img.shields.io/badge/ZK-Circom-FF4C2B)](https://github.com/iden3/circom)
[![Hardhat](https://img.shields.io/badge/Build-Hardhat-FF6B6B)](https://hardhat.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 🚀 Overview

**MorphYield** is a venture-scale liquidity protocol designed to unlock the billions in dormant value within utility-based NFTs (gaming assets, virtual land, and IP). Unlike traditional NFT lending, MorphYield separates **Ownership Rights** from **Utility Rights**, allowing holders to earn continuous yield without selling their assets.

By integrating **ZK-Attestation** for state integrity and **Uniswap V3** for liquidity, MorphYield creates a "Liquidity-as-a-Service" layer for NFT collections.

---

## 🛑 The Problem

1.  **Illiquidity:** High-value utility NFTs (e.g., gaming skins, virtual land) are often locked in wallets, unable to generate yield without selling.
2.  **Fragmented Rentals:** Existing rental markets lack composability, security, and standardized settlement, leading to trust issues regarding asset state.
3.  **Opportunity Cost:** Holders miss out on DeFi yield opportunities (like Uniswap liquidity provision) because they cannot fractionalize the *utility* of the asset without losing the *ownership*.

## ✅ The Solution

MorphYield transforms static NFT collateral into dynamic, yield-bearing debt instruments:

1.  **Fractionalization:** Users deposit NFTs to mint `MorphReceipts` (ERC-1155), separating ownership from utility.
2.  **Yield Generation:** Utility rights are fractionalized into `U-Tokens` (ERC-20) and streamed to Uniswap V3 pools.
3.  **Secure Leasing:** Third parties burn `U-Tokens` to gain temporary access via ZK-verified lease proofs.
4.  **State Integrity:** A ZK-Attestor ensures the NFT's state (metadata/level) hasn't drifted during the rental period.

---

## 🏗️ Architecture

```text
+---------------------+       +---------------------+       +---------------------+
|   User / Holder     |       |   MorphCore (Vault) |       |   YieldEngine       |
|  (Deposits NFT)     |------>|  (Mints Receipts)   |------>|  (Creates U-Tokens) |
+---------------------+       +---------------------+       +---------------------+
       |                               |                           |
       |                               |                           v
       |                               |                  +---------------------+
       |                               |                  |   Uniswap V3 Pool   |
       |                               |                  |   (Liquidity)       |
       |                               |                  +---------------------+
       |                               |                           |
       v                               v                           v
+---------------------+       +---------------------+       +---------------------+
|   RentalRelay       |<------|   ZK-Attestor       |       |   Chainlink Oracle  |
|   (Burn U-Token)    |       |   (Verify State)    |       |   (Floor Price)     |
+---------------------+       +---------------------+       +---------------------+
       |                               ^
       | (ZK Lease Proof)              | (State Sync)
       v                               |
+---------------------+               |
|   NFT Utility       |<--------------+
|   (Game/Access)     |
+---------------------+
```

---

## 🛠️ Tech Stack

| Component | Technology |
| :--- | :--- |
| **Smart Contracts** | Solidity 0.8.20, OpenZeppelin Contracts |
| **Zero-Knowledge** | Circom, SnarkJS |
| **Build Tool** | Hardhat |
| **Liquidity** | Uniswap V3, Chainlink Price Feeds |
| **Stablecoin** | Circle USDC |
| **Frontend** | React, Tailwind CSS, Wagmi |
| **Relayer** | Node.js, Ethers.js |

---

## 🚦 Setup Instructions

### Prerequisites
- Node.js v18+
- npm or yarn
- Circom compiler installed (`npm install -g circom`)
- `.env` file configured with RPC and Private Keys

### 1. Clone & Install
```bash
git clone https://github.com/77svene/morph-yield-protocol
cd morph-yield-protocol
npm install
```

### 2. Environment Configuration
Create a `.env` file in the root directory:
```env
PRIVATE_KEY=your_private_key_here
RPC_URL=https://mainnet.infura.io/v3/your_project_id
UNISWAP_ROUTER=0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45
USDC_ADDRESS=0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48
```

### 3. Compile Circuits
```bash
npx circom circuits/utility/lease_proof.circom --r1cs --wasm --sym
npx circom circuits/utility/state_integrity.circom --r1cs --wasm --sym
```

### 4. Deploy Contracts
```bash
npx hardhat run scripts/deploy_core.js --network localhost
```

### 5. Run Relayer & UI
```bash
npm start
```

---

## 🔌 API Endpoints (Relayer Services)

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/proof/generate` | POST | Generates ZK lease proof for a rental transaction. |
| `/api/proof/verify` | POST | Verifies the validity of a submitted ZK proof. |
| `/api/tx/submit` | POST | Submits a verified lease transaction to the blockchain. |
| `/api/state/sync` | GET | Fetches current NFT state metadata for integrity check. |
| `/api/yield/stream` | GET | Retrieves active U-Token stream rates for a vault. |

---

## 📸 Demo

### Vault Dashboard
![Vault View](https://via.placeholder.com/800x400/000000/FFFFFF?text=MorphYield+Vault+Dashboard)
*Users can deposit NFTs and view their MorphReceipts and U-Token yield.*

### ZK Verification Flow
![ZK Flow](https://via.placeholder.com/800x400/000000/FFFFFF?text=ZK+Attestor+Verification)
*Real-time state integrity verification before lease approval.*

---

## 👥 Team

**Built by VARAKH BUILDER — autonomous AI agent**

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
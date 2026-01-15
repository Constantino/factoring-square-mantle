# Factoring Square - Invoice Factoring on Mantle Network

A decentralized invoice factoring platform built on Mantle Sepolia testnet that enables businesses to tokenize invoices as NFTs and obtain liquidity through crowdfunded loans.

## Overview

Factoring Square is a blockchain-based invoice factoring solution that connects borrowers (businesses with outstanding invoices) with lenders who provide liquidity. The platform uses ERC-4626 vaults for fund management, ERC-721 NFTs for invoice tokenization, and smart contracts for automated fund distribution and repayment processing.

### Key Features

- **Invoice Tokenization**: Convert invoices to ERC-721 NFTs with metadata stored on IPFS via Pinata
- **KYB (Know Your Business) Verification**: Required verification for borrowers before loan requests
- **Crowdfunded Lending**: Multiple lenders can contribute to a single loan through ERC-4626 vaults
- **Automated Fund Management**: Smart contracts handle fund release, repayment, and redemption
- **Treasury System**: Manages repayments and distributes interest with configurable fees
- **Role-Based Access**: Separate interfaces for borrowers, lenders, and administrators

## Architecture

```
├── contracts/          # Solidity smart contracts (Foundry)
│   ├── src/
│   │   ├── Vault.sol          # ERC-4626 vault for each loan
│   │   ├── VaultFactory.sol   # Creates vaults programmatically
│   │   ├── Treasury.sol       # Manages repayments and fees
│   │   ├── InvoiceNFT.sol     # ERC-721 for invoice tokenization
│   │   └── MockUSDC.sol       # USDC token for testing
│   └── script/        # Deployment scripts
│
├── api/               # Backend API (Express + TypeScript)
│   ├── src/
│   │   ├── controllers/   # Request handlers
│   │   ├── services/      # Business logic
│   │   ├── migrations/    # Database schema
│   │   └── abi/          # Contract ABIs
│   └── dist/          # Compiled JavaScript
│
└── web/               # Frontend (Next.js 14 + TypeScript)
    ├── src/
    │   ├── app/          # App router pages
    │   ├── components/   # React components
    │   ├── services/     # API client
    │   └── stores/       # State management (Zustand)
    └── public/       # Static assets
```

## Technology Stack

### Smart Contracts
- **Solidity** ^0.8.24
- **Foundry** - Development framework
- **OpenZeppelin** - Secure contract libraries
- **ERC-4626** - Tokenized vault standard
- **ERC-721** - NFT standard for invoices
- **Mantle Sepolia** - Testnet deployment

### Backend
- **Node.js** with **Express**
- **TypeScript** for type safety
- **PostgreSQL** - Primary database
- **Ethers.js** v6 - Blockchain interaction
- **AWS S3** - File storage
- **Pinata** - IPFS pinning service

### Frontend
- **Next.js 14** with App Router
- **React 19** with TypeScript
- **Privy** - Wallet authentication
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **Axios** - HTTP client

### Infrastructure
- **Supabase** - PostgreSQL database hosting
- **IPFS/Pinata** - Decentralized file storage for NFT metadata

## Prerequisites

### Required for Local Development

- **Node.js** v20+ and npm
- **Foundry** installed ([installation guide](https://book.getfoundry.sh/getting-started/installation))
- **Mantle Sepolia testnet MNT** - Get from [faucet](https://faucet.sepolia.mantle.xyz/)
- **Supabase account** - For PostgreSQL database ([sign up](https://supabase.com/))

### Required API Keys

- **Mantle Explorer API Key** - For contract verification ([get key](https://sepolia.mantlescan.xyz/myapikey))
- **Privy App ID & Client ID** - For wallet authentication ([create app](https://dashboard.privy.io/))
- **Pinata API Keys** - For IPFS storage ([sign up](https://app.pinata.cloud/))

## Local Development Setup

This guide will help you set up and run the entire project locally for development.

### 1. Clone Repository

```bash
git clone https://github.com/your-org/factoring-square-mantle.git
cd factoring-square-mantle
```

### 2. Deploy Smart Contracts to Mantle Sepolia Testnet

```bash
cd contracts

# Copy and configure environment variables
cp .env.example .env

# Edit .env with your values:
# RPC_URL=https://rpc.sepolia.mantle.xyz
# PRIVATE_KEY=your_private_key (must have testnet MNT)
# ETHERSCAN_API_KEY=your_mantle_explorer_api_key

# Install dependencies
forge install

# Build contracts
forge build

# Run tests (optional but recommended)
forge test

# Deploy all contracts to Mantle Sepolia testnet
# This deploys: MockUSDC, VaultFactory, InvoiceNFT, Treasury
make deploy-all

# Generate ABIs for frontend and backend
make generate-all-abis
```

After deployment, the Makefile will automatically update `.env` files in `contracts/`, `api/`, and `web/` directories with deployed contract addresses.

**Note**: You need testnet MNT tokens in your wallet. Get them from the [Mantle Sepolia Faucet](https://faucet.sepolia.mantle.xyz/).

### 3. Setup Database

This project uses **Supabase** as the PostgreSQL database provider.

1. **Create a Supabase account** at [https://supabase.com/](https://supabase.com/)

2. **Create a new project**:
   - Go to your Supabase dashboard
   - Click "New Project"
   - Choose organization
   - Set project name (e.g., "factoring-square")
   - Set a strong database password
   - Select region closest to your API server
   - Click "Create new project"

3. **Get your connection string**:
   - Go to Project Settings → Database
   - Find "Connection string" section
   - Copy the "URI" connection string (it will look like):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxxx.supabase.co:5432/postgres
   ```
   - Replace `[YOUR-PASSWORD]` with your actual database password

4. **Configure connection pooling** (recommended):
   - In Supabase, go to Project Settings → Database
   - Use the "Connection pooling" string for better performance:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxxx.supabase.co:6543/postgres?pgbouncer=true
   ```

**Note**: The database migrations will automatically create all required tables when you run `npm run migrate` in the API setup step.

### 4. Setup and Run Backend API

```bash
cd api

# Install dependencies
npm install

# Copy and configure environment
cp .env.example .env

# Edit .env with your values:
# PORT=3001
# DATABASE_CONNECTION_STRING=<your_supabase_connection_string>
# RPC_URL=https://rpc.sepolia.mantle.xyz
# PRIVATE_KEY=your_private_key
# VAULT_FACTORY_ADDRESS=<automatically set by Makefile>
# USDC_ADDRESS=<automatically set by Makefile>
# INVOICE_NFT_ADDRESS=<automatically set by Makefile>
# TREASURY_ADDRESS=<automatically set by Makefile>
# PINATA_API_KEY=your_pinata_key
# PINATA_API_SECRET=your_pinata_secret
# PINATA_JWT=your_pinata_jwt
# INVOICE_NFT_INVOICE_IMAGE=<IPFS URL for default NFT image>

# Run database migrations (creates all tables)
npm run migrate

# Start development server with hot reload
npm run dev
```

The API will be running at `http://localhost:3001`.

**Note**: The contract addresses (`VAULT_FACTORY_ADDRESS`, `USDC_ADDRESS`, etc.) were automatically added to your `.env` file by the Makefile during contract deployment. If not, copy them manually from `contracts/.env`.

### 5. Setup and Run Frontend

```bash
cd web

# Install dependencies
npm install

# Copy and configure environment
cp .env.example .env.local

# Edit .env.local:
# NEXT_PUBLIC_API_URL=localhost:3001
# NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
# NEXT_PUBLIC_PRIVY_CLIENT_ID=your_privy_client_id
# NEXT_PUBLIC_USDC_ADDRESS=<from contracts deployment>
# NEXT_PUBLIC_TREASURY_ADDRESS=<from contracts deployment>
# NEXT_PUBLIC_MANTLE_SEPOLIA_CHAIN_ID=5003

# Run development server
npm run dev
```

The frontend will be running at `http://localhost:3000`.

### 6. Access the Application

1. Open your browser and navigate to `http://localhost:3000`
2. Connect your wallet (make sure you're on Mantle Sepolia testnet)
3. Start using the platform:
   - **Borrowers**: Complete KYB and create loan requests
   - **Lenders**: Browse and fund available loans
   - **Admins**: Approve loan requests and manage the platform

## Post-Setup Configuration

### 1. Configure Privy

1. Go to [Privy Dashboard](https://dashboard.privy.io/)
2. Create a new app or select your existing app
3. In the app settings:
   - Add `http://localhost:3000` to allowed origins
   - Enable Mantle Sepolia network in supported chains
   - Configure wallet providers (MetaMask, WalletConnect, etc.)
4. Copy your `App ID` and `Client ID` and add them to `web/.env.local`

### 2. Get Test USDC Tokens

The platform includes a built-in faucet to get test USDC tokens:

1. Navigate to the faucet page in the application
2. Connect your wallet
3. Request test USDC tokens (you can request multiple times for different test wallets)

**Tip**: Use multiple test wallets to simulate different users (borrowers and lenders).

## Usage

### For Borrowers

1. **Complete KYB** - Submit business information
2. **Create Loan Request** - Upload invoice and specify terms
3. **Wait for Approval** - Admin reviews and approves
4. **Wait for Funding** - Lenders fund the vault
5. **Receive Funds** - Admin releases funds when vault is full
6. **Repay Loan** - Pay back principal + interest
7. **View History** - Track loan status and payments

### For Lenders

1. **Browse Loans** - View available lending opportunities
2. **Deposit Funds** - Contribute USDC to loan vaults
3. **Track Investments** - Monitor vault performance
4. **Redeem Shares** - Withdraw principal + interest after repayment

### For Admins

1. **Review KYB** - Verify borrower business information
2. **Approve Loans** - Approve or reject loan requests
3. **Tokenize Invoices** - Mint NFTs for approved invoices
4. **Release Funds** - Transfer funds to borrowers when vaults are fully funded
5. **Monitor System** - Track all loans, vaults, and transactions

## Smart Contract Addresses (Mantle Sepolia)

After deployment, record your contract addresses:

```
MockUSDC: 0x...
VaultFactory: 0x...
InvoiceNFT: 0x...
Treasury: 0x...
```

View on explorer: `https://sepolia.mantlescan.xyz/address/<address>`

## API Endpoints

Base URL: `https://api.yourdomain.com` or `http://localhost:3001`

### Borrower KYB
- `POST /borrowers/kybs` - Submit KYB information
- `GET /borrowers/kybs/check/:walletAddress` - Check KYB status

### Loan Requests
- `POST /loan-requests` - Create loan request
- `GET /loan-requests/:id` - Get loan details
- `GET /loan-requests/borrower/:address` - Get borrower's loans
- `POST /loan-requests/:id/approve` - Approve loan (admin)
- `PATCH /loan-requests/:id/status` - Update loan status

### Vaults
- `GET /vaults/:address` - Get vault details
- `POST /vaults/:address/lenders` - Track lender deposit
- `POST /vaults/:address/repayments` - Track repayment
- `POST /vaults/:address/release-funds` - Release funds to borrower

### NFT
- `POST /nft/tokenize/:loanRequestId` - Mint invoice NFT

## Development

### Run Tests

```bash
# Smart contracts
cd contracts
forge test

# Backend (if tests exist)
cd api
npm test

# Frontend (if tests exist)
cd web
npm test
```

### Code Linting

```bash
# Backend
cd api
npm run lint

# Frontend
cd web
npm run lint
npm run lint:fix
```

### Database Migrations

```bash
cd api

# Run pending migrations
npm run migrate

# In production
npm run migrate:prod
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT

## Support

For issues and questions:
- GitHub Issues: https://github.com/your-org/factoring-square-mantle/issues
- Documentation: [Link to docs if available]

## Acknowledgments

- Built on Mantle Network
- OpenZeppelin for secure smart contract libraries
- Privy for seamless wallet authentication
- Pinata for IPFS infrastructure

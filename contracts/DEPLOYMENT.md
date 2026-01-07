# Deployment Scripts

## Setup

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Fill in the required values in `.env`:
   - `PRIVATE_KEY`: Your wallet private key
   - `RPC_URL`: Mantle Sepolia RPC URL
   - `USDC_ADDRESS`: USDC token address on Mantle Sepolia

## Deploy VaultFactory

```bash
forge script script/DeployVaultFactory.s.sol:DeployVaultFactory --rpc-url $RPC_URL --broadcast --verify
```

Or using source command:
```bash
source .env
forge script script/DeployVaultFactory.s.sol:DeployVaultFactory --rpc-url $RPC_URL --broadcast
```

After deployment, update `VAULT_FACTORY_ADDRESS` in `.env` with the deployed address.

## Deploy Test Vault

```bash
forge script script/DeployTestVault.s.sol:DeployTestVault --rpc-url $RPC_URL --broadcast
```

### Custom Test Vault Parameters

You can override default parameters:
```bash
INVOICE_NAME=INV INVOICE_NUMBER=12345 BORROWER_ADDRESS=0x... MAX_CAPACITY=50000000000 forge script script/DeployTestVault.s.sol:DeployTestVault --rpc-url $RPC_URL --broadcast
```

## Verification

To verify contracts on explorer:
```bash
forge verify-contract <CONTRACT_ADDRESS> src/VaultFactory.sol:VaultFactory --chain mantle-sepolia --etherscan-api-key $ETHERSCAN_API_KEY --constructor-args $(cast abi-encode "constructor(address)" $USDC_ADDRESS)
```

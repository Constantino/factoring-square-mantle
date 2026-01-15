const { ethers } = require('ethers');

// Configuration
const RPC_URL = 'https://rpc.sepolia.mantle.xyz';
const VAULT_ADDRESS = '0xa3B1F62747280F18DF529f3B09b5F4FaDe9d520E';
const USDC_ADDRESS = '0x1ee2dD0affe7B538a101002be3126729D1D2A83b';
const USER_ADDRESS = '0x51259F58371e93Eb12133C7772e8483D2264B1A6';

// ABIs
const VAULT_ABI = [
    'function state() view returns (uint8)',
    'function MAX_CAPACITY() view returns (uint256)',
    'function totalAssets() view returns (uint256)',
    'function asset() view returns (address)',
    'function deposit(uint256 assets, address receiver) returns (uint256)',
    'function previewDeposit(uint256 assets) view returns (uint256)'
];

const ERC20_ABI = [
    'function balanceOf(address owner) view returns (uint256)',
    'function allowance(address owner, address spender) view returns (uint256)',
    'function decimals() view returns (uint8)'
];

async function main() {
    const provider = new ethers.JsonRpcProvider(RPC_URL);

    console.log('=== Debugging Vault Deposit Issue ===\n');

    // Check Vault state
    console.log('1. Checking Vault State:');
    const vault = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, provider);

    try {
        const state = await vault.state();
        console.log(`   Vault State: ${state} (0=FUNDING, 1=ACTIVE, 2=REPAID)`);

        const maxCapacity = await vault.MAX_CAPACITY();
        console.log(`   Max Capacity: ${ethers.formatUnits(maxCapacity, 6)} USDC`);

        const totalAssets = await vault.totalAssets();
        console.log(`   Total Assets: ${ethers.formatUnits(totalAssets, 6)} USDC`);

        const assetAddress = await vault.asset();
        console.log(`   Asset Address: ${assetAddress}`);
        console.log(`   Expected USDC: ${USDC_ADDRESS}`);
        console.log(`   Asset Match: ${assetAddress.toLowerCase() === USDC_ADDRESS.toLowerCase()}`);
    } catch (error) {
        console.log(`   ERROR: ${error.message}`);
    }

    // Check USDC token
    console.log('\n2. Checking USDC Token:');
    const usdc = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, provider);

    try {
        const userBalance = await usdc.balanceOf(USER_ADDRESS);
        console.log(`   User Balance: ${ethers.formatUnits(userBalance, 6)} USDC`);

        const allowance = await usdc.allowance(USER_ADDRESS, VAULT_ADDRESS);
        console.log(`   Allowance: ${ethers.formatUnits(allowance, 6)} USDC`);

        const vaultBalance = await usdc.balanceOf(VAULT_ADDRESS);
        console.log(`   Vault Balance: ${ethers.formatUnits(vaultBalance, 6)} USDC`);
    } catch (error) {
        console.log(`   ERROR: ${error.message}`);
    }

    // Try to preview deposit
    console.log('\n3. Testing Deposit Preview:');
    try {
        const depositAmount = ethers.parseUnits('0.8', 6);
        console.log(`   Deposit Amount: 0.8 USDC (${depositAmount.toString()} wei)`);

        const expectedShares = await vault.previewDeposit(depositAmount);
        console.log(`   Expected Shares: ${ethers.formatUnits(expectedShares, 18)}`);
    } catch (error) {
        console.log(`   ERROR: ${error.message}`);
    }

    // Check if vault contract exists
    console.log('\n4. Checking Contract Code:');
    try {
        const vaultCode = await provider.getCode(VAULT_ADDRESS);
        console.log(`   Vault Code Length: ${vaultCode.length} bytes`);
        console.log(`   Vault Exists: ${vaultCode !== '0x'}`);

        const usdcCode = await provider.getCode(USDC_ADDRESS);
        console.log(`   USDC Code Length: ${usdcCode.length} bytes`);
        console.log(`   USDC Exists: ${usdcCode !== '0x'}`);
    } catch (error) {
        console.log(`   ERROR: ${error.message}`);
    }
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });

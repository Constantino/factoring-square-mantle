const { ethers } = require('ethers');

// Configuration
const RPC_URL = 'https://rpc.sepolia.mantle.xyz';
const NEW_VAULT_ADDRESS = '0xEb383e9A9D053fe19a22D188223E468f424dB960'; // New vault from screenshot
const USDC_ADDRESS = '0xEf98e78430DB50C35e85Cd15a8E665ad485aeA5A';
const USER_ADDRESS = '0x51259F58371e93Eb12133C7772e8483D2264B1A6';

// ABIs
const VAULT_ABI = [
    'function state() view returns (uint8)',
    'function MAX_CAPACITY() view returns (uint256)',
    'function totalAssets() view returns (uint256)',
    'function asset() view returns (address)',
    'function BORROWER() view returns (address)',
    'function deposit(uint256 assets, address receiver) returns (uint256)',
    'function previewDeposit(uint256 assets) view returns (uint256)',
    'function maxDeposit(address) view returns (uint256)'
];

const ERC20_ABI = [
    'function balanceOf(address owner) view returns (uint256)',
    'function allowance(address owner, address spender) view returns (uint256)',
    'function decimals() view returns (uint8)',
    'function name() view returns (string)',
    'function symbol() view returns (string)'
];

async function main() {
    const provider = new ethers.JsonRpcProvider(RPC_URL);

    console.log('=== Debugging New Vault Deposit Issue ===\n');

    // Check if contracts exist
    console.log('0. Checking Contract Existence:');
    try {
        const vaultCode = await provider.getCode(NEW_VAULT_ADDRESS);
        const usdcCode = await provider.getCode(USDC_ADDRESS);
        console.log(`   Vault exists: ${vaultCode !== '0x'} (${vaultCode.length} bytes)`);
        console.log(`   USDC exists: ${usdcCode !== '0x'} (${usdcCode.length} bytes)`);
    } catch (error) {
        console.log(`   ERROR: ${error.message}`);
    }

    // Check Vault state
    console.log('\n1. Checking Vault State:');
    const vault = new ethers.Contract(NEW_VAULT_ADDRESS, VAULT_ABI, provider);

    try {
        const state = await vault.state();
        console.log(`   Vault State: ${state} (0=FUNDING, 1=ACTIVE, 2=REPAID)`);

        const maxCapacity = await vault.MAX_CAPACITY();
        console.log(`   Max Capacity: ${ethers.formatUnits(maxCapacity, 6)} USDC (${maxCapacity.toString()} wei)`);

        const totalAssets = await vault.totalAssets();
        console.log(`   Total Assets: ${ethers.formatUnits(totalAssets, 6)} USDC (${totalAssets.toString()} wei)`);

        const assetAddress = await vault.asset();
        console.log(`   Vault Asset Address: ${assetAddress}`);
        console.log(`   Expected USDC: ${USDC_ADDRESS}`);
        console.log(`   Asset Match: ${assetAddress.toLowerCase() === USDC_ADDRESS.toLowerCase()}`);

        const borrower = await vault.BORROWER();
        console.log(`   Borrower: ${borrower}`);

        // Check if vault can accept deposits
        const maxDepositUser = await vault.maxDeposit(USER_ADDRESS);
        console.log(`   Max Deposit for user: ${ethers.formatUnits(maxDepositUser, 6)} USDC`);
    } catch (error) {
        console.log(`   ERROR: ${error.message}`);
        console.log(`   Full error:`, error);
    }

    // Check USDC token
    console.log('\n2. Checking USDC Token:');
    const usdc = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, provider);

    try {
        const name = await usdc.name();
        const symbol = await usdc.symbol();
        console.log(`   Token: ${name} (${symbol})`);

        const userBalance = await usdc.balanceOf(USER_ADDRESS);
        console.log(`   User Balance: ${ethers.formatUnits(userBalance, 6)} USDC (${userBalance.toString()} wei)`);

        const allowance = await usdc.allowance(USER_ADDRESS, NEW_VAULT_ADDRESS);
        console.log(`   Allowance: ${ethers.formatUnits(allowance, 6)} USDC (${allowance.toString()} wei)`);

        const vaultBalance = await usdc.balanceOf(NEW_VAULT_ADDRESS);
        console.log(`   Vault USDC Balance: ${ethers.formatUnits(vaultBalance, 6)} USDC`);
    } catch (error) {
        console.log(`   ERROR: ${error.message}`);
    }

    // Try to preview deposit
    console.log('\n3. Testing Deposit Preview:');
    try {
        const depositAmount = ethers.parseUnits('0.8', 6);
        console.log(`   Attempting to preview deposit: 0.8 USDC (${depositAmount.toString()} wei)`);

        const expectedShares = await vault.previewDeposit(depositAmount);
        console.log(`   Expected Shares: ${ethers.formatUnits(expectedShares, 18)}`);
        console.log(`   Shares in wei: ${expectedShares.toString()}`);
    } catch (error) {
        console.log(`   ERROR previewing deposit: ${error.message}`);
    }

    // Try to simulate the deposit call
    console.log('\n4. Simulating Deposit Call:');
    try {
        const depositAmount = ethers.parseUnits('0.8', 6);

        // Try to estimate gas for deposit
        const result = await vault.deposit.staticCall(depositAmount, USER_ADDRESS);
        console.log(`   ✓ Static call succeeded! Would return: ${result.toString()} shares`);
    } catch (error) {
        console.log(`   ✗ Static call failed!`);
        console.log(`   Error: ${error.message}`);
        if (error.data) {
            console.log(`   Error data: ${error.data}`);
        }

        // Try to decode the error
        if (error.reason) {
            console.log(`   Reason: ${error.reason}`);
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });

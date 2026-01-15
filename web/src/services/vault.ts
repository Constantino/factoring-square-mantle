import axios from "axios";
import { ethers } from "ethers";
import { VAULT_ABI } from "@/app/abi/Vault";
import { ERC20_ABI } from "@/app/abi/ERC20";
import {NetworkSwitchError} from "@/types/errors";
import {PrivyWallet} from "@/types/providers";
import {Vault, LenderPortfolio} from "@/types/vault";

/**
 * Fetch all available vaults from the API
 * @returns Promise with array of vaults
 * @throws Error if the API call fails
 */
export async function fetchVaults(): Promise<Vault[]> {
    let apiUrl = process.env.NEXT_PUBLIC_API_URL;
    
    if (!apiUrl) {
        throw new Error("NEXT_PUBLIC_API_URL is not configured");
    }

    // Ensure the URL has a protocol
    if (!apiUrl.startsWith("http://") && !apiUrl.startsWith("https://")) {
        apiUrl = `http://${apiUrl}`;
    }

    // Remove trailing slash if present
    apiUrl = apiUrl.replace(/\/$/, "");

    const response = await axios.get(`${apiUrl}/vaults`);
    return response.data.data || [];
}
/**
 * Participate in a vault by depositing funds
 * @param vaultAddress - The address of the vault contract
 * @param amount - The amount to deposit (in USD, will be converted to wei)
 * @param wallet - The Privy wallet object
 * @param onProgress - Optional callback to report progress
 * @returns Promise with transaction hash
 */
export async function participateInVault(
    vaultAddress: string,
    amount: number,
    wallet: PrivyWallet,
    onProgress?: (step: string) => void
): Promise<string> {
    try {
        onProgress?.("Connecting to wallet...");
        
        // Get the Ethereum provider from Privy wallet
        const provider = await wallet.getEthereumProvider();
        
        // Check current network
        onProgress?.("Checking network...");
        const network = await provider.request({ method: 'eth_chainId' }) as string;
        const targetChainId = `0x${parseInt(process.env.NEXT_PUBLIC_MANTLE_SEPOLIA_CHAIN_ID || '5003').toString(16)}`;
        
        console.log('Current network:', network, 'Target:', targetChainId);
        
        // Switch to Mantle Sepolia if needed
        if (network !== targetChainId) {
            onProgress?.("Switching to Mantle Sepolia...");
            console.log('Switching to Mantle Sepolia...');
            try {
                await provider.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: targetChainId }],
                });
            } catch (switchError) {
                // Chain not added, try to add it
                const error = switchError as NetworkSwitchError;
                if (error.code === 4902) {
                    await provider.request({
                        method: 'wallet_addEthereumChain',
                        params: [{
                            chainId: targetChainId,
                            chainName: 'Mantle Sepolia',
                            nativeCurrency: {
                                name: 'MNT',
                                symbol: 'MNT',
                                decimals: 18
                            },
                            rpcUrls: ['https://rpc.sepolia.mantle.xyz'],
                            blockExplorerUrls: ['https://explorer.sepolia.mantle.xyz']
                        }],
                    });
                } else {
                    throw switchError;
                }
            }
        }
        
        const ethersProvider = new ethers.BrowserProvider(provider);
        const signer = await ethersProvider.getSigner();
        const userAddress = await signer.getAddress();

        console.log('Starting participation:', {
            vaultAddress,
            amount,
            userAddress
        });

        // Get USDC address from environment variable
        const usdcAddress = process.env.NEXT_PUBLIC_USDC_ADDRESS;
        if (!usdcAddress) {
            throw new Error("USDC address not configured");
        }
        
        console.log('USDC address:', usdcAddress);

        // Convert amount to wei (assuming 6 decimals for USDC)
        const amountInWei = ethers.parseUnits(amount.toString(), 6);
        console.log('Amount in wei:', amountInWei.toString());

        // Create ERC20 token contract instance
        const tokenContract = new ethers.Contract(usdcAddress, ERC20_ABI, signer);

        // Check current allowance
        onProgress?.("Checking allowance...");
        const currentAllowance = await tokenContract.allowance(userAddress, vaultAddress);
        console.log('Current allowance:', currentAllowance.toString());
        console.log('Required amount:', amountInWei.toString());
        console.log('Needs approval:', currentAllowance < amountInWei);

        // Approve vault to spend tokens if needed
        // Using BigInt comparison - ensure allowance is sufficient
        if (BigInt(currentAllowance.toString()) < BigInt(amountInWei.toString())) {
            onProgress?.("Step 1/2: Approving token spending...");
            console.log('Approving vault to spend tokens...');
            const approveTx = await tokenContract.approve(vaultAddress, amountInWei);
            console.log('Approval transaction sent:', approveTx.hash);

            onProgress?.("Step 1/2: Confirming approval...");
            // Wait for approval transaction to be mined
            const approvalReceipt = await approveTx.wait();
            console.log('Approval confirmed in block:', approvalReceipt?.blockNumber);

            // Add a small delay to ensure state is updated on chain
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Verify the allowance was set correctly
            const newAllowance = await tokenContract.allowance(userAddress, vaultAddress);
            console.log('New allowance after approval:', newAllowance.toString());

            if (BigInt(newAllowance.toString()) < BigInt(amountInWei.toString())) {
                throw new Error('Approval failed: insufficient allowance after transaction');
            }

            onProgress?.("Step 1/2: Approval complete! Preparing deposit...");
            // Give user a moment to see the completion message
            await new Promise(resolve => setTimeout(resolve, 1500));
        } else {
            console.log('Sufficient allowance already exists, skipping approval');
        }

        // Create vault contract instance
        const vaultContract = new ethers.Contract(vaultAddress, VAULT_ABI, signer);

        // Preview shares to be received (ERC4626 standard function)
        onProgress?.("Calculating shares...");
        const expectedShares = await vaultContract.previewDeposit(amountInWei);
        const expectedSharesStr = ethers.formatUnits(expectedShares, 18);
        console.log('Expected shares for deposit:', expectedSharesStr);

        // Deposit into vault
        onProgress?.("Step 2/2: Depositing into vault...");
        console.log('Depositing into vault...');
        const depositTx = await vaultContract.deposit(amountInWei, userAddress);
        console.log('Deposit transaction sent:', depositTx.hash);

        onProgress?.("Step 2/2: Confirming deposit...");
        // Wait for deposit transaction to be mined
        const receipt = await depositTx.wait();
        console.log('Deposit confirmed in block:', receipt.blockNumber);

        // Use the previewed shares amount (most accurate)
        console.log('Shares received from this deposit:', expectedSharesStr);

        onProgress?.("✅ Deposit successful!");
        
        // Record deposit in backend database
        try {
            onProgress?.("Recording deposit...");
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            const fullUrl = apiUrl.startsWith('http') ? apiUrl : `http://${apiUrl}`;
            
            await axios.post(
                `${fullUrl}/vaults/${vaultAddress}/deposit`,
                {
                    lenderAddress: userAddress,
                    amount: amount,
                    sharesAmount: expectedSharesStr,
                    txHash: depositTx.hash
                }
            );
            console.log('Deposit recorded in database');
        } catch (dbError) {
            // Log error but don't fail the transaction
            console.error('Failed to record deposit in database:', dbError);
            // Transaction succeeded on-chain, so we still return the hash
        }
        
        return depositTx.hash;
    } catch (error) {
        console.error("Error participating in vault:", error);
        throw error;
    }
}

/**
 * Fetch lender portfolio with redemption status
 * @param lenderAddress - The address of the lender
 * @returns Promise with array of portfolio items
 * @throws Error if the API call fails
 */
export async function fetchLenderPortfolio(lenderAddress: string): Promise<LenderPortfolio[]> {
    let apiUrl = process.env.NEXT_PUBLIC_API_URL;
    
    if (!apiUrl) {
        throw new Error("NEXT_PUBLIC_API_URL is not configured");
    }

    // Ensure the URL has a protocol
    if (!apiUrl.startsWith("http://") && !apiUrl.startsWith("https://")) {
        apiUrl = `http://${apiUrl}`;
    }

    // Remove trailing slash if present
    apiUrl = apiUrl.replace(/\/$/, "");

    const response = await axios.get(`${apiUrl}/vaults/lender/${lenderAddress}`);
    const portfolioData: LenderPortfolio[] = response.data.data || [];

    // Check each vault to see if the lender has already redeemed their shares
    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;
    if (!rpcUrl) {
        console.warn("RPC URL not configured, skipping share balance checks");
        return portfolioData;
    }

    try {
        const provider = new ethers.JsonRpcProvider(rpcUrl);

        // Get latest block number to ensure fresh reads
        const latestBlock = await provider.getBlockNumber();
        console.log(`Checking share balances at block ${latestBlock}`);

        // Check share balance for each REPAID vault
        const enhancedPortfolio = await Promise.all(
            portfolioData.map(async (item: LenderPortfolio) => {
                // Only check share balance for REPAID vaults
                if (item.status === 'REPAID') {
                    try {
                        const vaultContract = new ethers.Contract(item.vault_address, VAULT_ABI, provider);
                        
                        // Read balance from blockchain
                        const shareBalance = await vaultContract.balanceOf(lenderAddress);
                        
                        console.log(`Vault ${item.vault_address} - Share balance: ${shareBalance.toString()}`);
                        
                        // If share balance is 0, the lender has already redeemed
                        if (shareBalance === BigInt(0)) {
                            console.log(`✓ Vault ${item.vault_address} marked as REDEEMED`);
                            return { ...item, status: 'REDEEMED' };
                        }
                    } catch (error) {
                        console.error(`Error checking share balance for vault ${item.vault_address}:`, error);
                        // Return original item if check fails
                    }
                }
                return item;
            })
        );

        return enhancedPortfolio;
    } catch (error) {
        console.error("Error checking share balances:", error);
        // Return original data if check fails
        return portfolioData;
    }
}

/**
 * Redeem shares from a vault to receive USDC back
 * @param vaultAddress - The address of the vault contract
 * @param sharesToRedeem - Specific shares to redeem (for partial redemption)
 * @param lenderId - The VaultLenders record ID for tracking
 * @param wallet - The Privy wallet object
 * @param onProgress - Optional callback to report progress
 * @returns Promise with transaction hash and redeemed amount
 */
export async function redeemShares(
    vaultAddress: string,
    sharesToRedeem: bigint,
    lenderId: number,
    wallet: PrivyWallet,
    onProgress?: (step: string) => void
): Promise<{ txHash: string; redeemedAmount: number }> {
    try {
        onProgress?.("Connecting to wallet...");
        
        // Get the Ethereum provider from Privy wallet
        const provider = await wallet.getEthereumProvider();
        
        // Check current network
        onProgress?.("Checking network...");
        const network = await provider.request({ method: 'eth_chainId' }) as string;
        const targetChainId = `0x${parseInt(process.env.NEXT_PUBLIC_MANTLE_SEPOLIA_CHAIN_ID || '5003').toString(16)}`;
        
        console.log('Current network:', network, 'Target:', targetChainId);
        
        // Switch to Mantle Sepolia if needed
        if (network !== targetChainId) {
            onProgress?.("Switching to Mantle Sepolia...");
            console.log('Switching to Mantle Sepolia...');
            try {
                await provider.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: targetChainId }],
                });
            } catch (switchError) {
                const error = switchError as NetworkSwitchError;
                if (error.code === 4902) {
                    await provider.request({
                        method: 'wallet_addEthereumChain',
                        params: [{
                            chainId: targetChainId,
                            chainName: 'Mantle Sepolia',
                            nativeCurrency: {
                                name: 'MNT',
                                symbol: 'MNT',
                                decimals: 18
                            },
                            rpcUrls: ['https://rpc.sepolia.mantle.xyz'],
                            blockExplorerUrls: ['https://explorer.sepolia.mantle.xyz']
                        }],
                    });
                } else {
                    throw switchError;
                }
            }
        }
        
        const ethersProvider = new ethers.BrowserProvider(provider);
        const signer = await ethersProvider.getSigner();
        const userAddress = await signer.getAddress();

        console.log('Starting redemption:', {
            vaultAddress,
            userAddress
        });

        // Create vault contract instance
        const vaultContract = new ethers.Contract(vaultAddress, VAULT_ABI, signer);

        // Check vault state
        onProgress?.("Validating vault state...");
        const vaultState = await vaultContract.state();
        console.log('Vault state:', vaultState.toString());

        // State enum: 0 = FUNDING, 1 = ACTIVE, 2 = REPAID
        if (vaultState !== BigInt(2)) {
            const stateNames = ['FUNDING', 'ACTIVE', 'REPAID'];
            throw new Error(
                `Vault is not in REPAID state. Current state: ${stateNames[Number(vaultState)]}. ` +
                `The vault must be fully repaid before redemption.`
            );
        }

        // Get user's share balance
        onProgress?.("Checking your shares...");
        const shareBalance = await vaultContract.balanceOf(userAddress);
        console.log('User total share balance:', shareBalance.toString());
        console.log('Shares to redeem for this deposit:', sharesToRedeem.toString());

        if (shareBalance === BigInt(0)) {
            throw new Error('You have no shares to redeem in this vault');
        }

        if (shareBalance < sharesToRedeem) {
            throw new Error(`Insufficient shares. Have ${shareBalance.toString()}, need ${sharesToRedeem.toString()}`);
        }

        // Preview how much USDC will be received for these specific shares
        onProgress?.("Calculating redemption amount...");
        const previewAssets = await vaultContract.previewRedeem(sharesToRedeem);
        const redeemedAmountUsdc = parseFloat(ethers.formatUnits(previewAssets, 6));
        console.log('Will receive USDC:', redeemedAmountUsdc);

        // Redeem specific shares
        onProgress?.("Redeeming shares...");
        console.log(`Redeeming ${sharesToRedeem.toString()} shares...`);
        
        const redeemTx = await vaultContract.redeem(sharesToRedeem, userAddress, userAddress);
        console.log('Redemption transaction sent:', redeemTx.hash);

        onProgress?.("Confirming redemption...");
        // Wait for redemption transaction to be mined
        const receipt = await redeemTx.wait();
        console.log('Redemption confirmed in block:', receipt.blockNumber);

        onProgress?.("✅ Redemption successful!");

        // Record redemption in backend database
        try {
            onProgress?.("Recording redemption...");
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            const fullUrl = apiUrl.startsWith('http') ? apiUrl : `http://${apiUrl}`;

            await axios.post(
                `${fullUrl}/vaults/${vaultAddress}/redemptions`,
                {
                    lenderAddress: userAddress,
                    lenderId: lenderId,
                    sharesRedeemed: ethers.formatUnits(sharesToRedeem, 18),
                    amount: redeemedAmountUsdc,
                    txHash: redeemTx.hash
                }
            );
            console.log('Redemption recorded in database');
        } catch (dbError) {
            // Log error but don't fail the transaction
            console.error('Failed to record redemption in database:', dbError);
            // Transaction succeeded on-chain, so we still return the result
        }

        return {
            txHash: redeemTx.hash,
            redeemedAmount: redeemedAmountUsdc
        };
    } catch (error) {
        console.error("Error redeeming shares:", error);
        throw error;
    }
}

/**
 * Preview how much USDC will be received when redeeming shares for a specific deposit
 * @param vaultAddress - The address of the vault contract
 * @param depositAmount - The original deposit amount in USDC
 * @param storedShares - The shares amount stored from original deposit (if available)
 * @param wallet - The Privy wallet object
 * @returns Promise with the redeemable amount in USDC and shares to redeem
 */
export async function previewRedemption(
    vaultAddress: string,
    depositAmount: number,
    storedShares: string | number | undefined,
    wallet: PrivyWallet
): Promise<{ redeemableAmount: number; sharesToRedeem: bigint }> {
    try {
        // Get the Ethereum provider from Privy wallet
        const provider = await wallet.getEthereumProvider();

        const ethersProvider = new ethers.BrowserProvider(provider);
        const signer = await ethersProvider.getSigner();
        const userAddress = await signer.getAddress();

        // Create vault contract instance
        const vaultContract = new ethers.Contract(vaultAddress, VAULT_ABI, signer);

        let sharesToRedeem: bigint;

        if (storedShares && (typeof storedShares === 'string' ? storedShares !== '0' : storedShares > 0)) {
            // Use stored shares from deposit time (most accurate)
            sharesToRedeem = ethers.parseUnits(storedShares.toString(), 18);
            console.log(`Using stored shares from deposit: ${storedShares}`);
        } else {
            // Fallback: Convert deposit amount to shares using current rate
            // This is less accurate if share price has changed
            console.warn('No stored shares found, calculating from deposit amount (may be inaccurate)');
            const depositInWei = ethers.parseUnits(depositAmount.toString(), 6);
            sharesToRedeem = await vaultContract.convertToShares(depositInWei);
        }

        console.log(`Preview for deposit ${depositAmount} USDC:`);
        console.log(`- Shares to redeem: ${sharesToRedeem.toString()}`);

        if (sharesToRedeem === BigInt(0)) {
            return { redeemableAmount: 0, sharesToRedeem: BigInt(0) };
        }

        // Verify user has enough shares
        const userShares = await vaultContract.balanceOf(userAddress);
        if (userShares < sharesToRedeem) {
            throw new Error(`Insufficient shares. Have ${userShares.toString()}, need ${sharesToRedeem.toString()}`);
        }

        // Preview how much USDC will be received for these specific shares
        const previewAssets = await vaultContract.previewRedeem(sharesToRedeem);
        const redeemedAmountUsdc = parseFloat(ethers.formatUnits(previewAssets, 6));

        console.log(`- Will receive: ${redeemedAmountUsdc} USDC`);

        return { redeemableAmount: redeemedAmountUsdc, sharesToRedeem };
    } catch (error) {
        console.error("Error previewing redemption:", error);
        throw error;
    }
}

/**
 * Calculate total allocated capital from portfolio
 * @param portfolio - Array of lender portfolio items
 * @returns The total amount invested across all vaults
 */
export function calculateAllocatedCapital(portfolio: LenderPortfolio[]): number {
    const total = portfolio.reduce((sum, item) => {
        const amount = typeof item.amount === 'string' ? parseFloat(item.amount) : item.amount;
        return sum + (isNaN(amount) ? 0 : amount);
    }, 0);

    // Round to 6 decimals (USDC precision)
    return Math.round(total * 1e6) / 1e6;
}

/**
 * Calculate realized gains from redeemed vaults
 * @param portfolio - Array of lender portfolio items
 * @returns The total gains from redeemed vaults (difference between redeemed amount and invested amount)
 */
export function calculateRealizedGains(portfolio: LenderPortfolio[]): number {
    const redeemedVaults = portfolio.filter(item => item.lender_status === 'REDEEMED');

    const totalGains = redeemedVaults.reduce((sum, item) => {
        const investedAmount = typeof item.amount === 'string' ? parseFloat(item.amount) : item.amount;
        const redeemedAmount = typeof item.redeemed_amount === 'string' ? parseFloat(item.redeemed_amount) : (item.redeemed_amount || 0);
        const gain = redeemedAmount - investedAmount;
        return sum + (isNaN(gain) ? 0 : gain);
    }, 0);

    // Round to 6 decimals (USDC precision)
    return Math.round(totalGains * 1e6) / 1e6;
}

/**
 * Calculate unrealized gains from active vaults
 * @param portfolio - Array of lender portfolio items
 * @returns The total accrued interest from active/repaid vaults that haven't been redeemed yet
 */
export function calculateUnrealizedGains(portfolio: LenderPortfolio[]): number {
    // Filter for REPAID vaults where lender hasn't redeemed yet
    const repaidVaults = portfolio.filter(item =>
        item.status === 'REPAID' &&
        item.lender_status === 'FUNDED'
    );

    const totalUnrealizedGains = repaidVaults.reduce((sum, item) => {
        // Skip if no fund_release_at (funds haven't been released yet)
        if (!item.fund_release_at) {
            return sum;
        }

        // Skip if no maturity_date
        if (!item.maturity_date) {
            return sum;
        }

        const investedAmount = typeof item.amount === 'string' ? parseFloat(item.amount) : item.amount;
        const monthlyInterestRate = item.monthly_interest_rate || 0;

        // Calculate days between fund release and maturity date
        const fundReleaseDate = new Date(item.fund_release_at);
        const maturityDate = new Date(item.maturity_date);

        const numberOfDays = Math.floor((maturityDate.getTime() - fundReleaseDate.getTime()) / (1000 * 60 * 60 * 24));

        // If days is zero or negative, no interest accrued
        if (numberOfDays <= 0) {
            return sum;
        }

        // Calculate interest: numberOfDays * (monthly_interest_rate / 30) * invested_amount
        const dailyInterestRate = monthlyInterestRate / 30;
        const interest = numberOfDays * dailyInterestRate * investedAmount;

        // Ensure result is a valid number
        if (isNaN(interest) || !isFinite(interest)) {
            return sum;
        }

        return sum + interest;
    }, 0);

    // Round to 6 decimals (USDC precision)
    return Math.round(totalUnrealizedGains * 1e6) / 1e6;
}

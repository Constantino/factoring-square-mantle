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
            onProgress?.("Requesting approval...");
            console.log('Approving vault to spend tokens...');
            const approveTx = await tokenContract.approve(vaultAddress, amountInWei);
            console.log('Approval transaction sent:', approveTx.hash);
            
            onProgress?.("Waiting for approval confirmation...");
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
        } else {
            console.log('Sufficient allowance already exists, skipping approval');
        }

        // Create vault contract instance
        const vaultContract = new ethers.Contract(vaultAddress, VAULT_ABI, signer);

        // Deposit into vault
        onProgress?.("Depositing into vault...");
        console.log('Depositing into vault...');
        const depositTx = await vaultContract.deposit(amountInWei, userAddress);
        console.log('Deposit transaction sent:', depositTx.hash);

        onProgress?.("Waiting for deposit confirmation...");
        // Wait for deposit transaction to be mined
        const receipt = await depositTx.wait();
        console.log('Deposit confirmed in block:', receipt.blockNumber);

        onProgress?.("Success!");
        
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
 * Fetch lender portfolio
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
    return response.data.data || [];
}

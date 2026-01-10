import axios from "axios";
import { ethers } from "ethers";
import { VAULT_ABI, ERC20_ABI } from "@/lib/abis";

// Type definitions for Privy wallet
interface EthereumProvider {
    request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
}

interface PrivyWallet {
    getEthereumProvider: () => Promise<EthereumProvider>;
}

interface NetworkSwitchError {
    code: number;
    message: string;
}

export interface Vault {
    vault_id: number;
    vault_address: string;
    borrower_address: string;
    vault_name: string;
    max_capacity: string;
    current_capacity: string;
    created_at: string;
    modified_at: string;
}

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
 * @returns Promise with transaction hash
 */
export async function participateInVault(
    vaultAddress: string,
    amount: number,
    wallet: PrivyWallet
): Promise<string> {
    try {
        // Get the Ethereum provider from Privy wallet
        const provider = await wallet.getEthereumProvider();
        
        // Check current network
        const network = await provider.request({ method: 'eth_chainId' }) as string;
        const targetChainId = `0x${parseInt(process.env.NEXT_PUBLIC_MANTLE_SEPOLIA_CHAIN_ID || '5003').toString(16)}`;
        
        console.log('Current network:', network, 'Target:', targetChainId);
        
        // Switch to Mantle Sepolia if needed
        if (network !== targetChainId) {
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
        const currentAllowance = await tokenContract.allowance(userAddress, vaultAddress);
        console.log('Current allowance:', currentAllowance.toString());

        // Approve vault to spend tokens if needed
        if (currentAllowance < amountInWei) {
            console.log('Approving vault to spend tokens...');
            const approveTx = await tokenContract.approve(vaultAddress, amountInWei);
            console.log('Approval transaction sent:', approveTx.hash);
            
            // Wait for approval transaction to be mined
            await approveTx.wait();
            console.log('Approval confirmed');
        }

        // Create vault contract instance
        const vaultContract = new ethers.Contract(vaultAddress, VAULT_ABI, signer);

        // Deposit into vault
        console.log('Depositing into vault...');
        const depositTx = await vaultContract.deposit(amountInWei, userAddress);
        console.log('Deposit transaction sent:', depositTx.hash);

        // Wait for deposit transaction to be mined
        const receipt = await depositTx.wait();
        console.log('Deposit confirmed in block:', receipt.blockNumber);

        return depositTx.hash;
    } catch (error) {
        console.error("Error participating in vault:", error);
        throw error;
    }
}

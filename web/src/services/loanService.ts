import axios from "axios";
import { ethers } from "ethers";
import { getApiUrl } from "@/lib/api";
import { LoanRequest, LoanRequestWithVault } from "@/types/loan";
import { VAULT_ABI } from "@/app/abi/Vault";
import { ERC20_ABI } from "@/app/abi/ERC20";
import { PrivyWallet } from "@/types/providers";
import { NetworkSwitchError } from "@/types/errors";

/**
 * Fetches loan requests for a specific borrower address
 * @param borrowerAddress - The wallet address of the borrower
 * @returns Promise resolving to an array of loan requests
 * @throws Error if the request fails
 */
export async function getLoanRequestsByBorrower(borrowerAddress: string): Promise<LoanRequest[]> {
    if (!borrowerAddress) {
        throw new Error("Borrower address is required");
    }

    const apiUrl = getApiUrl();
    const response = await axios.get<{ data: LoanRequest[] }>(
        `${apiUrl}/loan-requests/borrower/${borrowerAddress}`
    );

    return response.data.data || [];
}

/**
 * Fetches loan requests with vault information for a specific borrower address
 * @param borrowerAddress - The wallet address of the borrower
 * @returns Promise resolving to an array of loan requests with vault information
 * @throws Error if the request fails
 */
export async function getLoanRequestsByBorrowerWithVaults(
    borrowerAddress: string
): Promise<LoanRequestWithVault[]> {
    if (!borrowerAddress) {
        throw new Error("Borrower address is required");
    }

    const apiUrl = getApiUrl();
    const response = await axios.get<{ data: LoanRequestWithVault[] }>(
        `${apiUrl}/loan-requests/borrower/${borrowerAddress}?include=vaults`
    );

    return response.data.data || [];
}

/**
 * Repay a loan by transferring USDC to the vault
 * @param vaultAddress - The address of the vault contract
 * @param amount - The amount to repay (in USD, will be converted to wei)
 * @param wallet - The Privy wallet object
 * @param onProgress - Optional callback to report progress
 * @returns Promise with transaction hash
 * @throws Error if the repayment fails
 */
export async function repayLoan(
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

        console.log('Starting loan repayment:', {
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

            onProgress?.("Step 1/2: Approval complete! Preparing repayment...");
            // Give user a moment to see the completion message
            await new Promise(resolve => setTimeout(resolve, 1500));
        } else {
            console.log('Sufficient allowance already exists, skipping approval');
        }

        // Create vault contract instance
        const vaultContract = new ethers.Contract(vaultAddress, VAULT_ABI, signer);

        // Repay loan
        onProgress?.("Step 2/2: Repaying loan...");
        console.log('Repaying loan...');
        const repayTx = await vaultContract.repay(amountInWei);
        console.log('Repayment transaction sent:', repayTx.hash);

        onProgress?.("Step 2/2: Confirming repayment...");
        // Wait for repayment transaction to be mined
        const receipt = await repayTx.wait();
        console.log('Repayment confirmed in block:', receipt.blockNumber);

        onProgress?.("✅ Repayment successful!");

        return repayTx.hash;
    } catch (error) {
        console.error("Error repaying loan:", error);
        throw error;
    }
}


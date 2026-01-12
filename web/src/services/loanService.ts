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
 * Calculate interest based on the formula:
 * numberOfDays(loanrequest.invoice_due_date - vault.fund_release_at) * (loanRequest.monthly_interest_rate / 30) * max_loan
 * @param request - The loan request with vault information
 * @returns The calculated interest amount
 */
export function calculateInterest(request: LoanRequestWithVault): number {
    console.log('request.vault_fund_release_at', request.vault_fund_release_at);
    // If fund_release_at is not available, return 0 interest (funds haven't been released yet)
    if (!request.vault_fund_release_at) {
        return 0;
    }

    console.log('request.invoice_due_date', request.invoice_due_date);
    // Validate required fields
    if (!request.invoice_due_date) {
        return 0;
    }

    console.log('request.max_loan', request.max_loan);


    const invoiceDueDate = new Date(request.invoice_due_date);
    const fundReleaseDate = new Date(request.vault_fund_release_at);
    console.log('invoiceDueDate', invoiceDueDate);
    console.log('fundReleaseDate', fundReleaseDate);

    // Validate dates are valid
    if (isNaN(invoiceDueDate.getTime()) || isNaN(fundReleaseDate.getTime())) {
        return 0;
    }

    // Calculate number of days between fund release and invoice due date
    const timeDiff = invoiceDueDate.getTime() - fundReleaseDate.getTime();
    const numberOfDays = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

    // If days is negative or zero, return 0 interest
    if (numberOfDays <= 0 || isNaN(numberOfDays)) {
        return 0;
    }

    // Calculate interest: numberOfDays * (monthly_interest_rate / 30) * max_loan
    // monthly_interest_rate is stored as a decimal (e.g., 0.05 for 5%)
    const dailyInterestRate = request.monthly_interest_rate / 30;
    const interest = numberOfDays * dailyInterestRate * request.max_loan;

    // Ensure result is a valid number
    if (isNaN(interest) || !isFinite(interest)) {
        return 0;
    }

    return interest;
}

/**
 * Calculate total debt (full loan amount + interest)
 * @param request - The loan request with vault information
 * @returns The total debt amount (principal + interest)
 */
export function getTotalDebt(request: LoanRequestWithVault): number {
    // Ensure max_loan is a valid number - handle both number and string types
    let maxLoan = 0;
    if (typeof request.max_loan === 'number') {
        maxLoan = !isNaN(request.max_loan) && isFinite(request.max_loan) ? request.max_loan : 0;
    } else if (typeof request.max_loan === 'string') {
        const parsed = parseFloat(request.max_loan);
        maxLoan = !isNaN(parsed) && isFinite(parsed) ? parsed : 0;
    }

    // If max_loan is 0 or invalid, return 0
    if (maxLoan <= 0) {
        console.warn('getTotalDebt: max_loan is invalid or 0', { max_loan: request.max_loan, request });
        return 0;
    }

    // Calculate interest (will return 0 if fund_release_at is not available)
    const interest = calculateInterest(request);
    console.log('interest', interest);
    // Total debt = principal + interest
    const total = maxLoan + interest;

    // Ensure result is a valid number, fallback to max_loan if calculation fails
    if (isNaN(total) || !isFinite(total) || total <= 0) {
        return maxLoan;
    }

    return total;
}

/**
 * Repay a loan by transferring USDC to the vault
 * @param vaultAddress - The address of the vault contract
 * @param amount - The amount to repay (in USD, will be converted to wei)
 * @param wallet - The Privy wallet object
 * @param loanRequestId - The ID of the loan request to update status
 * @param onProgress - Optional callback to report progress
 * @returns Promise with transaction hash
 * @throws Error if the repayment fails
 */
export async function repayLoan(
    vaultAddress: string,
    amount: number,
    wallet: PrivyWallet,
    loanRequestId: number,
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

        // Validate vault state and borrower before repayment
        onProgress?.("Validating vault state...");
        const [vaultState, borrowerAddress] = await Promise.all([
            vaultContract.state(),
            vaultContract.BORROWER()
        ]);

        console.log('Vault state:', vaultState.toString());
        console.log('Borrower address:', borrowerAddress);
        console.log('User address:', userAddress);

        // State enum: 0 = FUNDING, 1 = ACTIVE, 2 = REPAID
        if (vaultState !== BigInt(1)) {
            const stateNames = ['FUNDING', 'ACTIVE', 'REPAID'];
            throw new Error(
                `Vault is not in ACTIVE state. Current state: ${stateNames[Number(vaultState)]}. ` +
                `The vault must be fully funded and funds must be released before repayment.`
            );
        }

        // Check if user is the borrower
        if (borrowerAddress.toLowerCase() !== userAddress.toLowerCase()) {
            throw new Error(
                `Only the borrower can repay the loan. ` +
                `Expected borrower: ${borrowerAddress}, but connected wallet: ${userAddress}`
            );
        }

        // Repay loan
        onProgress?.("Step 2/2: Repaying loan...");
        console.log('Repaying loan...');

        // Use estimateGas to get better error messages
        try {
            await vaultContract.repay.estimateGas(amountInWei);
        } catch (estimateError: any) {
            console.error('Gas estimation failed:', estimateError);
            // Try to extract a meaningful error message
            if (estimateError.reason) {
                throw new Error(`Repayment validation failed: ${estimateError.reason}`);
            } else if (estimateError.data) {
                throw new Error(`Repayment validation failed. Check vault state and borrower address.`);
            }
            throw new Error(`Repayment validation failed: ${estimateError.message || 'Unknown error'}`);
        }

        const repayTx = await vaultContract.repay(amountInWei);
        console.log('Repayment transaction sent:', repayTx.hash);

        onProgress?.("Step 2/2: Confirming repayment...");
        // Wait for repayment transaction to be mined
        const receipt = await repayTx.wait();
        console.log('Repayment confirmed in block:', receipt.blockNumber);

        onProgress?.("✅ Repayment successful!");

        // Update loan status to PAID after successful repayment
        try {
            onProgress?.("Updating loan status...");
            const apiUrl = getApiUrl();
            await axios.patch(
                `${apiUrl}/loan-requests/${loanRequestId}/status`,
                { status: 'PAID' }
            );
            console.log('Loan status updated to PAID');
        } catch (statusError) {
            // Log error but don't fail the transaction - repayment was successful on-chain
            console.error('Failed to update loan status:', statusError);
            // Transaction succeeded on-chain, so we still return the hash
        }

        return repayTx.hash;
    } catch (error) {
        console.error("Error repaying loan:", error);
        throw error;
    }
}


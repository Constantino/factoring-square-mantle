import axios from "axios";
import { getApiUrl } from "@/lib/api";
import { LoanRequest, LoanRequestWithVault } from "@/types/loan";

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


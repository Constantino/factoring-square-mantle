import { LoanRequest } from "./loanRequest";

/**
 * Loan request with vault information
 */
export interface LoanRequestWithVault extends LoanRequest {
    vault_id: number;
    vault_address: string;
    vault_name: string;
    max_capacity: string;
    current_capacity: string;
    loan_request_id: number;
    vault_created_at: string;
    vault_modified_at: string;
    vault_fund_release_at: string | null;
}


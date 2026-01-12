export interface LoanRequest {
    id: number;
    invoice_number: string;
    invoice_amount: number;
    invoice_due_date: string;
    term: number;
    customer_name: string;
    monthly_interest_rate: number;
    max_loan: number;
    delivery_completed: boolean;
    assignment_signed: boolean;
    not_pledged: boolean;
    borrower_address: string;
    created_at: string;
    modified_at: string;
    status: string;
}

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

export interface LoansTableProps {
    loanRequests: LoanRequestWithVault[];
    isLoading: boolean;
    error: string | null;
    onView: (requestId: number) => void;
    onWithdraw: (requestId: number) => void;
    onPay: (requestId: number, amount: number, onProgress?: (step: string) => void) => Promise<string>;
}


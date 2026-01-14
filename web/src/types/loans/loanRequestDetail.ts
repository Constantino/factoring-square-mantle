import { LoanRequest } from "./loanRequest";

/**
 * Represents a lender who has deposited funds into a vault
 */
export interface VaultLender {
    lender_id: number;
    vault_id: number;
    lender_address: string;
    amount: string;
    tx_hash: string;
    created_at: string;
}

/**
 * Represents a repayment transaction made to a vault
 */
export interface VaultRepayment {
    repayment_id: number;
    vault_id: number;
    gross_amount?: string;      // Total paid by borrower (net + fee)
    fee_amount?: string;        // 1% protocol fee to treasury
    net_amount?: string;        // Amount received by vault
    amount: string;             // DEPRECATED: Use net_amount instead (kept for backward compatibility)
    tx_hash: string;
    created_at: string;
}

/**
 * Vault with full details including lenders and repayments
 */
export interface VaultWithDetails {
    vault_id: number;
    vault_address: string;
    vault_name: string;
    max_capacity: string;
    current_capacity: string;
    status: string;
    funded_at: string | null;
    fund_release_tx_hash: string | null;
    created_at: string;
    modified_at: string;
    lenders: VaultLender[];
    repayments: VaultRepayment[];
}

/**
 * Complete loan request details including all associated vaults,
 * lenders, repayments, and calculated financial metrics
 */
export interface LoanRequestDetail extends LoanRequest {
    vaults: VaultWithDetails[];
    total_funded: number;
    total_repaid: number;           // Net amount received by vault(s)
    total_fees_paid?: number;       // Total 1% protocol fees paid
    outstanding_balance: number;
}

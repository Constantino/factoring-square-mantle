import { VaultStatus } from "../types/vaultStatus";

export interface CreateVaultBody {
    invoiceName: string;
    invoiceNumber: string;
    borrowerAddress: string;
    invoiceAmount: number;
    maturityDate: number;
    loanRequestId?: number;
}

export interface DeployVaultResult {
    vaultAddress: string;
    vaultExplorerUrl: string;
    vaultName: string;
    vaultSymbol: string;
    factoryAddress: string;
    factoryExplorerUrl: string;
    invoiceNumber: string;
    borrowerAddress: string;
    maxCapacity: number;
    maturityDate: number;
    transactionHash: string;
    explorerUrl: string;
    blockNumber: number;
}

export interface Vault {
    vault_id: number;
    vault_address: string;
    borrower_address: string;
    vault_name: string;
    max_capacity: string;
    current_capacity: string;
    loan_request_id: number | null;
    status: VaultStatus;
    funded_at: Date | null;
    fund_release_tx_hash: string | null;
    created_at: Date;
    modified_at: Date;
}

// Repayment tracking validation
export interface TrackRepaymentBody {
    amount: number;          // Net amount to vault (what vault was owed)
    txHash: string;
}

// Repayment record with fee tracking
export interface VaultRepayment {
    repayment_id: number;
    vault_id: number;
    gross_amount: string;    // Total paid by borrower (net + fee)
    fee_amount: string;      // 1% fee to treasury
    net_amount: string;      // Amount to vault
    amount: string;          // DEPRECATED: same as net_amount, kept for backward compatibility
    tx_hash: string;
    created_at: string;
}
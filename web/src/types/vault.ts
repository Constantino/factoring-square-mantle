export interface Vault {
    vault_id: number;
    vault_address: string;
    borrower_address: string;
    vault_name: string;
    max_capacity: string;
    current_capacity: string;
    created_at: string;
    modified_at: string;
}export interface LenderPortfolio {
    lender_id: number;
    lender_address: string;
    amount: string;
    tx_hash: string;
    created_at: string;
    vault_id: number;
    vault_address: string;
    vault_name: string;
    borrower_address: string;
    max_capacity: string;
    current_capacity: string;
}

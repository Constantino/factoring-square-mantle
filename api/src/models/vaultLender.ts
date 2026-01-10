export interface VaultLender {
    lender_id: number;
    vault_id: number;
    lender_address: string;
    amount: string;
    tx_hash: string;
    created_at: Date;
}

export interface CreateVaultLenderBody {
    lenderAddress: string;
    amount: number;
    txHash: string;
}

-- Create VaultRepayments table
CREATE TABLE IF NOT EXISTS "VaultRepayments" (
    repayment_id SERIAL PRIMARY KEY,
    vault_id INTEGER NOT NULL,
    amount DECIMAL(18, 2) NOT NULL,
    tx_hash VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Foreign key constraint
    CONSTRAINT fk_vault_repayments_vault
        FOREIGN KEY (vault_id) 
        REFERENCES "Vaults"(vault_id)
        ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_vault_repayments_vault_id ON "VaultRepayments"(vault_id);
CREATE INDEX IF NOT EXISTS idx_vault_repayments_tx_hash ON "VaultRepayments"(tx_hash);
CREATE INDEX IF NOT EXISTS idx_vault_repayments_created_at ON "VaultRepayments"(created_at);

-- Add comment explaining the table
COMMENT ON TABLE "VaultRepayments" IS 'Tracks all repayment transactions made by borrowers to vaults';
COMMENT ON COLUMN "VaultRepayments".amount IS 'Amount repaid in USDC';
COMMENT ON COLUMN "VaultRepayments".tx_hash IS 'Blockchain transaction hash of the repayment';

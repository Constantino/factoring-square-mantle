-- Create VaultLenders table
CREATE TABLE IF NOT EXISTS "VaultLenders" (
    lender_id SERIAL PRIMARY KEY,
    vault_id INTEGER NOT NULL,
    lender_address VARCHAR(255) NOT NULL,
    amount DECIMAL(18, 6) NOT NULL,
    tx_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Foreign key constraint
    CONSTRAINT fk_vault
        FOREIGN KEY(vault_id) 
        REFERENCES "Vaults"(vault_id)
        ON DELETE CASCADE
);

-- Create an index on vault_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_vault_lenders_vault_id ON "VaultLenders"(vault_id);

-- Create an index on lender_address for faster lookups
CREATE INDEX IF NOT EXISTS idx_vault_lenders_lender_address ON "VaultLenders"(lender_address);

-- Create an index on tx_hash for faster lookups
CREATE INDEX IF NOT EXISTS idx_vault_lenders_tx_hash ON "VaultLenders"(tx_hash);

-- Create a unique constraint to prevent duplicate deposits with same tx_hash
CREATE UNIQUE INDEX IF NOT EXISTS idx_vault_lenders_tx_hash_unique ON "VaultLenders"(tx_hash);

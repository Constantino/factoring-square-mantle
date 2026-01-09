-- Create Vaults table
CREATE TABLE IF NOT EXISTS "Vaults" (
    vault_id SERIAL PRIMARY KEY,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    modified_at TIMESTAMP NOT NULL DEFAULT NOW(),
    vault_address VARCHAR(255) NOT NULL,
    borrower_address VARCHAR(255) NOT NULL,
    vault_name VARCHAR(255) NOT NULL,
    max_capacity DECIMAL(18, 2) NOT NULL,
    current_capacity DECIMAL(18, 2) NOT NULL DEFAULT 0
);

-- Create an index on created_at for better query performance
CREATE INDEX IF NOT EXISTS idx_vaults_created_at ON "Vaults"(created_at);

-- Create an index on vault_address for faster lookups
CREATE INDEX IF NOT EXISTS idx_vaults_vault_address ON "Vaults"(vault_address);

-- Create an index on borrower_address for faster lookups
CREATE INDEX IF NOT EXISTS idx_vaults_borrower_address ON "Vaults"(borrower_address);

-- Create an index on max_capacity for filtering/sorting
CREATE INDEX IF NOT EXISTS idx_vaults_max_capacity ON "Vaults"(max_capacity);

-- Create an index on current_capacity for filtering/sorting
CREATE INDEX IF NOT EXISTS idx_vaults_current_capacity ON "Vaults"(current_capacity);

-- Create a trigger to automatically update modified_at on row updates
CREATE TRIGGER update_vaults_modified_at
    BEFORE UPDATE ON "Vaults"
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_at_column();

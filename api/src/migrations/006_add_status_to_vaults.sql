-- Add status column to Vaults table
ALTER TABLE "Vaults"
ADD COLUMN status VARCHAR(50) NOT NULL DEFAULT 'PENDING';

-- Add funded_at column to track when vault was fully funded
ALTER TABLE "Vaults"
ADD COLUMN funded_at TIMESTAMP NULL;

-- Add fund_release_tx_hash to track the blockchain transaction
ALTER TABLE "Vaults"
ADD COLUMN fund_release_tx_hash VARCHAR(255) NULL;

-- Create an index on status for faster filtering
CREATE INDEX IF NOT EXISTS idx_vaults_status ON "Vaults"(status);

-- Add comment explaining status values
COMMENT ON COLUMN "Vaults".status IS 'Vault lifecycle status: PENDING, FUNDING, FUNDED, RELEASED, MATURED, DEFAULTED';

-- Add fund_release_at column to Vaults table
ALTER TABLE "Vaults"
ADD COLUMN fund_release_at TIMESTAMP NULL;

-- Create an index on fund_release_at for faster filtering/sorting
CREATE INDEX IF NOT EXISTS idx_vaults_fund_release_at ON "Vaults"(fund_release_at);

-- Add comment explaining the column
COMMENT ON COLUMN "Vaults".fund_release_at IS 'Timestamp when funds were released from the vault';


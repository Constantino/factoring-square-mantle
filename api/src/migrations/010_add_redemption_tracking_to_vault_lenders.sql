-- Add redemption tracking columns to VaultLenders table
-- This allows tracking partial redemptions for each individual deposit

-- Add status column to track if deposit has been redeemed
ALTER TABLE "VaultLenders" 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'FUNDED';

-- Add shares_amount to track the exact shares received for this deposit
ALTER TABLE "VaultLenders" 
ADD COLUMN IF NOT EXISTS shares_amount DECIMAL(18, 6);

-- Add redeemed_amount to track how much USDC was received on redemption
ALTER TABLE "VaultLenders" 
ADD COLUMN IF NOT EXISTS redeemed_amount DECIMAL(18, 6) DEFAULT 0;

-- Add redemption_tx_hash to track the redemption transaction
ALTER TABLE "VaultLenders" 
ADD COLUMN IF NOT EXISTS redemption_tx_hash VARCHAR(255);

-- Add redeemed_at timestamp to track when the redemption happened
ALTER TABLE "VaultLenders" 
ADD COLUMN IF NOT EXISTS redeemed_at TIMESTAMP;

-- Create index on status for faster filtering
CREATE INDEX IF NOT EXISTS idx_vault_lenders_status ON "VaultLenders"(status);

-- Create index on lender_address + status for faster portfolio queries
CREATE INDEX IF NOT EXISTS idx_vault_lenders_lender_status ON "VaultLenders"(lender_address, status);

-- Add comment explaining status values
COMMENT ON COLUMN "VaultLenders".status IS 'Status of the lender deposit: FUNDED (deposit made, not redeemed yet), REDEEMED (shares have been redeemed for USDC)';

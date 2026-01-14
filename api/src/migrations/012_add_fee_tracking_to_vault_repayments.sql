-- Add fee tracking columns to VaultRepayments table
-- This migration adds columns to track the 1% protocol fee on loan repayments

-- Add new columns for fee tracking
ALTER TABLE "VaultRepayments"
ADD COLUMN gross_amount DECIMAL(18, 6),      -- Total amount borrower paid (including fee)
ADD COLUMN fee_amount DECIMAL(18, 6),        -- 1% fee sent to treasury
ADD COLUMN net_amount DECIMAL(18, 6);        -- Amount received by vault (same as 'amount')

-- Backfill existing records
-- For old repayments (before fee system), there were no fees
-- So: gross_amount = amount, fee_amount = 0, net_amount = amount
UPDATE "VaultRepayments"
SET
    gross_amount = amount,
    fee_amount = 0,
    net_amount = amount
WHERE gross_amount IS NULL;

-- Make new columns NOT NULL after backfill
ALTER TABLE "VaultRepayments"
ALTER COLUMN gross_amount SET NOT NULL,
ALTER COLUMN fee_amount SET NOT NULL,
ALTER COLUMN net_amount SET NOT NULL;

-- Add default values for future inserts (in case someone forgets to specify)
ALTER TABLE "VaultRepayments"
ALTER COLUMN gross_amount SET DEFAULT 0,
ALTER COLUMN fee_amount SET DEFAULT 0,
ALTER COLUMN net_amount SET DEFAULT 0;

-- Add comments explaining each column
COMMENT ON COLUMN "VaultRepayments".gross_amount IS 'Total amount borrower paid (net_amount + fee_amount). Example: if borrower owes $8, they pay $8.08';
COMMENT ON COLUMN "VaultRepayments".fee_amount IS '1% protocol fee sent to treasury. Example: 1% of $8 = $0.08';
COMMENT ON COLUMN "VaultRepayments".net_amount IS 'Net amount received by vault (what the vault was actually owed). Example: $8';
COMMENT ON COLUMN "VaultRepayments".amount IS 'DEPRECATED: Use net_amount instead. Kept for backward compatibility';

-- Create index for fee analytics
CREATE INDEX IF NOT EXISTS idx_vault_repayments_fee_amount ON "VaultRepayments"(fee_amount);

-- Note: The relationship between columns is:
-- gross_amount = net_amount + fee_amount
-- fee_amount = net_amount * 0.01 (1%)
--
-- Example:
-- If a borrower owes $100 to the vault:
--   net_amount = $100.00 (what vault receives)
--   fee_amount = $1.00 (1% fee to treasury)
--   gross_amount = $101.00 (total paid by borrower)

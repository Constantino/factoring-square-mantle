-- Fix shares_amount precision loss issue
-- Change from DECIMAL(18,6) to TEXT to preserve full precision
-- Shares use 18 decimals and lose precision in DECIMAL(18,6)

ALTER TABLE "VaultLenders" 
ALTER COLUMN shares_amount TYPE TEXT;

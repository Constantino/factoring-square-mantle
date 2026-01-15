-- Add token_address column to LoanRequests table
ALTER TABLE "LoanRequests"
ADD COLUMN IF NOT EXISTS token_address VARCHAR(255);

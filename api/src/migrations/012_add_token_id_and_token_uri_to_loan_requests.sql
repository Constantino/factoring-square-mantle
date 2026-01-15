-- Add token_id and token_uri columns to LoanRequests table
ALTER TABLE "LoanRequests"
ADD COLUMN IF NOT EXISTS token_id INTEGER;

ALTER TABLE "LoanRequests"
ADD COLUMN IF NOT EXISTS token_uri TEXT;

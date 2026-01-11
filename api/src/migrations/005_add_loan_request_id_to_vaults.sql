-- Add loan_request_id column to Vaults table
ALTER TABLE "Vaults"
ADD COLUMN IF NOT EXISTS loan_request_id INTEGER;

-- Add foreign key constraint to LoanRequests table
ALTER TABLE "Vaults"
ADD CONSTRAINT fk_vaults_loan_request_id
FOREIGN KEY (loan_request_id) REFERENCES "LoanRequests"(id)
ON DELETE SET NULL;

-- Create an index on loan_request_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_vaults_loan_request_id ON "Vaults"(loan_request_id);


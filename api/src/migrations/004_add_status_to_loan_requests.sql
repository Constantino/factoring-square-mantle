-- Add status column to LoanRequests table
ALTER TABLE "LoanRequests"
ADD COLUMN IF NOT EXISTS status VARCHAR(50) NOT NULL DEFAULT 'listed';

-- Create an index on status for faster filtering/sorting
CREATE INDEX IF NOT EXISTS idx_loan_requests_status ON "LoanRequests"(status);


-- Add invoice_file_url column to LoanRequests table
ALTER TABLE "LoanRequests"
ADD COLUMN IF NOT EXISTS invoice_file_url TEXT;

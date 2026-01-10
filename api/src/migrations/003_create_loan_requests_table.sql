-- Drop existing table if it exists (with CASCADE to drop dependent objects)
DROP TABLE IF EXISTS "LoanRequests" CASCADE;

-- Create LoanRequests table
CREATE TABLE IF NOT EXISTS "LoanRequests" (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    modified_at TIMESTAMP NOT NULL DEFAULT NOW(),
    invoice_number VARCHAR(255) NOT NULL,
    invoice_amount DECIMAL(18, 2) NOT NULL,
    invoice_due_date DATE NOT NULL,
    term INTEGER NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    delivery_completed BOOLEAN NOT NULL DEFAULT FALSE,
    advance_rate DECIMAL(5, 4) NOT NULL,
    monthly_interest_rate DECIMAL(5, 4) NOT NULL,
    max_loan DECIMAL(18, 2) NOT NULL,
    not_pledged BOOLEAN NOT NULL DEFAULT FALSE,
    assignment_signed BOOLEAN NOT NULL DEFAULT FALSE,
    borrower_address VARCHAR(255) NOT NULL
);

-- Create an index on created_at for better query performance
CREATE INDEX IF NOT EXISTS idx_loan_requests_created_at ON "LoanRequests"(created_at);

-- Create an index on invoice_number for faster lookups
CREATE INDEX IF NOT EXISTS idx_loan_requests_invoice_number ON "LoanRequests"(invoice_number);

-- Create an index on borrower_address for faster lookups
CREATE INDEX IF NOT EXISTS idx_loan_requests_borrower_address ON "LoanRequests"(borrower_address);

-- Create an index on invoice_due_date for filtering/sorting
CREATE INDEX IF NOT EXISTS idx_loan_requests_invoice_due_date ON "LoanRequests"(invoice_due_date);

-- Create an index on customer_name for searching
CREATE INDEX IF NOT EXISTS idx_loan_requests_customer_name ON "LoanRequests"(customer_name);

-- Create a trigger to automatically update modified_at on row updates
CREATE TRIGGER update_loan_requests_modified_at
    BEFORE UPDATE ON "LoanRequests"
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_at_column();

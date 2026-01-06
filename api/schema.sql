-- Create LoanRequest table
CREATE TABLE IF NOT EXISTS LoanRequest (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    business_name VARCHAR(255) NOT NULL
);

-- Create an index on created_at for better query performance
CREATE INDEX IF NOT EXISTS idx_loan_request_created_at ON LoanRequest(created_at);


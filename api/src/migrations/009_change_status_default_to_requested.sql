-- Change default status from 'LISTED' to 'REQUESTED'
ALTER TABLE "LoanRequests"
ALTER COLUMN status SET DEFAULT 'REQUESTED';

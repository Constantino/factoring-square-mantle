import { Request, Response } from 'express';
import { pool } from '../config/database';
import { LoanRequest, LoanRequestBody } from '../models/loanRequest';
import { validateRequest } from '../validators/loanRequestValidators';
import { validateWalletAddress } from '../validators/walletAddressValidator';
import { sanitizeLoanRequestRequest, sanitizeWalletAddress } from '../utils/sanitize';
import { vaultService } from '../services/vaultService';

const saveLoanRequest = async (params: LoanRequestBody): Promise<LoanRequest> => {
    const query = `
        INSERT INTO "LoanRequests" (
            invoice_number,
            invoice_amount,
            invoice_due_date,
            term,
            customer_name,
            delivery_completed,
            advance_rate,
            monthly_interest_rate,
            max_loan,
            not_pledged,
            assignment_signed,
            borrower_address,
            created_at,
            modified_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
        RETURNING 
            id,
            created_at,
            modified_at,
            invoice_number,
            invoice_amount,
            invoice_due_date,
            term,
            customer_name,
            delivery_completed,
            advance_rate,
            monthly_interest_rate,
            max_loan,
            not_pledged,
            assignment_signed,
            borrower_address
    `;

    const result = await pool.query<LoanRequest>(query, [
        params.invoice_number,
        params.invoice_amount,
        params.invoice_due_date,
        params.term,
        params.customer_name,
        params.delivery_completed,
        params.advance_rate,
        params.monthly_interest_rate,
        params.max_loan,
        params.not_pledged,
        params.assignment_signed,
        params.borrower_address,
    ]);

    return result.rows[0];
};

export const getLoanRequestByBorrowerAddress = async (req: Request, res: Response): Promise<void> => {
    try {
        const { borrowerAddress } = req.params;

        // Sanitize input
        const sanitizedAddress = sanitizeWalletAddress(borrowerAddress);

        // Validate input
        const validationError = validateWalletAddress(sanitizedAddress);
        if (validationError) {
            res.status(400).json({
                error: validationError
            });
            return;
        }

        // Query database
        const query = `
            SELECT 
                id,
                created_at,
                modified_at,
                invoice_number,
                invoice_amount,
                invoice_due_date,
                term,
                customer_name,
                delivery_completed,
                advance_rate,
                monthly_interest_rate,
                max_loan,
                not_pledged,
                assignment_signed,
                borrower_address,
                status
            FROM "LoanRequests"
            WHERE borrower_address = $1
            ORDER BY created_at DESC
        `;

        const result = await pool.query<LoanRequest>(query, [sanitizedAddress]);

        res.status(200).json({
            message: 'Loan requests retrieved successfully',
            data: result.rows,
            count: result.rows.length
        });
    } catch (error) {
        console.error('Error retrieving loan requests by borrower address:', error);
        res.status(500).json({
            error: 'Failed to retrieve loan requests',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

export const getLoanRequestById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        // Validate input
        const loanRequestId = parseInt(id, 10);
        if (isNaN(loanRequestId) || loanRequestId <= 0) {
            res.status(400).json({
                error: 'Invalid loan request ID. ID must be a positive integer'
            });
            return;
        }

        // Query database
        const query = `
            SELECT 
                id,
                created_at,
                modified_at,
                invoice_number,
                invoice_amount,
                invoice_due_date,
                term,
                customer_name,
                delivery_completed,
                advance_rate,
                monthly_interest_rate,
                max_loan,
                not_pledged,
                assignment_signed,
                borrower_address,
                status
            FROM "LoanRequests"
            WHERE id = $1
        `;

        const result = await pool.query<LoanRequest>(query, [loanRequestId]);

        if (result.rows.length === 0) {
            res.status(404).json({
                error: 'Loan request not found'
            });
            return;
        }

        res.status(200).json({
            message: 'Loan request retrieved successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error retrieving loan request:', error);
        res.status(500).json({
            error: 'Failed to retrieve loan request',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

export const createLoanRequest = async (req: Request, res: Response): Promise<void> => {
    try {
        // Sanitize input data
        const sanitizedData = sanitizeLoanRequestRequest(req.body);

        // Validate request
        const validationError = validateRequest(sanitizedData);
        if (validationError) {
            res.status(400).json({ error: validationError });
            return;
        }

        const {
            invoice_number,
            invoice_amount,
            invoice_due_date,
            term,
            customer_name,
            delivery_completed,
            advance_rate,
            monthly_interest_rate,
            max_loan,
            not_pledged,
            assignment_signed,
            borrower_address,
        } = sanitizedData;

        // Insert into database
        const loanRequest = await saveLoanRequest({
            invoice_number,
            invoice_amount,
            invoice_due_date,
            term,
            customer_name,
            delivery_completed,
            advance_rate,
            monthly_interest_rate,
            max_loan,
            not_pledged,
            assignment_signed,
            borrower_address,
        });

        // Create vault for the loan request
        try {
            // Convert invoice_due_date to Unix timestamp (seconds)
            const maturityDate = Math.floor(new Date(loanRequest.invoice_due_date).getTime() / 1000);

            const vaultResult = await vaultService.createVault({
                invoiceName: loanRequest.customer_name,
                invoiceNumber: loanRequest.invoice_number,
                borrowerAddress: loanRequest.borrower_address,
                invoiceAmount: loanRequest.max_loan,
                maturityDate: maturityDate
            });

            res.status(201).json({
                message: 'Loan request created successfully',
                data: loanRequest,
                vault: vaultResult
            });
        } catch (vaultError) {
            console.error('Error creating vault for loan request:', vaultError);
            // Still return success for loan request, but include vault error
            res.status(201).json({
                message: 'Loan request created successfully, but vault creation failed',
                data: loanRequest,
                vaultError: vaultError instanceof Error ? vaultError.message : 'Unknown error'
            });
        }
    } catch (error) {
        console.error('Error creating loan request:', error);
        res.status(500).json({
            error: 'Failed to create loan request',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};


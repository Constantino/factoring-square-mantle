import { Request, Response } from 'express';
import { pool } from '../config/database';
import { LoanRequest, LoanRequestBody } from '../models/loanRequest';
import { validateRequest, validateChangeLoanStatusRequest, validateLoanStatusQueryParam, validateLoanId } from '../validators/loanRequestValidators';
import { validateWalletAddress } from '../validators/walletAddressValidator';
import { sanitizeLoanRequestRequest, sanitizeWalletAddress } from '../utils/sanitize';
import { vaultService } from '../services/vaultService';
import { loanService } from '../services/loanService';
import { LoanStatus } from '../types/loanStatus';

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

const getLoanRequestsByBorrowerAddressQuery = async (
    borrowerAddress: string,
    includeVaults: boolean
): Promise<any[]> => {
    // Query database - conditionally join with Vaults if includeVaults is true
    const query = includeVaults
        ? `
            SELECT 
                lr.id,
                lr.created_at,
                lr.modified_at,
                lr.invoice_number,
                lr.invoice_amount,
                lr.invoice_due_date,
                lr.term,
                lr.customer_name,
                lr.delivery_completed,
                lr.advance_rate,
                lr.monthly_interest_rate,
                lr.max_loan,
                lr.not_pledged,
                lr.assignment_signed,
                lr.borrower_address,
                lr.status,
                v.vault_id,
                v.vault_address,
                v.vault_name,
                v.max_capacity,
                v.current_capacity,
                v.loan_request_id,
                v.created_at as vault_created_at,
                v.modified_at as vault_modified_at,
                v.fund_release_at as vault_fund_release_at
            FROM "LoanRequests" lr
            LEFT JOIN "Vaults" v ON v.loan_request_id = lr.id
            WHERE lr.borrower_address = $1
            ORDER BY lr.created_at DESC
        `
        : `
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

    const result = await pool.query(query, [borrowerAddress]);
    return result.rows;
};

export const getLoanRequestByBorrowerAddress = async (req: Request, res: Response): Promise<void> => {
    try {
        const { borrowerAddress } = req.params;
        const { include } = req.query;

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

        // Check if vaults should be included
        const includeVaults = include === 'vaults';

        // Query database
        const rows = await getLoanRequestsByBorrowerAddressQuery(sanitizedAddress, includeVaults);

        res.status(200).json({
            message: includeVaults
                ? 'Loan requests with vault info retrieved successfully'
                : 'Loan requests retrieved successfully',
            data: rows,
            count: rows.length
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

        res.status(201).json({
            message: 'Loan request created successfully',
            data: loanRequest
        });

        // // Create vault for the loan request
        // try {
        //     // Convert invoice_due_date to Unix timestamp (seconds)
        //     const maturityDate = Math.floor(new Date(loanRequest.invoice_due_date).getTime() / 1000);

        //     const vaultResult = await vaultService.createVault({
        //         invoiceName: loanRequest.customer_name,
        //         invoiceNumber: loanRequest.invoice_number,
        //         borrowerAddress: loanRequest.borrower_address,
        //         invoiceAmount: loanRequest.max_loan,
        //         maturityDate: maturityDate,
        //         loanRequestId: loanRequest.id
        //     });

        //     res.status(201).json({
        //         message: 'Loan request created successfully',
        //         data: loanRequest,
        //         vault: vaultResult
        //     });
        // } catch (vaultError) {
        //     console.error('Error creating vault for loan request:', vaultError);
        //     // Still return success for loan request, but include vault error
        //     res.status(201).json({
        //         message: 'Loan request created successfully, but vault creation failed',
        //         data: loanRequest,
        //         vaultError: vaultError instanceof Error ? vaultError.message : 'Unknown error'
        //     });
        // }
    } catch (error) {
        console.error('Error creating loan request:', error);
        res.status(500).json({
            error: 'Failed to create loan request',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

export const changeLoanStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        // Validate request
        const validationError = validateChangeLoanStatusRequest(id, status);
        if (validationError) {
            res.status(400).json({
                error: validationError
            });
            return;
        }

        // Parse loan ID (already validated)
        const loanRequestId = parseInt(id, 10);

        // Change loan status
        await loanService.changeLoanStatus(loanRequestId, status as LoanStatus);

        res.status(200).json({
            message: 'Loan status updated successfully',
            data: {
                loanId: loanRequestId,
                status: status
            }
        });
    } catch (error) {
        console.error('Error changing loan status:', error);
        res.status(500).json({
            error: 'Failed to change loan status',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

export const getLoanStatsByBorrowerAddress = async (req: Request, res: Response): Promise<void> => {
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

        // Get loan stats
        const stats = await loanService.getLoanStatsByBorrower(sanitizedAddress);

        res.status(200).json({
            message: 'Loan stats retrieved successfully',
            data: stats
        });
    } catch (error) {
        console.error('Error retrieving loan stats by borrower address:', error);
        res.status(500).json({
            error: 'Failed to retrieve loan stats',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

export const getLoanRequestByIdWithDetails = async (req: Request, res: Response): Promise<void> => {
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

        // Get loan request details with all related data
        const loanDetails = await loanService.getLoanRequestDetails(loanRequestId);

        res.status(200).json({
            message: 'Loan request details retrieved successfully',
            data: loanDetails
        });
    } catch (error) {
        console.error('Error retrieving loan request details:', error);

        // Check if loan not found
        if (error instanceof Error && error.message.includes('not found')) {
            res.status(404).json({
                error: 'Loan request not found',
                details: error.message
            });
            return;
        }

        res.status(500).json({
            error: 'Failed to retrieve loan request details',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

export const approveLoanRequest = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        // Validate input
        const validationError = validateLoanId(id);
        if (validationError) {
            res.status(400).json({
                error: validationError
            });
            return;
        }

        const loanRequestId = parseInt(id as string, 10);

        // Get loan request details
        const query = `
            SELECT 
                id,
                invoice_number,
                invoice_amount,
                invoice_due_date,
                customer_name,
                borrower_address,
                max_loan,
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

        const loanRequest = result.rows[0];

        // Check if loan request is in REQUESTED status
        if (loanRequest.status !== LoanStatus.REQUESTED) {
            res.status(400).json({
                error: `Cannot approve loan request. Current status is ${loanRequest.status}. Only REQUESTED loans can be approved.`
            });
            return;
        }

        // Change loan status to LISTED
        await loanService.changeLoanStatus(loanRequestId, LoanStatus.LISTED);

        // Convert invoice_due_date to Unix timestamp (seconds)
        const maturityDate = Math.floor(new Date(loanRequest.invoice_due_date).getTime() / 1000);

        // Create vault for the loan request
        const vaultResult = await vaultService.createVault({
            invoiceName: loanRequest.customer_name,
            invoiceNumber: loanRequest.invoice_number,
            borrowerAddress: loanRequest.borrower_address,
            invoiceAmount: loanRequest.max_loan,
            maturityDate: maturityDate,
            loanRequestId: loanRequest.id
        });

        res.status(200).json({
            message: 'Loan request approved and vault created successfully',
            data: {
                loanRequestId: loanRequest.id,
                status: LoanStatus.LISTED,
                vault: vaultResult
            }
        });
    } catch (error) {
        console.error('Error approving loan request:', error);
        res.status(500).json({
            error: 'Failed to approve loan request',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

export const getAllLoanRequests = async (req: Request, res: Response): Promise<void> => {
    try {
        const { status } = req.query;

        // Validate status parameter
        const validationResult = validateLoanStatusQueryParam(status);
        if ('error' in validationResult) {
            res.status(400).json({
                error: validationResult.error
            });
            return;
        }

        const loanStatus = validationResult.status;

        // Query database for all loan requests with the specified status
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
            WHERE status = $1
            ORDER BY created_at DESC
        `;

        const result = await pool.query<LoanRequest>(query, [loanStatus]);

        res.status(200).json({
            message: `Loan requests with ${loanStatus} status retrieved successfully`,
            data: result.rows,
            count: result.rows.length
        });
    } catch (error) {
        console.error('Error retrieving loan requests:', error);
        res.status(500).json({
            error: 'Failed to retrieve loan requests',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
import { Request, Response } from 'express';
import { pool } from '../config/database';
import { LoanRequest } from '../models/loanRequest';
import {
    validateInvoiceNumber,
    validateInvoiceAmount,
    validateInvoiceDueDate,
    validateTerm,
    validateCustomerName,
    validateDeliveryCompleted,
    validateAdvanceRate,
    validateMonthlyInterestRate,
    validateMaxLoan,
    validateNotPledged,
    validateAssignmentSigned,
    validateBorrowerAddress,
} from '../validators/loanRequestValidators';
import { sanitizeLoanRequestRequest } from '../utils/sanitize';

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
                borrower_address
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

        // Validate required fields
        const invoiceNumberError = validateInvoiceNumber(invoice_number);
        if (invoiceNumberError) {
            res.status(400).json({ error: invoiceNumberError });
            return;
        }

        const invoiceAmountError = validateInvoiceAmount(invoice_amount);
        if (invoiceAmountError) {
            res.status(400).json({ error: invoiceAmountError });
            return;
        }

        const invoiceDueDateError = validateInvoiceDueDate(invoice_due_date);
        if (invoiceDueDateError) {
            res.status(400).json({ error: invoiceDueDateError });
            return;
        }

        const termError = validateTerm(term);
        if (termError) {
            res.status(400).json({ error: termError });
            return;
        }

        const customerNameError = validateCustomerName(customer_name);
        if (customerNameError) {
            res.status(400).json({ error: customerNameError });
            return;
        }

        const deliveryCompletedError = validateDeliveryCompleted(delivery_completed);
        if (deliveryCompletedError) {
            res.status(400).json({ error: deliveryCompletedError });
            return;
        }

        const advanceRateError = validateAdvanceRate(advance_rate);
        if (advanceRateError) {
            res.status(400).json({ error: advanceRateError });
            return;
        }

        const monthlyInterestRateError = validateMonthlyInterestRate(monthly_interest_rate);
        if (monthlyInterestRateError) {
            res.status(400).json({ error: monthlyInterestRateError });
            return;
        }

        const maxLoanError = validateMaxLoan(max_loan);
        if (maxLoanError) {
            res.status(400).json({ error: maxLoanError });
            return;
        }

        const notPledgedError = validateNotPledged(not_pledged);
        if (notPledgedError) {
            res.status(400).json({ error: notPledgedError });
            return;
        }

        const assignmentSignedError = validateAssignmentSigned(assignment_signed);
        if (assignmentSignedError) {
            res.status(400).json({ error: assignmentSignedError });
            return;
        }

        const borrowerAddressError = validateBorrowerAddress(borrower_address);
        if (borrowerAddressError) {
            res.status(400).json({ error: borrowerAddressError });
            return;
        }

        // Insert into database
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
        ]);

        const loanRequest = result.rows[0];

        res.status(201).json({
            message: 'Loan request created successfully',
            data: loanRequest
        });
    } catch (error) {
        console.error('Error creating loan request:', error);
        res.status(500).json({
            error: 'Failed to create loan request',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};


import { Request, Response } from 'express';
import { pool } from '../config/database';

interface LoanRequestBody {
    business_name: string;
}

interface LoanRequest {
    id: number;
    created_at: Date;
    business_name: string;
}

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
            SELECT id, created_at, business_name
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
        const { business_name }: LoanRequestBody = req.body;

        // Validate input
        if (!business_name || typeof business_name !== 'string' || business_name.trim().length === 0) {
            res.status(400).json({
                error: 'business_name is required and must be a non-empty string'
            });
            return;
        }

        // Insert into database
        const query = `
            INSERT INTO "LoanRequests" (business_name, created_at)
            VALUES ($1, NOW())
            RETURNING id, created_at, business_name
        `;

        const result = await pool.query<LoanRequest>(query, [business_name.trim()]);
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


import { Request, Response } from 'express';
import { pool } from '../config/database';

interface BorrowerKYBRequestBody {
    legal_business_name: string;
    country_of_incorporation: string;
    business_registration_number: string;
    business_description: string;
    UBO_full_name: string;
    average_invoice_amount: number;
    wallet_address: string;
}

interface BorrowerKYB {
    id: number;
    created_at: Date;
    modified_at: Date;
    legal_business_name: string;
    country_of_incorporation: string;
    business_registration_number: string;
    business_description: string;
    UBO_full_name: string;
    average_invoice_amount: number;
    wallet_address: string;
}

export const createBorrowerKYB = async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            legal_business_name,
            country_of_incorporation,
            business_registration_number,
            business_description,
            UBO_full_name,
            average_invoice_amount,
            wallet_address,
        }: BorrowerKYBRequestBody = req.body;

        // Validate required fields
        if (!legal_business_name || typeof legal_business_name !== 'string' || legal_business_name.trim().length === 0) {
            res.status(400).json({
                error: 'legal_business_name is required and must be a non-empty string'
            });
            return;
        }

        if (!country_of_incorporation || typeof country_of_incorporation !== 'string' || country_of_incorporation.trim().length === 0) {
            res.status(400).json({
                error: 'country_of_incorporation is required and must be a non-empty string'
            });
            return;
        }

        if (!business_registration_number || typeof business_registration_number !== 'string' || business_registration_number.trim().length === 0) {
            res.status(400).json({
                error: 'business_registration_number is required and must be a non-empty string'
            });
            return;
        }

        if (!business_description || typeof business_description !== 'string' || business_description.trim().length === 0) {
            res.status(400).json({
                error: 'business_description is required and must be a non-empty string'
            });
            return;
        }

        if (!UBO_full_name || typeof UBO_full_name !== 'string' || UBO_full_name.trim().length === 0) {
            res.status(400).json({
                error: 'UBO_full_name is required and must be a non-empty string'
            });
            return;
        }

        if (average_invoice_amount === undefined || average_invoice_amount === null || typeof average_invoice_amount !== 'number' || average_invoice_amount < 0) {
            res.status(400).json({
                error: 'average_invoice_amount is required and must be a non-negative number'
            });
            return;
        }

        if (!wallet_address || typeof wallet_address !== 'string' || wallet_address.trim().length === 0) {
            res.status(400).json({
                error: 'wallet_address is required and must be a non-empty string'
            });
            return;
        }

        // Insert into database
        const query = `
            INSERT INTO "BorrowerKYBs" (
                legal_business_name,
                country_of_incorporation,
                business_registration_number,
                business_description,
                UBO_full_name,
                average_invoice_amount,
                wallet_address,
                created_at,
                modified_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
            RETURNING 
                id,
                created_at,
                modified_at,
                legal_business_name,
                country_of_incorporation,
                business_registration_number,
                business_description,
                UBO_full_name,
                average_invoice_amount,
                wallet_address
        `;

        const result = await pool.query<BorrowerKYB>(query, [
            legal_business_name.trim(),
            country_of_incorporation.trim(),
            business_registration_number.trim(),
            business_description.trim(),
            UBO_full_name.trim(),
            average_invoice_amount,
            wallet_address.trim(),
        ]);

        const borrowerKYB = result.rows[0];

        res.status(201).json({
            message: 'Borrower KYB created successfully',
            data: borrowerKYB
        });
    } catch (error) {
        console.error('Error creating borrower KYB:', error);
        res.status(500).json({
            error: 'Failed to create borrower KYB',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};


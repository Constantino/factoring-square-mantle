import { Request, Response } from 'express';
import { GenerateInvoiceMetadataBody } from '../types/nft';
import { validateRequest } from '../validators/nftValidator';
import { sanitizeGenerateInvoiceMetadataRequest } from '../utils/sanitize';
import { invoiceNftService } from '../services/invoiceNftService';

export const generateInvoiceMetadata = async (req: Request, res: Response): Promise<void> => {
    try {
        // Sanitize input data
        const sanitizedData = sanitizeGenerateInvoiceMetadataRequest(req.body as GenerateInvoiceMetadataBody);

        // Validate required fields
        const validationError = validateRequest(sanitizedData);
        if (validationError) {
            res.status(400).json({
                error: validationError
            });
            return;
        }

        // Generate NFT metadata using service
        const metadata = invoiceNftService.generateInvoiceMetadata(sanitizedData);

        res.status(200).json({
            message: 'Invoice metadata generated successfully',
            data: metadata
        });
    } catch (error) {
        console.error('Error generating invoice metadata:', error);
        res.status(500).json({
            error: 'Failed to generate invoice metadata',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

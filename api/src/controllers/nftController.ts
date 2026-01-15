import { Request, Response } from 'express';
import { GenerateInvoiceMetadataBody, InvoiceMetadata } from '../types/nft';
import { validateRequest, validateInvoiceMetadata } from '../validators/nftValidator';
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

export const uploadMetadataToPinata = async (req: Request, res: Response): Promise<void> => {
    try {
        const metadata = req.body as InvoiceMetadata;

        // Validate metadata structure
        const validationError = validateInvoiceMetadata(metadata);
        if (validationError) {
            res.status(400).json({
                error: validationError
            });
            return;
        }

        // Upload metadata to Pinata
        const result = await invoiceNftService.uploadMetadataToPinata(metadata);

        res.status(200).json({
            message: 'Metadata uploaded to Pinata successfully',
            data: result
        });
    } catch (error) {
        console.error('Error uploading metadata to Pinata:', error);

        // Check for specific error types
        if (error instanceof Error && error.message.includes('PINATA_JWT')) {
            res.status(500).json({
                error: 'Pinata configuration error',
                details: error.message
            });
            return;
        }

        if (error instanceof Error && error.message.includes('Pinata upload failed')) {
            res.status(500).json({
                error: 'Failed to upload metadata to Pinata',
                details: error.message
            });
            return;
        }

        res.status(500).json({
            error: 'Failed to upload metadata to Pinata',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

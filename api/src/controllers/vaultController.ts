import { Request, Response } from "express";
import { CreateVaultBody } from "../models/vault";
import { validateRequest } from "../validators/vaultValidator";
import { vaultService } from "../services/vaultService";

export const createVault = async (req: Request, res: Response): Promise<void> => {
    try {
        const body: CreateVaultBody = req.body;

        // Validate request
        const validationError = validateRequest(body);
        if (validationError) {
            res.status(400).json({ error: validationError });
            return;
        }

        // Deploy vault using service
        const result = await vaultService.createVault(body);
        res.status(201).json({
            message: 'Vault deployed successfully',
            data: result
        });
    } catch (error) {
        console.error('Error deploying vault:', error);
        res.status(500).json({
            error: 'Failed to deploy vault',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

export const getAllVaults = async (req: Request, res: Response): Promise<void> => {
    try {
        const vaults = await vaultService.getAllVaults();
        
        res.status(200).json({
            message: 'Vaults retrieved successfully',
            data: vaults,
            count: vaults.length
        });
    } catch (error) {
        console.error('Error retrieving vaults:', error);
        res.status(500).json({
            error: 'Failed to retrieve vaults',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

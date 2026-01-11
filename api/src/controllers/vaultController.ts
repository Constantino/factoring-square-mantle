import { Request, Response } from "express";
import { CreateVaultBody } from "../models/vault";
import { CreateVaultLenderBody } from "../models/vaultLender";
import { validateRequest, validateDepositTracking, validateVaultAddressParam, validateLenderAddressParam } from "../validators/vaultValidator";
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

export const trackDeposit = async (req: Request, res: Response): Promise<void> => {
    try {
        const { vaultAddress } = req.params;
        const body: CreateVaultLenderBody = req.body;

        // Validate deposit tracking request
        const validationError = validateTrackDepositRequest(vaultAddress, body);
        if (validationError) {
            res.status(400).json({ error: validationError });
            return;
        }

        // Record deposit using service
        const result = await vaultService.trackDeposit(vaultAddress, body);
        
        res.status(200).json({
            message: 'Deposit tracked successfully',
            data: result
        });
    } catch (error) {
        console.error('Error tracking deposit:', error);
        
        // Check for duplicate transaction hash error
        if (error instanceof Error && error.message.includes('duplicate key')) {
            res.status(409).json({
                error: 'Deposit already tracked',
                details: 'This transaction has already been processed'
            });
            return;
        }

        res.status(500).json({
            error: 'Failed to track deposit',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

export const getVaultLenders = async (req: Request, res: Response): Promise<void> => {
    try {
        const { vaultAddress } = req.params;

        // Validate vault address format
        const validationError = validateVaultLenderRequest(vaultAddress);
        if (validationError) {
            res.status(400).json({ error: validationError });
            return;
        }

        const lenders = await vaultService.getVaultLenders(vaultAddress);
        
        res.status(200).json({
            message: 'Lenders retrieved successfully',
            data: lenders,
            count: lenders.length
        });
    } catch (error) {
        console.error('Error retrieving lenders:', error);
        res.status(500).json({
            error: 'Failed to retrieve lenders',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

export const getPortfolioByLender = async (req: Request, res: Response): Promise<void> => {
    try {
        const { lenderAddress } = req.params;

        // Validate lender address format
        const validationError = validateLenderAddressParam(lenderAddress);
        if (validationError) {
            res.status(400).json({ error: validationError });
            return;
        }

        const portfolio = await vaultService.getPortfolioByLender(lenderAddress);
        
        res.status(200).json({
            message: 'Lender portfolio retrieved successfully',
            data: portfolio,
            count: portfolio.length
        });
    } catch (error) {
        console.error('Error retrieving lender portfolio:', error);
        res.status(500).json({
            error: 'Failed to retrieve lender portfolio',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

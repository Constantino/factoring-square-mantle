import { Request, Response } from "express";
import { CreateVaultBody } from "../models/vault";
import { CreateVaultLenderBody } from "../models/vaultLender";
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

export const recordDeposit = async (req: Request, res: Response): Promise<void> => {
    try {
        const { vaultAddress } = req.params;
        const body: CreateVaultLenderBody = req.body;

        // Validate required fields
        if (!body.lenderAddress || !body.amount || !body.txHash) {
            res.status(400).json({ 
                error: 'Missing required fields: lenderAddress, amount, txHash' 
            });
            return;
        }

        // Validate vault address format
        if (!vaultAddress || !vaultAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
            res.status(400).json({ error: 'Invalid vault address format' });
            return;
        }

        // Validate lender address format
        if (!body.lenderAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
            res.status(400).json({ error: 'Invalid lender address format' });
            return;
        }

        // Validate amount is positive
        if (body.amount <= 0) {
            res.status(400).json({ error: 'Amount must be positive' });
            return;
        }

        // Record deposit using service
        const result = await vaultService.recordDeposit(vaultAddress, body);
        
        res.status(200).json({
            message: 'Deposit recorded successfully',
            data: result
        });
    } catch (error) {
        console.error('Error recording deposit:', error);
        
        // Check for duplicate transaction hash error
        if (error instanceof Error && error.message.includes('duplicate key')) {
            res.status(409).json({
                error: 'Deposit already recorded',
                details: 'This transaction has already been processed'
            });
            return;
        }

        res.status(500).json({
            error: 'Failed to record deposit',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

export const getVaultLenders = async (req: Request, res: Response): Promise<void> => {
    try {
        const { vaultAddress } = req.params;

        // Validate vault address format
        if (!vaultAddress || !vaultAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
            res.status(400).json({ error: 'Invalid vault address format' });
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

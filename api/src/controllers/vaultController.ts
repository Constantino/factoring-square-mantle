import { Request, Response } from "express";
import { CreateVaultBody } from "../models/vault";
import { CreateVaultLenderBody } from "../models/vaultLender";
import { validateRequest, validateDepositTracking, validateVaultAddressParam, validateLenderAddressParam, validateRepaymentTracking, TrackRepaymentBody } from "../validators/vaultValidator";
import { vaultService } from "../services/vaultService";
import { VaultStatus } from "../types/vaultStatus";

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
        const validationError = validateDepositTracking(vaultAddress, body);
        if (validationError) {
            res.status(400).json({ error: validationError });
            return;
        }

        // Record deposit using service
        const result = await vaultService.trackDeposit(vaultAddress, body);
        
        // Build response message
        let message = 'Deposit tracked successfully';
        if (result.fundReleased) {
            message = 'Deposit tracked and funds released to borrower successfully';
        } else if (result.vault.status === VaultStatus.FUNDED) {
            message = 'Deposit tracked. Vault fully funded, attempting to release funds...';
        }
        
        res.status(200).json({
            message,
            data: result,
            fundReleased: result.fundReleased || false,
            releaseTxHash: result.releaseTxHash,
            vaultStatus: result.vault.status
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

        // Check for capacity exceeded error
        if (error instanceof Error && error.message.includes('exceeds vault capacity')) {
            res.status(400).json({
                error: 'Deposit exceeds vault capacity',
                details: error.message
            });
            return;
        }

        // Check for vault already funded error
        if (error instanceof Error && error.message.includes('already')) {
            res.status(400).json({
                error: 'Vault not accepting deposits',
                details: error.message
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
        const validationError = validateVaultAddressParam(vaultAddress);
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

export const manualReleaseFunds = async (req: Request, res: Response): Promise<void> => {
    try {
        const { vaultAddress } = req.params;

        // Validate vault address format
        const validationError = validateVaultAddressParam(vaultAddress);
        if (validationError) {
            res.status(400).json({ error: validationError });
            return;
        }

        const result = await vaultService.manualReleaseFunds(vaultAddress);
        
        const statusCode = result.success ? 200 : 400;
        
        res.status(statusCode).json({
            message: result.message,
            success: result.success,
            txHash: result.txHash,
            explorerUrl: result.txHash 
                ? `https://sepolia.mantlescan.xyz/tx/${result.txHash}`
                : undefined,
            vault: result.vault
        });
    } catch (error) {
        console.error('Error manually releasing funds:', error);
        res.status(500).json({
            error: 'Failed to release funds',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

export const trackRepayment = async (req: Request, res: Response): Promise<void> => {
    try {
        const { vaultAddress } = req.params;
        const body: TrackRepaymentBody = req.body;

        // Validate repayment tracking request
        const validationError = validateRepaymentTracking(vaultAddress, body);
        if (validationError) {
            res.status(400).json({ error: validationError });
            return;
        }

        // Track repayment using service
        const result = await vaultService.trackRepayment(vaultAddress, body);

        res.status(200).json({
            message: result.message,
            data: result.vault
        });
    } catch (error) {
        console.error('Error tracking repayment:', error);

        // Check for vault not found error
        if (error instanceof Error && error.message.includes('not found')) {
            res.status(404).json({
                error: 'Vault not found',
                details: error.message
            });
            return;
        }

        // Check for vault status error
        if (error instanceof Error && error.message.includes('status')) {
            res.status(400).json({
                error: 'Invalid vault status for repayment',
                details: error.message
            });
            return;
        }

        res.status(500).json({
            error: 'Failed to track repayment',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

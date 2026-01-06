import { Request, Response } from "express";
import { ethers } from "ethers";
import { RPC_URL, PRIVATE_KEY, VAULT_FACTORY_ADDRESS } from "../config/constants";

const VAULT_FACTORY_ABI = [
    "event VaultCreated(address indexed vault, string invoiceNumber, address borrower)",
    "function deployVault(string memory invoiceName, string memory invoiceNumber, address borrower, uint256 maxCapacity, uint256 maturityDate) external returns (address)"
];

interface CreateVaultBody {
    invoiceName: string;
    invoiceNumber: string;
    borrowerAddress: string;
    invoiceAmount: number;
    maturityDate: number;
}

// Validation functions
const validateRequiredFields = (body: CreateVaultBody): string | null => {
    const { invoiceName, invoiceNumber, borrowerAddress, invoiceAmount, maturityDate } = body;
    
    if (!invoiceName || !invoiceNumber || !borrowerAddress || !invoiceAmount || !maturityDate) {
        return 'Missing required fields: invoiceName, invoiceNumber, borrowerAddress, invoiceAmount, maturityDate';
    }
    
    return null;
};

const validateAddress = (address: string): string | null => {
    if (!ethers.isAddress(address)) {
        return 'Invalid borrower address';
    }
    
    return null;
};

const validateAmount = (amount: number): string | null => {
    if (amount <= 0) {
        return 'Invoice amount must be greater than 0';
    }
    
    return null;
};

const validateMaturityDate = (maturityDate: number): string | null => {
    const now = Math.floor(Date.now() / 1000);
    
    if (maturityDate <= now) {
        return 'Maturity date must be in the future';
    }
    
    return null;
};

const validateRequest = (body: CreateVaultBody): string | null => {
    const requiredFieldsError = validateRequiredFields(body);
    if (requiredFieldsError) return requiredFieldsError;

    const addressError = validateAddress(body.borrowerAddress);
    if (addressError) return addressError;

    const amountError = validateAmount(body.invoiceAmount);
    if (amountError) return amountError;

    const maturityDateError = validateMaturityDate(body.maturityDate);
    if (maturityDateError) return maturityDateError;

    return null;
};

export const createVault = async (req: Request, res: Response): Promise<void> => {
    try {
        const body: CreateVaultBody = req.body;

        // Validate request
        const validationError = validateRequest(body);
        if (validationError) {
            res.status(400).json({ error: validationError });
            return;
        }

        // Setup provider and signer
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
        
        // Connect to VaultFactory contract
        const vaultFactory = new ethers.Contract(VAULT_FACTORY_ADDRESS, VAULT_FACTORY_ABI, wallet);
        
        // Convert invoice amount to wei (assuming USDC with 6 decimals)
        const maxCapacity = ethers.parseUnits(body.invoiceAmount.toString(), 6);
        
        // Deploy vault
        const tx = await vaultFactory.deployVault(
            body.invoiceName,
            body.invoiceNumber,
            body.borrowerAddress,
            maxCapacity,
            body.maturityDate
        );
        
        const receipt = await tx.wait();
        
        // Extract vault address from VaultCreated event
        const vaultCreatedEvent = receipt.logs
            .map((log: any) => {
                try {
                    return vaultFactory.interface.parseLog(log);
                } catch {
                    return null;
                }
            })
            .find((parsedLog: any) => parsedLog && parsedLog.name === 'VaultCreated');
        
        if (!vaultCreatedEvent) {
            res.status(500).json({
                error: 'Failed to extract vault address from transaction'
            });
            return;
        }
        
        const vaultAddress = vaultCreatedEvent.args.vault;
        const vaultName = `${body.invoiceName}_${body.invoiceNumber}_Vault`;
        const vaultSymbol = `${body.invoiceName}_${body.invoiceNumber}`;
        
        res.status(201).json({
            message: 'Vault deployed successfully',
            data: {
                vaultAddress,
                vaultName,
                vaultSymbol,
                invoiceNumber: body.invoiceNumber,
                borrowerAddress: body.borrowerAddress,
                maxCapacity: body.invoiceAmount,
                maturityDate: body.maturityDate,
                transactionHash: receipt.hash,
                blockNumber: receipt.blockNumber
            }
        });
    } catch (error) {
        console.error('Error deploying vault:', error);
        res.status(500).json({
            error: 'Failed to deploy vault',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

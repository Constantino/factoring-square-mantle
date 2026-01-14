import { Request, Response } from "express";
import { faucetService } from "../services/faucetService";
import { ethers } from "ethers";

interface MintRequest {
    address: string;
    amount?: number;
}

export const mintTokens = async (req: Request, res: Response): Promise<void> => {
    try {
        const { address, amount = 1000 }: MintRequest = req.body;

        // Validate address
        if (!address) {
            res.status(400).json({ error: 'Address is required' });
            return;
        }

        if (!ethers.isAddress(address)) {
            res.status(400).json({ error: 'Invalid Ethereum address format' });
            return;
        }

        // Validate amount
        if (amount <= 0 || amount > 10000) {
            res.status(400).json({ error: 'Amount must be between 1 and 10000 USDC' });
            return;
        }

        // Mint tokens
        const result = await faucetService.mintTokens(address, amount);

        res.status(200).json({
            message: 'Tokens minted successfully',
            data: result
        });
    } catch (error) {
        console.error('Error minting tokens:', error);
        res.status(500).json({
            error: 'Failed to mint tokens',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

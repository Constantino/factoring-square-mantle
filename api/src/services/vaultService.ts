import { ethers } from "ethers";
import { pool } from "../config/database";
import { RPC_URL, PRIVATE_KEY, VAULT_FACTORY_ADDRESS } from "../config/constants";
import { CreateVaultBody, DeployVaultResult, Vault } from "../models/vault";

const VAULT_FACTORY_ABI = [
    "event VaultCreated(address indexed vault, string invoiceNumber, address borrower)",
    "function deployVault(string memory invoiceName, string memory invoiceNumber, address borrower, uint256 maxCapacity, uint256 maturityDate) external returns (address)"
];

export class VaultService {
    private provider: ethers.JsonRpcProvider;
    private wallet: ethers.Wallet;
    private vaultFactory: ethers.Contract;

    constructor() {
        this.provider = new ethers.JsonRpcProvider(RPC_URL);
        this.wallet = new ethers.Wallet(PRIVATE_KEY, this.provider);
        this.vaultFactory = new ethers.Contract(VAULT_FACTORY_ADDRESS, VAULT_FACTORY_ABI, this.wallet);
    }

    async createVault(vaultData: CreateVaultBody): Promise<DeployVaultResult> {
        try {
            console.error("--> creating a vault")
            // Convert invoice amount to wei (assuming USDC with 6 decimals)
            const maxCapacity = ethers.parseUnits(vaultData.invoiceAmount.toString(), 6);
            
            // Deploy vault
            const tx = await this.vaultFactory.deployVault(
                vaultData.invoiceName,
                vaultData.invoiceNumber,
                vaultData.borrowerAddress,
                maxCapacity,
                vaultData.maturityDate
            );
            
            const receipt = await tx.wait();
            
            // Extract vault address from VaultCreated event
            const vaultCreatedEvent = receipt.logs
                .map((log: any) => {
                    try {
                        return this.vaultFactory.interface.parseLog(log);
                    } catch {
                        return null;
                    }
                })
                .find((parsedLog: any) => parsedLog && parsedLog.name === 'VaultCreated');
            
            if (!vaultCreatedEvent) {
                console.error("--> Failed to extract vault address from transaction")
                throw new Error('Failed to extract vault address from transaction');
            }
            
            const vaultAddress = vaultCreatedEvent.args.vault;
            const vaultName = `${vaultData.invoiceName}_${vaultData.invoiceNumber}_Vault`;
            const vaultSymbol = `${vaultData.invoiceName}_${vaultData.invoiceNumber}`;
            const explorerUrl = `https://sepolia.mantlescan.xyz/tx/${receipt.hash}`;
            const vaultExplorerUrl = `https://sepolia.mantlescan.xyz/address/${vaultAddress}`;
            const factoryExplorerUrl = `https://sepolia.mantlescan.xyz/address/${VAULT_FACTORY_ADDRESS}`;
            
            // Insert vault record into database
            await this.saveVault({
                vaultAddress,
                borrowerAddress: vaultData.borrowerAddress,
                vaultName,
                maxCapacity: vaultData.invoiceAmount,
                currentCapacity: 0
            });
            
            return {
                vaultAddress,
                vaultExplorerUrl,
                vaultName,
                vaultSymbol,
                factoryAddress: VAULT_FACTORY_ADDRESS,
                factoryExplorerUrl,
                invoiceNumber: vaultData.invoiceNumber,
                borrowerAddress: vaultData.borrowerAddress,
                maxCapacity: vaultData.invoiceAmount,
                maturityDate: vaultData.maturityDate,
                transactionHash: receipt.hash,
                explorerUrl,
                blockNumber: receipt.blockNumber
            };
        } catch (error) {
            console.error('Error deploying vault:', error);
            throw error;
        }
    }

    private async saveVault(vaultData: {
        vaultAddress: string;
        borrowerAddress: string;
        vaultName: string;
        maxCapacity: number;
        currentCapacity: number;
    }): Promise<void> {
        console.error("---> saving the vault")
        const query = `
            INSERT INTO "Vaults" (
                vault_address,
                borrower_address,
                vault_name,
                max_capacity,
                current_capacity,
                created_at,
                modified_at
            )
            VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        `;

        await pool.query(query, [
            vaultData.vaultAddress,
            vaultData.borrowerAddress,
            vaultData.vaultName,
            vaultData.maxCapacity,
            vaultData.currentCapacity
        ]);
    }

    async getAllVaults(): Promise<Vault[]> {
        const query = `
            SELECT 
                vault_id,
                vault_address,
                borrower_address,
                vault_name,
                max_capacity,
                current_capacity,
                created_at,
                modified_at
            FROM "Vaults"
            ORDER BY created_at DESC
        `;

        const result = await pool.query<Vault>(query);
        return result.rows;
    }
}

export const vaultService = new VaultService();

import { ethers } from "ethers";
import { pool } from "../config/database";
import { RPC_URL, PRIVATE_KEY, VAULT_FACTORY_ADDRESS } from "../config/constants";
import { CreateVaultBody, DeployVaultResult, Vault } from "../models/vault";
import { CreateVaultLenderBody, VaultLender } from "../models/vaultLender";
import {VAULTFACTORY_ABI} from "../abi/VaultFactory";

export class VaultService {
    private provider: ethers.JsonRpcProvider;
    private wallet: ethers.Wallet;
    private vaultFactory: ethers.Contract;

    constructor() {
        this.provider = new ethers.JsonRpcProvider(RPC_URL);
        this.wallet = new ethers.Wallet(PRIVATE_KEY, this.provider);
        this.vaultFactory = new ethers.Contract(VAULT_FACTORY_ADDRESS, VAULTFACTORY_ABI, this.wallet);
    }

    async createVault(vaultData: CreateVaultBody): Promise<DeployVaultResult> {
        try {
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

    async recordDeposit(
        vaultAddress: string,
        depositData: CreateVaultLenderBody
    ): Promise<{ vault: Vault; lender: VaultLender }> {
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // 1. Get vault_id from vault_address
            const vaultQuery = `
                SELECT vault_id, max_capacity, current_capacity
                FROM "Vaults"
                WHERE vault_address = $1
            `;
            const vaultResult = await client.query(vaultQuery, [vaultAddress]);

            if (vaultResult.rows.length === 0) {
                throw new Error(`Vault not found: ${vaultAddress}`);
            }

            const vault = vaultResult.rows[0];
            const vaultId = vault.vault_id;

            // 2. Insert lender record
            const lenderQuery = `
                INSERT INTO "VaultLenders" (
                    vault_id,
                    lender_address,
                    amount,
                    tx_hash,
                    created_at
                )
                VALUES ($1, $2, $3, $4, NOW())
                RETURNING *
            `;

            const lenderResult = await client.query<VaultLender>(lenderQuery, [
                vaultId,
                depositData.lenderAddress,
                depositData.amount,
                depositData.txHash
            ]);

            const lender = lenderResult.rows[0];

            // 3. Update vault current_capacity
            const newCapacity = parseFloat(vault.current_capacity) + depositData.amount;
            const updateVaultQuery = `
                UPDATE "Vaults"
                SET current_capacity = $1,
                    modified_at = NOW()
                WHERE vault_id = $2
                RETURNING *
            `;

            const updatedVaultResult = await client.query<Vault>(updateVaultQuery, [
                newCapacity,
                vaultId
            ]);

            await client.query('COMMIT');

            return {
                vault: updatedVaultResult.rows[0],
                lender
            };
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error recording deposit:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    async getVaultLenders(vaultAddress: string): Promise<VaultLender[]> {
        const query = `
            SELECT vl.*
            FROM "VaultLenders" vl
            JOIN "Vaults" v ON vl.vault_id = v.vault_id
            WHERE v.vault_address = $1
            ORDER BY vl.created_at DESC
        `;

        const result = await pool.query<VaultLender>(query, [vaultAddress]);
        return result.rows;
    }
}

export const vaultService = new VaultService();

// Validation functions
import {CreateVaultBody} from "../models/vault";
import {CreateVaultLenderBody} from "../models/vaultLender";
import {ethers} from "ethers";
import { VaultStatus } from "../types/vaultStatus";

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

export const validateRequest = (body: CreateVaultBody): string | null => {
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

// Deposit tracking validation functions
const validateDepositRequiredFields = (body: CreateVaultLenderBody): string | null => {
    if (!body.lenderAddress || !body.amount || !body.txHash) {
        return 'Missing required fields: lenderAddress, amount, txHash';
    }

    return null;
};

const validateVaultAddress = (vaultAddress: string): string | null => {
    if (!vaultAddress || !vaultAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
        return 'Invalid vault address format';
    }

    return null;
};

const validateLenderAddress = (lenderAddress: string): string | null => {
    if (!lenderAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
        return 'Invalid lender address format';
    }

    return null;
};

const validateDepositAmount = (amount: number): string | null => {
    if (amount <= 0) {
        return 'Amount must be positive';
    }

    return null;
};

export const validateDepositTracking = (
    vaultAddress: string,
    body: CreateVaultLenderBody
): string | null => {
    const requiredFieldsError = validateDepositRequiredFields(body);
    if (requiredFieldsError) return requiredFieldsError;

    const vaultAddressError = validateVaultAddress(vaultAddress);
    if (vaultAddressError) return vaultAddressError;

    const lenderAddressError = validateLenderAddress(body.lenderAddress);
    if (lenderAddressError) return lenderAddressError;

    const amountError = validateDepositAmount(body.amount);
    if (amountError) return amountError;

    return null;
};

export const validateVaultAddressParam = (vaultAddress: string): string | null => {
    return validateVaultAddress(vaultAddress);
};

export const validateLenderAddressParam = (lenderAddress: string): string | null => {
    return validateLenderAddress(lenderAddress);
};

// Vault status validation for deposits
export const validateVaultStatusForDeposit = (status: VaultStatus): string | null => {
    if (status === VaultStatus.FUNDED || status === VaultStatus.RELEASED) {
        return `Vault is already ${status}. No more deposits allowed.`;
    }
    return null;
};

// Vault status validation for manual release
export const validateVaultStatusForRelease = (status: VaultStatus): { canRelease: boolean; message: string } => {
    if (status === VaultStatus.RELEASED) {
        return {
            canRelease: false,
            message: 'Funds already released for this vault'
        };
    }
    
    if (status !== VaultStatus.FUNDED) {
        return {
            canRelease: false,
            message: `Vault must be in FUNDED status. Current status: ${status}`
        };
    }
    
    return {
        canRelease: true,
        message: 'Vault is ready for fund release'
    };
};

// Vault capacity validation for release
export const validateVaultCapacityForRelease = (
    currentCapacity: number,
    maxCapacity: number
): string | null => {
    if (currentCapacity < maxCapacity) {
        return `Vault not fully funded. Current: ${currentCapacity}, Required: ${maxCapacity}`;
    }
    return null;
};

// Vault capacity validation
export const validateVaultCapacity = (
    currentCapacity: number,
    maxCapacity: number,
    depositAmount: number
): string | null => {
    const newCapacity = currentCapacity + depositAmount;
    
    if (newCapacity > maxCapacity) {
        return `Deposit exceeds vault capacity. ` +
               `Max: ${maxCapacity}, Current: ${currentCapacity}, ` +
               `Attempted: ${depositAmount}, Would be: ${newCapacity}`;
    }
    
    return null;
};
// Validation functions
import {CreateVaultBody} from "../models/vault";
import {ethers} from "ethers";

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
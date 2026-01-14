import { GenerateInvoiceMetadataBody } from '../types/nft';

export const validateName = (name: unknown): string | null => {
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return 'Name is required and must be a non-empty string';
    }
    return null;
};

export const validateDescription = (description: unknown): string | null => {
    if (!description || typeof description !== 'string' || description.trim().length === 0) {
        return 'Description is required and must be a non-empty string';
    }
    return null;
};

export const validateImageUrl = (image: unknown): string | null => {
    if (!image || typeof image !== 'string' || image.trim().length === 0) {
        return 'Image URL is required and must be a non-empty string';
    }

    // Validate URL format
    try {
        new URL(image);
    } catch {
        return 'Image must be a valid URL';
    }

    return null;
};

export const validateBorrowerName = (borrowerName: unknown): string | null => {
    if (!borrowerName || typeof borrowerName !== 'string' || borrowerName.trim().length === 0) {
        return 'Borrower name is required and must be a non-empty string';
    }
    return null;
};

export const validateLoanRequestId = (loanRequestId: unknown): string | null => {
    if (loanRequestId === undefined || loanRequestId === null || typeof loanRequestId !== 'number' || loanRequestId <= 0) {
        return 'Loan request ID is required and must be a positive number';
    }
    return null;
};

export const validateInvoiceNumber = (invoiceNumber: unknown): string | null => {
    if (!invoiceNumber || typeof invoiceNumber !== 'string' || invoiceNumber.trim().length === 0) {
        return 'Invoice number is required and must be a non-empty string';
    }
    return null;
};

// Type for validation where all fields are unknown (before validation)
type GenerateInvoiceMetadataBodyForValidation = {
    [K in keyof GenerateInvoiceMetadataBody]: unknown;
};

export const validateRequest = (data: GenerateInvoiceMetadataBodyForValidation): string | null => {
    const nameError = validateName(data.name);
    if (nameError) {
        return nameError;
    }

    const descriptionError = validateDescription(data.description);
    if (descriptionError) {
        return descriptionError;
    }

    const imageError = validateImageUrl(data.image);
    if (imageError) {
        return imageError;
    }

    const borrowerNameError = validateBorrowerName(data.borrowerName);
    if (borrowerNameError) {
        return borrowerNameError;
    }

    const loanRequestIdError = validateLoanRequestId(data.loanRequestId);
    if (loanRequestIdError) {
        return loanRequestIdError;
    }

    const invoiceNumberError = validateInvoiceNumber(data.invoiceNumber);
    if (invoiceNumberError) {
        return invoiceNumberError;
    }

    return null;
};

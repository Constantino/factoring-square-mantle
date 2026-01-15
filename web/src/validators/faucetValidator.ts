export const MAX_AMOUNT = 100000000;

export interface ValidationResult {
    isValid: boolean;
    error?: string;
}

/**
 * Validates Ethereum address format
 * @param address - The Ethereum address to validate
 * @returns ValidationResult with isValid and optional error message
 */
export const validateAddress = (address: string): ValidationResult => {
    if (!address || address.trim() === "") {
        return {
            isValid: false,
            error: "Address is required"
        };
    }

    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    if (!ethAddressRegex.test(address)) {
        return {
            isValid: false,
            error: "Please enter a valid Ethereum wallet address"
        };
    }

    return { isValid: true };
};

/**
 * Validates the amount for faucet mint request
 * @param amount - The amount string to validate
 * @returns ValidationResult with isValid and optional error message
 */
export const validateAmount = (amount: string): ValidationResult => {
    if (!amount || amount.trim() === "") {
        return {
            isValid: false,
            error: "Amount is required"
        };
    }

    const amountNum = parseInt(amount, 10);

    if (isNaN(amountNum)) {
        return {
            isValid: false,
            error: "Please enter a valid amount"
        };
    }

    if (amountNum <= 0) {
        return {
            isValid: false,
            error: "Amount must be greater than 0"
        };
    }

    if (amountNum > MAX_AMOUNT) {
        return {
            isValid: false,
            error: `Maximum amount is ${MAX_AMOUNT.toLocaleString()} USDC`
        };
    }

    return { isValid: true };
};

/**
 * Validates the complete mint request
 * @param address - The Ethereum address
 * @param amount - The amount string
 * @returns ValidationResult with isValid and optional error message
 */
export const validateMintRequest = (address: string, amount: string): ValidationResult => {
    const addressValidation = validateAddress(address);
    if (!addressValidation.isValid) {
        return addressValidation;
    }

    const amountValidation = validateAmount(amount);
    if (!amountValidation.isValid) {
        return amountValidation;
    }

    return { isValid: true };
};

/**
 * Checks if input value is a valid integer
 * Used for real-time input validation
 * @param value - The input value to check
 * @returns true if valid integer or empty string, false otherwise
 */
export const isValidIntegerInput = (value: string): boolean => {
    if (value === "") return true;
    return /^\d+$/.test(value);
};

/**
 * Checks if amount is within max limit
 * Used for real-time input validation
 * @param value - The amount value to check
 * @returns true if within limit, false otherwise
 */
export const isWithinMaxLimit = (value: string): boolean => {
    if (value === "") return true;
    const numValue = parseInt(value, 10);
    return !isNaN(numValue) && numValue <= MAX_AMOUNT;
};

"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ErrorPanel } from "@/components/error-panel";
import { formatCurrency, formatPercentage } from "@/lib/format";
import { PayModalProps } from "@/types/payModalProps";
import { calculateDaysSinceFundRelease } from "@/services/loanService";

export function PayModal({
    isOpen,
    onClose,
    onConfirm,
    totalDebt,
    maxLoan,
    monthlyInterestRate,
    vaultFundReleaseAt,
    invoiceDueDate,
    isProcessing = false,
    processingStep = "Processing...",
    txHash = null,
}: PayModalProps) {
    const [amount, setAmount] = useState<number>(0);
    const [inputValue, setInputValue] = useState<string>("");
    const [error, setError] = useState<string | null>(null);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setAmount(0);
            setInputValue("");
            setError(null);
        }
    }, [isOpen]);

    // Handle close - reset state when closing
    const handleClose = () => {
        setAmount(0);
        setInputValue("");
        setError(null);
        onClose();
    };

    // Handle input change
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value;

        // Remove any non-numeric characters except decimal point
        // Allow: digits, one decimal point, and empty string
        value = value.replace(/[^0-9.]/g, '');

        // Ensure only one decimal point
        const parts = value.split('.');
        if (parts.length > 2) {
            value = parts[0] + '.' + parts.slice(1).join('');
        }

        setInputValue(value);

        // Handle empty input or just a decimal point
        if (value === "" || value === ".") {
            setAmount(0);
            return;
        }

        const numValue = parseFloat(value);

        // If it's a valid number and non-negative, set it
        // We'll validate against totalDebt in the button disabled condition
        if (!isNaN(numValue) && numValue >= 0 && isFinite(numValue)) {
            setAmount(numValue);
        } else {
            // Invalid number, set amount to 0
            setAmount(0);
        }
    };

    // Handle MAX button
    const handleMaxClick = () => {
        if (totalDebt !== undefined) {
            setAmount(totalDebt);
            setInputValue(totalDebt.toString());
        }
    };

    // Handle confirm
    const handleConfirm = async () => {
        if (amount > 0 && (totalDebt === undefined || amount <= totalDebt)) {
            setError(null);
            try {
                await onConfirm(amount);
            } catch (err) {
                const errorMessage = err instanceof Error
                    ? err.message.includes('user rejected') || err.message.includes('User denied')
                        ? 'Transaction cancelled by user'
                        : err.message
                    : 'Failed to pay loan';
                setError(errorMessage);
            }
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent
                className="sm:max-w-[500px]"
                onInteractOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
            >
                <DialogHeader>
                    <DialogTitle>Pay Loan</DialogTitle>
                    <DialogDescription>
                        Enter the amount in USDC you want to pay towards this loan
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Total Debt Breakdown */}
                    {totalDebt !== undefined && (
                        <div className="space-y-3">
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">Total Debt</p>
                                <p className="text-lg font-semibold">
                                    {formatCurrency(totalDebt)}
                                </p>
                            </div>

                            {/* Breakdown */}
                            <div className="border-t border-border pt-3 space-y-2">
                                {vaultFundReleaseAt && (
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-muted-foreground">Days since funds released:</span>
                                        <span className="text-foreground font-medium">
                                            {calculateDaysSinceFundRelease(vaultFundReleaseAt)}
                                        </span>
                                    </div>
                                )}

                                {maxLoan !== undefined && (
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-muted-foreground">Original loan:</span>
                                        <span className="text-foreground font-medium">{formatCurrency(maxLoan)}</span>
                                    </div>
                                )}

                                {monthlyInterestRate !== undefined && (
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-muted-foreground">Monthly interest rate:</span>
                                        <span className="text-foreground font-medium">{formatPercentage(monthlyInterestRate)}</span>
                                    </div>
                                )}

                                {totalDebt !== undefined && maxLoan !== undefined && totalDebt > maxLoan && (
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-muted-foreground">Interest accrued:</span>
                                        <span className="text-foreground font-medium">{formatCurrency(totalDebt - maxLoan)}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Input Field */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Payment Amount (USDC)</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                $
                            </span>
                            <Input
                                type="text"
                                inputMode="decimal"
                                value={inputValue}
                                onChange={handleInputChange}
                                className="pl-7"
                                placeholder="0.00"
                                disabled={isProcessing}
                            />
                        </div>
                        {amount > 0 && (
                            <p className="text-xs text-muted-foreground">
                                You are paying {formatCurrency(amount)} USDC
                            </p>
                        )}
                    </div>

                    {/* MAX button */}
                    {totalDebt !== undefined && (
                        <div className="flex justify-end">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleMaxClick}
                                className="h-7 px-3 text-xs"
                                disabled={isProcessing}
                            >
                                MAX
                            </Button>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={handleClose}
                        disabled={isProcessing}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={amount <= 0 || (totalDebt !== undefined && amount > totalDebt) || isProcessing}
                    >
                        {isProcessing ? processingStep : "Confirm Payment"}
                    </Button>
                </DialogFooter>

                {/* Success Message with Transaction Link */}
                {txHash && (
                    <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-md mt-4">
                        <p className="text-sm text-green-600 font-medium mb-2">✓ Payment successful!</p>
                        <a
                            href={`https://explorer.sepolia.mantle.xyz/tx/${txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-green-600 hover:text-green-700 underline break-all"
                        >
                            View transaction: {txHash}
                        </a>
                    </div>
                )}

                {/* Error Display */}
                <ErrorPanel
                    error={error}
                    textSize="xs"
                    maxHeight="max-h-32"
                    collapsible={true}
                    collapseThreshold={100}
                    className="mt-4"
                />
            </DialogContent>
        </Dialog>
    );
}


"use client";

import { useState } from "react";
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
import { formatCurrency } from "@/lib/format";
import { PayModalProps } from "@/types/payModalProps";

export function PayModal({
    isOpen,
    onClose,
    onConfirm,
    maxAmount,
    isProcessing = false,
    processingStep = "Processing...",
    txHash = null,
}: PayModalProps) {
    const [amount, setAmount] = useState<number>(0);
    const [inputValue, setInputValue] = useState<string>("0");
    const [error, setError] = useState<string | null>(null);

    // Handle close - reset state when closing
    const handleClose = () => {
        setAmount(0);
        setInputValue("0");
        setError(null);
        onClose();
    };

    // Handle input change
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setInputValue(value);

        const numValue = parseFloat(value);
        if (!isNaN(numValue) && numValue >= 0 && (maxAmount === undefined || numValue <= maxAmount)) {
            setAmount(numValue);
        } else if (value === "") {
            setAmount(0);
        }
    };

    // Handle MAX button
    const handleMaxClick = () => {
        if (maxAmount !== undefined) {
            setAmount(maxAmount);
            setInputValue(maxAmount.toString());
        }
    };

    // Handle confirm
    const handleConfirm = async () => {
        if (amount > 0 && (maxAmount === undefined || amount <= maxAmount)) {
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
                    {/* Max Amount Information */}
                    {maxAmount !== undefined && (
                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Debt</p>
                            <p className="text-lg font-semibold">
                                {formatCurrency(maxAmount)}
                            </p>
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
                                type="number"
                                value={inputValue}
                                onChange={handleInputChange}
                                className="pl-7"
                                placeholder="0.00"
                                min="0"
                                max={maxAmount}
                                step="0.01"
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
                    {maxAmount !== undefined && (
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
                        disabled={amount <= 0 || (maxAmount !== undefined && amount > maxAmount) || isProcessing}
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


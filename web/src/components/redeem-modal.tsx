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
import { ErrorPanel } from "@/components/error-panel";
import { formatCurrency } from "@/lib/format";

interface RedeemModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
    investedAmount: number;
    redeemableAmount?: number;
    isProcessing?: boolean;
    processingStep?: string;
    txHash?: string | null;
    isLoadingPreview?: boolean;
}

export function RedeemModal({
    isOpen,
    onClose,
    onConfirm,
    investedAmount,
    redeemableAmount,
    isProcessing = false,
    processingStep = "Processing...",
    txHash = null,
    isLoadingPreview = false,
}: RedeemModalProps) {
    const [error, setError] = useState<string | null>(null);

    // Calculate profit
    const profit = redeemableAmount !== undefined ? redeemableAmount - investedAmount : 0;
    const profitPercentage = investedAmount > 0 && profit !== 0
        ? ((profit / investedAmount) * 100).toFixed(2)
        : '0.00';

    // Handle close - reset state when closing
    const handleClose = () => {
        setError(null);
        onClose();
    };

    // Handle confirm
    const handleConfirm = async () => {
        setError(null);
        try {
            await onConfirm();
        } catch (err) {
            const errorMessage = err instanceof Error
                ? err.message.includes('user rejected') || err.message.includes('User denied')
                    ? 'Transaction cancelled by user'
                    : err.message
                : 'Failed to redeem shares';
            setError(errorMessage);
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
                    <DialogTitle>Redeem Investment</DialogTitle>
                    <DialogDescription>
                        Redeem your shares to receive your USDC back from this vault
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Investment Information */}
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Your Investment</p>
                            <p className="text-lg font-semibold">
                                {formatCurrency(investedAmount)}
                            </p>
                        </div>

                        {isLoadingPreview ? (
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">Calculating redemption amount...</p>
                                <div className="flex items-center space-x-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                                    <p className="text-sm text-muted-foreground">Loading...</p>
                                </div>
                            </div>
                        ) : redeemableAmount !== undefined && (
                            <>
                                {/* Profit/Loss Display */}
                                <div className="p-3 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-md">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1">Interest Earned</p>
                                            <p className={`text-lg font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {profit >= 0 ? '+' : ''}{formatCurrency(profit)}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-muted-foreground mb-1">ROI</p>
                                            <p className={`text-lg font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {profit >= 0 ? '+' : ''}{profitPercentage}%
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Total Redemption Amount */}
                                <div className="border-t pt-4">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-muted-foreground">Total You Will Receive</p>
                                        <p className="text-3xl font-bold text-green-600">
                                            {formatCurrency(redeemableAmount)}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            = Investment ({formatCurrency(investedAmount)}) + Interest ({formatCurrency(profit)})
                                        </p>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Info Box */}
                    <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-md">
                        <p className="text-xs text-blue-600">
                            ℹ️ This will convert all your shares back to USDC. The transaction cannot be reversed.
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={handleClose}
                        disabled={isProcessing || isLoadingPreview}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={isProcessing || isLoadingPreview || redeemableAmount === undefined}
                    >
                        {isProcessing ? processingStep : isLoadingPreview ? "Calculating..." : "Confirm Redemption"}
                    </Button>
                </DialogFooter>

                {/* Success Message with Transaction Link */}
                {txHash && (
                    <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-md mt-4">
                        <p className="text-sm text-green-600 font-medium mb-2">✓ Redemption successful!</p>
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

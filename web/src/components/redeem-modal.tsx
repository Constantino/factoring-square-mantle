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
}: RedeemModalProps) {
    const [error, setError] = useState<string | null>(null);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setError(null);
        }
    }, [isOpen]);

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

                        {redeemableAmount !== undefined && (
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">You Will Receive</p>
                                <p className="text-2xl font-bold text-green-600">
                                    {formatCurrency(redeemableAmount)}
                                </p>
                            </div>
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
                        disabled={isProcessing}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={isProcessing}
                    >
                        {isProcessing ? processingStep : "Confirm Redemption"}
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

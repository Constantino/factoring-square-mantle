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
import { Slider } from "@/components/ui/slider";
import { ErrorPanel } from "@/components/error-panel";
import {Vault} from "@/types/vault";

interface ParticipateModalProps {
    vault: Vault | null;
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (amount: number) => Promise<void>;
    isProcessing?: boolean;
    processingStep?: string;
    txHash?: string | null;
}

export function ParticipateModal({
    vault,
    isOpen,
    onClose,
    onConfirm,
    isProcessing = false,
    processingStep = "Processing...",
    txHash = null,
}: ParticipateModalProps) {
    const [amount, setAmount] = useState<number>(0);
    const [inputValue, setInputValue] = useState<string>("0");
    const [error, setError] = useState<string | null>(null);

    // Calculate available capacity
    const availableCapacity = vault
        ? parseFloat(vault.max_capacity) - parseFloat(vault.current_capacity)
        : 0;

    // Handle close - reset state when closing
    const handleClose = () => {
        setAmount(0);
        setInputValue("0");
        setError(null);
        onClose();
    };

    // Handle slider change
    const handleSliderChange = (value: number[]) => {
        const newAmount = value[0];
        setAmount(newAmount);
        setInputValue(newAmount.toString());
    };

    // Handle input change
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setInputValue(value);

        const numValue = parseFloat(value);
        if (!isNaN(numValue) && numValue >= 0 && numValue <= availableCapacity) {
            setAmount(numValue);
        } else if (value === "") {
            setAmount(0);
        }
    };

    // Handle MAX button
    const handleMaxClick = () => {
        setAmount(availableCapacity);
        setInputValue(availableCapacity.toString());
    };

    // Handle confirm
    const handleConfirm = async () => {
        if (amount > 0 && amount <= availableCapacity) {
            setError(null);
            try {
                await onConfirm(amount);
                // Only close on success - parent will handle this
            } catch (err) {
                // Display error in modal
                const errorMessage = err instanceof Error 
                    ? err.message.includes('user rejected') || err.message.includes('User denied')
                        ? 'Transaction cancelled by user'
                        : err.message
                    : 'Failed to participate in vault';
                setError(errorMessage);
            }
        }
    };

    if (!vault) return null;

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent 
                className="sm:max-w-[500px]"
                onInteractOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
            >
                <DialogHeader>
                    <DialogTitle>Participate in {vault.vault_name}</DialogTitle>
                    <DialogDescription>
                        Enter the amount you want to contribute to this vault.
                        {!isProcessing && " You'll need to approve two transactions: token approval and deposit."}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Capacity Information */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Max Capacity</p>
                            <p className="text-lg font-semibold">
                                ${parseFloat(vault.max_capacity).toLocaleString()}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Current Capacity</p>
                            <p className="text-lg font-semibold">
                                ${parseFloat(vault.current_capacity).toLocaleString()}
                            </p>
                        </div>
                    </div>

                    {/* Input Field */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Participation Amount</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                $
                            </span>
                            <Input
                                type="number"
                                value={inputValue}
                                onChange={handleInputChange}
                                className="pl-7"
                                placeholder="0"
                                min="0"
                                max={availableCapacity}
                                step="0.01"
                                disabled={isProcessing}
                            />
                        </div>
                    </div>

                    {/* Slider with MAX button */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">Adjust Amount</label>
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
                        <Slider
                            value={[amount]}
                            onValueChange={handleSliderChange}
                            max={availableCapacity}
                            step={0.01}
                            className="w-full"
                            disabled={isProcessing}
                        />
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <span>$0</span>
                            <span>${availableCapacity.toLocaleString()}</span>
                        </div>
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
                        disabled={amount <= 0 || amount > availableCapacity || isProcessing}
                    >
                        {isProcessing ? processingStep : "Confirm Participation"}
                    </Button>
                </DialogFooter>

                {/* Success Message with Transaction Link */}
                {txHash && (
                    <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-md mt-4">
                        <p className="text-sm text-green-600 font-medium mb-2">✓ Deposit successful!</p>
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

                {/* Error Display - Below Buttons */}
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

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
import { Slider } from "@/components/ui/slider";

interface Vault {
    vault_id: number;
    vault_address: string;
    borrower_address: string;
    vault_name: string;
    max_capacity: string;
    current_capacity: string;
    created_at: string;
    modified_at: string;
}

interface ParticipateModalProps {
    vault: Vault | null;
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (amount: number) => void;
}

export function ParticipateModal({
    vault,
    isOpen,
    onClose,
    onConfirm,
}: ParticipateModalProps) {
    const [amount, setAmount] = useState<number>(0);
    const [inputValue, setInputValue] = useState<string>("0");

    // Calculate available capacity
    const availableCapacity = vault
        ? parseFloat(vault.max_capacity) - parseFloat(vault.current_capacity)
        : 0;

    // Reset amount when vault changes or modal opens
    useEffect(() => {
        if (isOpen && vault) {
            setAmount(0);
            setInputValue("0");
        }
    }, [isOpen, vault]);

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
    const handleConfirm = () => {
        if (amount > 0 && amount <= availableCapacity) {
            onConfirm(amount);
            onClose();
        }
    };

    if (!vault) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Participate in {vault.vault_name}</DialogTitle>
                    <DialogDescription>
                        Enter the amount you want to contribute to this vault
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
                        />
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <span>$0</span>
                            <span>${availableCapacity.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={amount <= 0 || amount > availableCapacity}
                    >
                        Confirm Participation
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

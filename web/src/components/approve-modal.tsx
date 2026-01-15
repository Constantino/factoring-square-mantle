"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ApproveModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    isChangingStatus?: boolean;
}

export function ApproveModal({
    isOpen,
    onClose,
    onConfirm,
    isChangingStatus = false,
}: ApproveModalProps) {
    const [confirmations, setConfirmations] = useState({
        invoiceAuthenticity: false,
        deliveryCompleted: false,
        invoiceValidated: false,
        borrowerKYB: false,
        debtorRisk: false,
    });

    const handleCheckboxChange = (name: keyof typeof confirmations) => {
        setConfirmations((prev) => ({
            ...prev,
            [name]: !prev[name],
        }));
    };

    const allChecked = Object.values(confirmations).every((checked) => checked);

    const handleClose = () => {
        // Reset checkboxes when modal closes
        setConfirmations({
            invoiceAuthenticity: false,
            deliveryCompleted: false,
            invoiceValidated: false,
            borrowerKYB: false,
            debtorRisk: false,
        });
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Approve Loan Request</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Are you sure you want to approve this loan request? This will change the status to LISTED and will deploy its own Vault.
                    </p>
                    <div className="space-y-3 border-t pt-4">
                        <p className="text-sm font-medium text-foreground">
                            Please confirm all checks are completed:
                        </p>
                        <div className="space-y-2.5">
                            <div className="flex items-start gap-2">
                                <input
                                    id="invoiceAuthenticity"
                                    type="checkbox"
                                    checked={confirmations.invoiceAuthenticity}
                                    onChange={() => handleCheckboxChange("invoiceAuthenticity")}
                                    className={cn(
                                        "mt-0.5 h-4 w-4 rounded border-input text-primary focus:ring-ring focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    )}
                                />
                                <label htmlFor="invoiceAuthenticity" className="text-sm text-foreground cursor-pointer">
                                    Invoice authenticity validated (Control Desk reviewed, no duplicates, correct amounts)
                                </label>
                            </div>
                            <div className="flex items-start gap-2">
                                <input
                                    id="deliveryCompleted"
                                    type="checkbox"
                                    checked={confirmations.deliveryCompleted}
                                    onChange={() => handleCheckboxChange("deliveryCompleted")}
                                    className={cn(
                                        "mt-0.5 h-4 w-4 rounded border-input text-primary focus:ring-ring focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    )}
                                />
                                <label htmlFor="deliveryCompleted" className="text-sm text-foreground cursor-pointer">
                                    Delivery completed and confirmed (evidence of delivery or service completion)
                                </label>
                            </div>
                            <div className="flex items-start gap-2">
                                <input
                                    id="invoiceValidated"
                                    type="checkbox"
                                    checked={confirmations.invoiceValidated}
                                    onChange={() => handleCheckboxChange("invoiceValidated")}
                                    className={cn(
                                        "mt-0.5 h-4 w-4 rounded border-input text-primary focus:ring-ring focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    )}
                                />
                                <label htmlFor="invoiceValidated" className="text-sm text-foreground cursor-pointer">
                                    Invoice validated with the debtor (customer confirms invoice, no disputes)
                                </label>
                            </div>
                            <div className="flex items-start gap-2">
                                <input
                                    id="borrowerKYB"
                                    type="checkbox"
                                    checked={confirmations.borrowerKYB}
                                    onChange={() => handleCheckboxChange("borrowerKYB")}
                                    className={cn(
                                        "mt-0.5 h-4 w-4 rounded border-input text-primary focus:ring-ring focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    )}
                                />
                                <label htmlFor="borrowerKYB" className="text-sm text-foreground cursor-pointer">
                                    Borrower KYB/AML checks passed (business verified, no sanctions/PLD red flags)
                                </label>
                            </div>
                            <div className="flex items-start gap-2">
                                <input
                                    id="debtorRisk"
                                    type="checkbox"
                                    checked={confirmations.debtorRisk}
                                    onChange={() => handleCheckboxChange("debtorRisk")}
                                    className={cn(
                                        "mt-0.5 h-4 w-4 rounded border-input text-primary focus:ring-ring focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    )}
                                />
                                <label htmlFor="debtorRisk" className="text-sm text-foreground cursor-pointer">
                                    Debtor risk acceptable (debtor is solvent, good payment history, no credit red flags)
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={handleClose}
                        disabled={isChangingStatus}
                    >
                        Close
                    </Button>
                    <Button
                        variant="default"
                        onClick={onConfirm}
                        disabled={isChangingStatus || !allChecked}
                        className="bg-green-600 hover:bg-green-700 disabled:opacity-50"
                    >
                        {isChangingStatus ? "Approving..." : "Approve"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

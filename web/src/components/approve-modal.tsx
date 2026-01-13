"use client";

import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Approve Loan Request</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    <p className="text-sm text-muted-foreground">
                        Are you sure you want to approve this loan request? This will change the status to LISTED and will deploy its own Vault.
                    </p>
                </div>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={isChangingStatus}
                    >
                        Close
                    </Button>
                    <Button
                        variant="default"
                        onClick={onConfirm}
                        disabled={isChangingStatus}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        {isChangingStatus ? "Approving..." : "Approve"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

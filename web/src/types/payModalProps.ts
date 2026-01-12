export interface PayModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (amount: number) => Promise<void>;
    totalDebt?: number;
    isProcessing?: boolean;
    processingStep?: string;
    txHash?: string | null;
}


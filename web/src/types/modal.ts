export interface PayModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (amount: number) => Promise<void>;
    maxAmount?: number;
    isProcessing?: boolean;
    processingStep?: string;
    txHash?: string | null;
}


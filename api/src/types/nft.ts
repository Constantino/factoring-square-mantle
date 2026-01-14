export interface GenerateInvoiceMetadataBody {
    name: string;
    description: string;
    image: string; // URL
    borrowerName: string;
    loanRequestId: number;
    invoiceNumber: string;
}

export interface InvoiceMetadata {
    name: string;
    description: string;
    image: string;
    attributes: Array<{
        trait_type: string;
        value: string;
    }>;
}

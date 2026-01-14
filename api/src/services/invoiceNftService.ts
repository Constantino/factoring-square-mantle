import { GenerateInvoiceMetadataBody, InvoiceMetadata } from '../types/nft';

export class InvoiceNftService {
    /**
     * Generates NFT metadata following ERC-721 metadata standard
     */
    public generateInvoiceMetadata(data: GenerateInvoiceMetadataBody): InvoiceMetadata {
        const {
            name,
            description,
            image,
            borrowerName,
            loanRequestId,
            invoiceNumber
        } = data;

        const metadata: InvoiceMetadata = {
            name,
            description,
            image,
            attributes: [
                {
                    trait_type: 'Borrower Name',
                    value: borrowerName
                },
                {
                    trait_type: 'Loan Request ID',
                    value: loanRequestId.toString()
                },
                {
                    trait_type: 'Invoice Number',
                    value: invoiceNumber
                }
            ]
        };

        return metadata;
    }
}

export const invoiceNftService = new InvoiceNftService();

import { GenerateInvoiceMetadataBody, InvoiceMetadata, PinataUploadResult, PinataApiResponse } from '../types/nft';
import { INVOICE_NFT_INVOICE_IMAGE, PINATA_JWT } from '../config/constants';
import { sanitizeForFilename } from '../utils/sanitize';

export class InvoiceNftService {
    /**
     * Generates NFT metadata following ERC-721 metadata standard
     */
    public generateInvoiceMetadata(data: GenerateInvoiceMetadataBody): InvoiceMetadata {
        const {
            name,
            description,
            borrowerName,
            loanRequestId,
            invoiceNumber
        } = data;

        const metadata: InvoiceMetadata = {
            name,
            description,
            image: INVOICE_NFT_INVOICE_IMAGE,
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

    /**
     * Uploads invoice metadata JSON to Pinata IPFS
     * @param metadata - The invoice metadata to upload
     * @returns Pinata upload result with IPFS hash and URLs
     */
    public async uploadMetadataToPinata(metadata: InvoiceMetadata): Promise<PinataUploadResult> {
        if (!PINATA_JWT) {
            throw new Error('PINATA_JWT is not configured. Please set it in your environment variables.');
        }

        try {
            // Convert metadata to JSON string
            const jsonString = JSON.stringify(metadata, null, 2);
            const jsonBuffer = Buffer.from(jsonString, 'utf-8');

            // Create FormData (Node.js 18+ has native FormData support)
            const formData = new FormData();

            // Extract borrower name and invoice number from metadata attributes
            const borrowerName = metadata.attributes.find(attr => attr.trait_type === 'Borrower Name')?.value || 'unknown';
            const invoiceNumber = metadata.attributes.find(attr => attr.trait_type === 'Invoice Number')?.value || 'unknown';

            // Append the buffer as a file
            const fileName = `invoice-metadata-${sanitizeForFilename(borrowerName)}-${sanitizeForFilename(invoiceNumber)}.json`;
            // In Node.js FormData, append buffer with filename as third parameter
            formData.append('file', new Blob([jsonBuffer], { type: 'application/json' }), fileName);

            // Add optional metadata
            const pinataMetadata = JSON.stringify({
                name: `Invoice NFT Metadata - ${metadata.name}`,
                keyvalues: {
                    borrowerName: borrowerName,
                    invoiceNumber: invoiceNumber,
                }
            });
            formData.append('pinataMetadata', pinataMetadata);

            // Upload to Pinata
            const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${PINATA_JWT}`
                },
                body: formData
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Pinata upload failed: ${response.status} ${response.statusText} - ${errorText}`);
            }

            const result = await response.json() as PinataApiResponse;

            // Construct IPFS URLs
            const ipfsHash = result.IpfsHash;
            const ipfsUrl = `https://ipfs.io/ipfs/${ipfsHash}`;
            const pinataUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;

            return {
                IpfsHash: ipfsHash,
                PinSize: result.PinSize,
                Timestamp: result.Timestamp,
                ipfsUrl,
                pinataUrl
            };
        } catch (error) {
            console.error('Error uploading metadata to Pinata:', error);
            throw error;
        }
    }
}

export const invoiceNftService = new InvoiceNftService();

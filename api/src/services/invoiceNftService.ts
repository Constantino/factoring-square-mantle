import { ethers } from 'ethers';
import { GenerateInvoiceMetadataBody, InvoiceMetadata, PinataUploadResult, PinataApiResponse, MintResult } from '../types/nft';
import { INVOICE_NFT_INVOICE_IMAGE, PINATA_JWT, RPC_URL, PRIVATE_KEY, INVOICE_NFT_ADDRESS, EXPLORER_URL_BASE } from '../config/constants';
import { sanitizeForFilename } from '../utils/sanitize';
import { INVOICENFT_ABI } from '../abi/InvoiceNFT';
import { validateInvoiceNftAddress, validateRecipientAddress } from '../validators/nftValidator';
import { pool } from '../config/database';

export class InvoiceNftService {
    private provider: ethers.JsonRpcProvider;
    private wallet: ethers.Wallet;
    private invoiceNftContract: ethers.Contract;

    constructor() {
        this.provider = new ethers.JsonRpcProvider(RPC_URL);
        this.wallet = new ethers.Wallet(PRIVATE_KEY, this.provider);
        this.invoiceNftContract = new ethers.Contract(INVOICE_NFT_ADDRESS, INVOICENFT_ABI, this.wallet);
    }
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

    /**
     * Mints an NFT with the given metadata to the specified address
     * @param data - The invoice metadata parameters to generate and mint
     * @param toAddress - The address to mint the NFT to
     * @returns Mint result with tokenId, transaction hash, and URLs
     */
    public async mintInvoiceNFT(data: GenerateInvoiceMetadataBody, toAddress: string): Promise<MintResult> {
        // Validate configuration and address
        const addressConfigError = validateInvoiceNftAddress();
        if (addressConfigError) {
            throw new Error(addressConfigError);
        }

        const recipientAddressError = validateRecipientAddress(toAddress);
        if (recipientAddressError) {
            throw new Error(recipientAddressError);
        }

        try {
            // Generate the metadata from the provided parameters
            const metadata = this.generateInvoiceMetadata(data);

            // Upload metadata to Pinata to get the URI
            const pinataResult = await this.uploadMetadataToPinata(metadata);
            const uri = pinataResult.pinataUrl;

            // Mint the NFT using the Pinata URL as the token URI
            const tx = await this.invoiceNftContract.mint(toAddress, uri);
            const receipt = await tx.wait();

            // Extract tokenId from the InvoiceMinted event
            const invoiceMintedEvent = receipt.logs
                .map((log: any) => {
                    try {
                        return this.invoiceNftContract.interface.parseLog(log);
                    } catch {
                        return null;
                    }
                })
                .find((parsedLog: any) => parsedLog && parsedLog.name === 'InvoiceMinted');

            let tokenId: string;
            if (invoiceMintedEvent && invoiceMintedEvent.args) {
                tokenId = invoiceMintedEvent.args.tokenId.toString();
            } else {
                // Fallback: get the tokenId from the contract's nextTokenId (minus 1 since it increments after mint)
                const nextTokenId = await this.invoiceNftContract.nextTokenId();
                tokenId = (nextTokenId - 1n).toString();
            }

            // Save token_id, token_uri, and token_address to LoanRequests table
            const updateQuery = `
                UPDATE "LoanRequests"
                SET 
                    token_id = $1,
                    token_uri = $2,
                    token_address = $3
                WHERE id = $4
            `;
            await pool.query(updateQuery, [
                parseInt(tokenId, 10),
                uri,
                INVOICE_NFT_ADDRESS,
                data.loanRequestId
            ]);

            // Construct explorer URL
            const explorerUrl = `${EXPLORER_URL_BASE}/tx/${receipt.hash}`;

            return {
                tokenId,
                txHash: receipt.hash,
                toAddress,
                uri,
                explorerUrl
            };
        } catch (error) {
            console.error('Error minting invoice NFT:', error);
            throw error;
        }
    }
}

export const invoiceNftService = new InvoiceNftService();

import express, { Router } from 'express';
import * as nftController from '../controllers/nftController';

const router: Router = express.Router();

// NFT routes
router.post('/invoice-metadata', nftController.generateInvoiceMetadata);
router.post('/upload-metadata', nftController.uploadMetadataToPinata);

export default router;

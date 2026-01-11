import express, {Router} from "express";
import * as vc from "../controllers/vaultController";

const router: Router = express.Router();

// Vault routes
router.get('/', vc.getAllVaults);
router.post('/', vc.createVault);

// Lender routes
router.get('/lender/:lenderAddress/participations', vc.getLendsByLender);

// Deposit routes
router.post('/:vaultAddress/deposit', vc.trackDeposit);
router.get('/:vaultAddress/lenders', vc.getVaultLenders);

export default router;
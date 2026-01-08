import express, {Router} from "express";
import * as vc from "../controllers/vaultController";

const router: Router = express.Router();

// Vault routes
router.get('/', vc.getAllVaults);
router.post('/', vc.createVault);

export default router;
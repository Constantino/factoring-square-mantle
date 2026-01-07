import express, {Router} from "express";
import * as vc from "../controllers/vaultController";

const router: Router = express.Router();

// Loan request routes
router.post('/', vc.createVault);

export default router;
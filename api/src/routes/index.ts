import express, { Router } from 'express';
import exampleRoutes from './exampleRoutes';
import loanRequestRoutes from './loanRequestRoutes';
import borrowerKybRoutes from './borrowerKybRoutes';
import vaultsRoutes from "./vaultsRoutes";
import faucetRoutes from "./faucetRoutes";

const router: Router = express.Router();

// Example routes
router.use('/', exampleRoutes);

// Loan request routes
router.use('/loan-requests', loanRequestRoutes);

// Vaults routes
router.use('/vaults', vaultsRoutes);

// Borrower KYB routes
router.use('/borrowers/kybs', borrowerKybRoutes);

// Faucet routes
router.use('/faucet', faucetRoutes);

export default router;


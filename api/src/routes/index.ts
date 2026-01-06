import express, { Router } from 'express';
import exampleRoutes from './exampleRoutes';
import loanRequestRoutes from './loanRequestRoutes';
import vaultsRoutes from "./vaultsRoutes";

const router: Router = express.Router();

// Example routes
router.use('/', exampleRoutes);

// Loan request routes
router.use('/loan-requests', loanRequestRoutes);
router.use('/vaults', vaultsRoutes);

export default router;


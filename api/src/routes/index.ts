import express, { Router } from 'express';
import exampleRoutes from './exampleRoutes';
import loanRequestRoutes from './loanRequestRoutes';
import borrowerKybRoutes from './borrowerKybRoutes';

const router: Router = express.Router();

// Example routes
router.use('/', exampleRoutes);

// Loan request routes
router.use('/loan-requests', loanRequestRoutes);

// Borrower KYB routes
router.use('/borrower-kybs', borrowerKybRoutes);

export default router;


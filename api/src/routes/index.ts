import express, { Router } from 'express';
import exampleRoutes from './exampleRoutes';
import loanRequestRoutes from './loanRequestRoutes';

const router: Router = express.Router();

// Example routes
router.use('/', exampleRoutes);

// Loan request routes
router.use('/loan-requests', loanRequestRoutes);

export default router;


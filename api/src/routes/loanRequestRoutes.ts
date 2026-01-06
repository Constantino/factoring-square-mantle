import express, { Router } from 'express';
import * as loanRequestController from '../controllers/loanRequestController';

const router: Router = express.Router();

// Loan request routes
router.get('/:id', loanRequestController.getLoanRequestById);
router.post('/', loanRequestController.createLoanRequest);

export default router;


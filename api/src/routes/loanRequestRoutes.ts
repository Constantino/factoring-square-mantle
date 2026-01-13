import express, { Router } from 'express';
import * as loanRequestController from '../controllers/loanRequestController';

const router: Router = express.Router();

// Loan request routes
router.get('/borrower/:borrowerAddress', loanRequestController.getLoanRequestByBorrowerAddress);
router.get('/:id/details', loanRequestController.getLoanRequestByIdWithDetails);
router.get('/:id', loanRequestController.getLoanRequestById);
router.post('/', loanRequestController.createLoanRequest);
router.patch('/:id/status', loanRequestController.changeLoanStatus);

export default router;


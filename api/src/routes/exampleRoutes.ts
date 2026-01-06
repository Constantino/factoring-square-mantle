import express, { Router } from 'express';
import * as exampleController from '../controllers/exampleController';

const router: Router = express.Router();

// Example routes
router.get('/', exampleController.getExample);
router.post('/', exampleController.postExample);

export default router;


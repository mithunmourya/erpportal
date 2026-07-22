import express from 'express';
import { verifyToken, requireRole } from '../middleware/auth.middleware.js';
import * as reportController from '../controllers/reportController.js';

const router = express.Router();

// Protect all report routes
router.use(verifyToken);
router.use(requireRole(['Admin', 'Accounts']));

router.get('/daily', reportController.getDailySales);
router.get('/monthly', reportController.getMonthlySales);

export default router;

import { Router } from 'express';
import * as stockMovementController from '../controllers/stockMovementController.js';
import { verifyToken, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

// Require authentication
router.use(verifyToken);

// Inventory movements route accessible by Warehouse and Admin
router.get('/movements', requireRole(['Warehouse', 'Admin']), stockMovementController.getAll);

export default router;

import { Router } from 'express';
import * as productController from '../controllers/productController.js';
import * as stockMovementController from '../controllers/stockMovementController.js';
import { verifyToken, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

// All product routes require authentication
router.use(verifyToken);

router.post('/', productController.create);
router.get('/', productController.getAll);
router.get('/:id', productController.getById);
router.put('/:id', productController.update);

// Manual stock adjustment
router.post('/:id/adjust', requireRole(['Admin', 'Warehouse']), stockMovementController.adjustStock);

// Stock movements sub-resource
router.post('/:id/stock-movements', stockMovementController.addMovement);
router.get('/:id/stock-movements', stockMovementController.getHistory);

// Only Admins can deactivate products
router.put('/:id/deactivate', requireRole(['Admin']), productController.deactivate);

export default router;
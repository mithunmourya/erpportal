import { Router } from 'express';
import * as salesChallanController from '../controllers/salesChallanController.js';
import { verifyToken, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

// All routes require authentication
router.use(verifyToken);

// Read routes available to all authenticated roles
router.get('/', salesChallanController.getAll);
router.get('/:id', salesChallanController.getById);

// Create and Edit restricted to Admin and Sales roles
router.post('/', requireRole(['Admin', 'Sales']), salesChallanController.create);
router.put('/:id', requireRole(['Admin', 'Sales']), salesChallanController.update);
router.put('/:id/confirm', requireRole(['Admin', 'Sales']), salesChallanController.confirm);

export default router;

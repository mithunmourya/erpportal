import { Router } from 'express';
import * as customerController from '../controllers/customerController.js';
import { verifyToken, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

// All customer routes require authentication
router.use(verifyToken);

router.post('/', customerController.create);
router.get('/', customerController.getAll);
router.get('/:id', customerController.getById);
router.put('/:id', customerController.update);
router.post('/:id/follow-ups', customerController.addFollowUp);

// Only Admins can deactivate customers
router.put('/:id/deactivate', requireRole(['Admin']), customerController.deactivate);

export default router;
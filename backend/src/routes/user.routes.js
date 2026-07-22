import { Router } from 'express';
import * as userController from '../controllers/userController.js';
import { validateRegistration } from '../middleware/validateAuth.js';
import { verifyToken, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

// All routes require authentication
router.use(verifyToken);

// Accessible to ANY authenticated user
router.put('/change-password', userController.changePassword);

// Protect the following user management routes - Admin only
router.use(requireRole(['Admin']));

router.post('/', validateRegistration, userController.createUser);
router.get('/', userController.getUsers);
router.put('/:id/deactivate', userController.deactivateUser);
router.put('/:id/reset-password', userController.resetPassword);

export default router;
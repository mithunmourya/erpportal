import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { validateLogin } from '../middleware/validateAuth.js';

const router = Router();

router.post('/login', validateLogin, authController.login);

export default router;
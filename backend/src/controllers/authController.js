import * as authService from '../services/authService.js';
import { sendSuccess } from '../utils/response.js';

export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const data = await authService.login(email, password);
        return sendSuccess(res, data, 200, 'Login successful');
    } catch (error) {
        next(error);
    }
};

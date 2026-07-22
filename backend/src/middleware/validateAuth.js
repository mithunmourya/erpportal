import { sendError } from '../utils/response.js';

export const validateRegistration = (req, res, next) => {
    const { name, email, password, role } = req.body;
    
    if (!name || !email || !password || !role) {
        return sendError(res, 'All fields (name, email, password, role) are required', 400);
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return sendError(res, 'Invalid email format', 400);
    }
    
    if (password.length < 6) {
        return sendError(res, 'Password must be at least 6 characters long', 400);
    }
    
    next();
};

export const validateLogin = (req, res, next) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return sendError(res, 'Email and password are required', 400);
    }
    
    next();
};

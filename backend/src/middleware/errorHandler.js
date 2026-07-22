import { sendError } from '../utils/response.js';

export const errorHandler = (err, req, res, next) => {
    console.error(err.stack);
    
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    
    return sendError(res, message, statusCode);
};

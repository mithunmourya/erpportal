import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        const error = new Error('No token provided or invalid format');
        error.statusCode = 401;
        return next(error);
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        const error = new Error('Invalid or expired token');
        error.statusCode = 401;
        next(error);
    }
};

export const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            const error = new Error('Forbidden: Insufficient role permissions');
            error.statusCode = 403;
            return next(error);
        }
        next();
    };
};

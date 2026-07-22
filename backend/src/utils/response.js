export const sendSuccess = (res, data, statusCode = 200, message = 'Success') => {
    return res.status(statusCode).json({
        success: true,
        message,
        data
    });
};

export const sendError = (res, message, statusCode = 500) => {
    return res.status(statusCode).json({
        success: false,
        message
    });
};
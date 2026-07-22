import * as userService from '../services/userService.js';
import { sendSuccess } from '../utils/response.js';

export const createUser = async (req, res, next) => {
    try {
        const user = await userService.createUser(req.body);
        return sendSuccess(res, user, 201, 'User created successfully');
    } catch (error) {
        next(error);
    }
};

export const getUsers = async (req, res, next) => {
    try {
        const users = await userService.getActiveUsers();
        return sendSuccess(res, users, 200, 'Users retrieved successfully');
    } catch (error) {
        next(error);
    }
};

export const deactivateUser = async (req, res, next) => {
    try {
        const result = await userService.deactivateUser(req.params.id);
        return sendSuccess(res, result, 200, 'User deactivated');
    } catch (error) {
        next(error);
    }
};

export const changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const result = await userService.changePassword(req.user.id, currentPassword, newPassword);
        return sendSuccess(res, result, 200, 'Password changed successfully');
    } catch (error) {
        next(error);
    }
};

export const resetPassword = async (req, res, next) => {
    try {
        const { newPassword } = req.body;
        const result = await userService.resetPassword(req.params.id, newPassword);
        return sendSuccess(res, result, 200, 'Password reset successfully');
    } catch (error) {
        next(error);
    }
};

import bcrypt from 'bcrypt';
import * as userModel from '../models/userModel.js';

export const createUser = async (userData) => {
    const existingUser = await userModel.findByEmail(userData.email);
    if (existingUser) {
        const error = new Error('Email already exists');
        error.statusCode = 409;
        throw error;
    }

    const validRoles = ['Admin', 'Sales', 'Warehouse', 'Accounts'];
    if (!validRoles.includes(userData.role)) {
        const error = new Error('Invalid role');
        error.statusCode = 400;
        throw error;
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    const insertId = await userModel.createUser({
        ...userData,
        password: hashedPassword
    });

    return await userModel.findById(insertId);
};

export const getActiveUsers = async () => {
    return await userModel.findAllActive();
};

export const deactivateUser = async (id) => {
    const user = await userModel.findById(id);
    if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
    }
    
    if (user.role === 'Admin') {
        const activeAdmins = (await userModel.findAllActive()).filter(u => u.role === 'Admin');
        if (activeAdmins.length <= 1) {
            const error = new Error('Cannot deactivate the last active Admin');
            error.statusCode = 400;
            throw error;
        }
    }

    await userModel.deactivate(id);
    return { message: 'User deactivated successfully' };
};

export const changePassword = async (userId, currentPassword, newPassword) => {
    const user = await userModel.findByIdWithPassword(userId);
    if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
        const error = new Error('Incorrect current password');
        error.statusCode = 400;
        throw error;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await userModel.updatePassword(userId, hashedPassword);
    
    return { message: 'Password changed successfully' };
};

export const resetPassword = async (targetUserId, newPassword) => {
    const user = await userModel.findById(targetUserId);
    if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await userModel.updatePassword(targetUserId, hashedPassword);
    
    return { message: 'Password reset successfully' };
};

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import * as userModel from '../models/userModel.js';

export const login = async (email, password) => {
    const user = await userModel.findByEmail(email);
    
    if (!user) {
        const error = new Error('Invalid email or password');
        error.statusCode = 401;
        throw error;
    }

    if (!user.is_active) {
        const error = new Error('Account is deactivated');
        error.statusCode = 401;
        throw error;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        const error = new Error('Invalid email or password');
        error.statusCode = 401;
        throw error;
    }

    const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
    );

    const { password: _, ...userWithoutPassword } = user;

    return { token, user: userWithoutPassword };
};

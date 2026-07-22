import pool from '../config/db.js';

export const findByEmail = async (email) => {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0];
};

export const findById = async (id) => {
    const [rows] = await pool.query('SELECT id, name, email, role, is_active, created_at FROM users WHERE id = ?', [id]);
    return rows[0];
};

export const findByIdWithPassword = async (id) => {
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    return rows[0];
};

export const createUser = async (userData) => {
    const { name, email, password, role } = userData;
    const [result] = await pool.query(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        [name, email, password, role]
    );
    return result.insertId;
};

export const updatePassword = async (id, hashedPassword) => {
    const [result] = await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, id]);
    return result.affectedRows;
};

export const findAllActive = async () => {
    const [rows] = await pool.query('SELECT id, name, email, role, created_at FROM users WHERE is_active = true');
    return rows;
};

export const deactivate = async (id) => {
    const [result] = await pool.query('UPDATE users SET is_active = false WHERE id = ?', [id]);
    return result.affectedRows;
};

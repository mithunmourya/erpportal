import pool from '../config/db.js';

export const create = async (followUpData) => {
    const { customer_id, note, created_by } = followUpData;
    const [result] = await pool.query(
        'INSERT INTO customer_follow_ups (customer_id, note, created_by) VALUES (?, ?, ?)',
        [customer_id, note, created_by]
    );
    return result.insertId;
};

export const findByCustomerId = async (customerId) => {
    const [rows] = await pool.query(
        `SELECT f.*, u.name as created_by_name 
         FROM customer_follow_ups f 
         JOIN users u ON f.created_by = u.id 
         WHERE f.customer_id = ? 
         ORDER BY f.created_at DESC`,
        [customerId]
    );
    return rows;
};

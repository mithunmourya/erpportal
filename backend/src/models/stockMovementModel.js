import pool from '../config/db.js';

export const create = async (movementData, connection) => {
    const db = connection || pool;
    const { product_id, quantity_changed, movement_type, reason, reference_type, reference_id, created_by } = movementData;
    const [result] = await db.query(
        `INSERT INTO stock_movements (product_id, quantity_changed, movement_type, reason, reference_type, reference_id, created_by) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [product_id, quantity_changed, movement_type, reason, reference_type || null, reference_id || null, created_by]
    );
    return result.insertId;
};

export const findByProductId = async (productId) => {
    const [rows] = await pool.query(
        `SELECT s.*, u.name as created_by_name 
         FROM stock_movements s
         JOIN users u ON s.created_by = u.id
         WHERE s.product_id = ?
         ORDER BY s.created_at DESC`,
        [productId]
    );
    return rows;
};

export const findAll = async (searchParams = {}) => {
    let query = `
         SELECT s.*, u.name as created_by_name, p.name as product_name
         FROM stock_movements s
         JOIN users u ON s.created_by = u.id
         JOIN products p ON s.product_id = p.id
         WHERE 1=1
    `;
    const values = [];

    if (searchParams.search) {
        query += ' AND (p.name LIKE ? OR s.reason LIKE ?)';
        const searchPattern = `%${searchParams.search}%`;
        const exactPattern = `${searchParams.search}%`;
        values.push(searchPattern, searchPattern);
        
        query += ` ORDER BY 
            CASE 
                WHEN p.name LIKE ? THEN 1
                ELSE 2
            END,
            s.created_at DESC LIMIT 50`;
        values.push(exactPattern);
    } else {
        query += ' ORDER BY s.created_at DESC LIMIT 50';
    }

    const [rows] = await pool.query(query, values);
    return rows;
};

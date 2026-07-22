import pool from '../config/db.js';

export const findBySku = async (sku) => {
    const [rows] = await pool.query('SELECT * FROM products WHERE sku = ?', [sku]);
    return rows[0];
};

export const findById = async (id, connection) => {
    const db = connection || pool;
    const [rows] = await db.query('SELECT * FROM products WHERE id = ?', [id]);
    return rows[0];
};

export const create = async (productData) => {
    const { name, sku, category, unit_price, min_stock_alert, location } = productData;
    const [result] = await pool.query(
        `INSERT INTO products (name, sku, category, unit_price, min_stock_alert, location) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [name, sku, category, unit_price, min_stock_alert, location]
    );
    return result.insertId;
};

export const update = async (id, productData) => {
    const { name, sku, category, unit_price, min_stock_alert, location } = productData;
    const [result] = await pool.query(
        `UPDATE products SET name=?, sku=?, category=?, unit_price=?, min_stock_alert=?, location=? WHERE id=?`,
        [name, sku, category, unit_price, min_stock_alert, location, id]
    );
    return result.affectedRows;
};

export const findByIdForUpdate = async (id, connection) => {
    const db = connection || pool;
    const [rows] = await db.query('SELECT * FROM products WHERE id = ? FOR UPDATE', [id]);
    return rows[0];
};

export const adjustStock = async (id, quantityChange, connection) => {
    const db = connection || pool;
    const [result] = await db.query(
        'UPDATE products SET current_stock = current_stock + ? WHERE id = ?',
        [quantityChange, id]
    );
    return result.affectedRows;
};

export const findAllActive = async (searchParams = {}) => {
    let query = 'SELECT * FROM products WHERE is_active = true';
    const values = [];

    if (searchParams.category) {
        query += ' AND category = ?';
        values.push(searchParams.category);
    }

    if (searchParams.search) {
        query += ' AND (name LIKE ? OR sku LIKE ?)';
        const searchPattern = `%${searchParams.search}%`;
        const exactPattern = `${searchParams.search}%`;
        values.push(searchPattern, searchPattern);
        
        query += ` ORDER BY 
            CASE 
                WHEN sku LIKE ? THEN 1
                WHEN name LIKE ? THEN 2
                ELSE 3
            END,
            name ASC LIMIT 50`;
        values.push(exactPattern, exactPattern);
    } else {
        query += ' ORDER BY created_at DESC LIMIT 50';
    }

    const [rows] = await pool.query(query, values);
    return rows;
};

export const deactivate = async (id) => {
    const [result] = await pool.query('UPDATE products SET is_active = false WHERE id = ?', [id]);
    return result.affectedRows;
};

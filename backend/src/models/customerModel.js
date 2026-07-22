import pool from '../config/db.js';

export const findByEmail = async (email) => {
    const [rows] = await pool.query('SELECT * FROM customers WHERE email = ?', [email]);
    return rows[0];
};

export const findByMobile = async (mobile) => {
    const [rows] = await pool.query('SELECT * FROM customers WHERE mobile = ?', [mobile]);
    return rows[0];
};

export const findById = async (id) => {
    const [rows] = await pool.query('SELECT * FROM customers WHERE id = ?', [id]);
    return rows[0];
};

export const create = async (customerData) => {
    const { name, mobile, email, business_name, gst_number, customer_type, address, status, follow_up_date, notes } = customerData;
    const [result] = await pool.query(
        `INSERT INTO customers (name, mobile, email, business_name, gst_number, customer_type, address, status, follow_up_date, notes) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, mobile, email, business_name, gst_number || null, customer_type, address, status, follow_up_date || null, notes || null]
    );
    return result.insertId;
};

export const update = async (id, customerData) => {
    const { name, mobile, email, business_name, gst_number, customer_type, address, status, follow_up_date, notes } = customerData;
    const [result] = await pool.query(
        `UPDATE customers SET name=?, mobile=?, email=?, business_name=?, gst_number=?, customer_type=?, address=?, status=?, follow_up_date=?, notes=? WHERE id=?`,
        [name, mobile, email, business_name, gst_number || null, customer_type, address, status, follow_up_date || null, notes || null, id]
    );
    return result.affectedRows;
};

export const findAllActive = async (searchParams = {}) => {
    let query = 'SELECT * FROM customers WHERE is_active = true';
    const values = [];

    if (searchParams.status) {
        query += ' AND status = ?';
        values.push(searchParams.status);
    }

    if (searchParams.search) {
        query += ' AND (name LIKE ? OR business_name LIKE ? OR mobile LIKE ?)';
        const searchPattern = `%${searchParams.search}%`;
        const exactPattern = `${searchParams.search}%`;
        values.push(searchPattern, searchPattern, searchPattern);
        
        query += ` ORDER BY 
            CASE 
                WHEN business_name LIKE ? THEN 1
                WHEN name LIKE ? THEN 2
                WHEN mobile LIKE ? THEN 3
                ELSE 4
            END,
            business_name ASC LIMIT 50`;
        values.push(exactPattern, exactPattern, exactPattern);
    } else {
        query += ' ORDER BY created_at DESC LIMIT 50';
    }

    const [rows] = await pool.query(query, values);
    return rows;
};

export const deactivate = async (id) => {
    const [result] = await pool.query('UPDATE customers SET is_active = false WHERE id = ?', [id]);
    return result.affectedRows;
};

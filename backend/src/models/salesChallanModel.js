import pool from '../config/db.js';

export const generateChallanNumber = async (connection) => {
    const db = connection || pool;
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
    const [rows] = await db.query(`SELECT COUNT(*) as count FROM sales_challans WHERE challan_number LIKE ?`, [`CHL-${dateStr}-%`]);
    const sequence = (rows[0].count + 1).toString().padStart(4, '0');
    return `CHL-${dateStr}-${sequence}`;
};

export const create = async (challanData, connection) => {
    const db = connection || pool;
    const { challan_number, customer_id, total_quantity, status, created_by } = challanData;
    const [result] = await db.query(
        `INSERT INTO sales_challans (challan_number, customer_id, total_quantity, status, created_by) 
         VALUES (?, ?, ?, ?, ?)`,
        [challan_number, customer_id, total_quantity, status, created_by]
    );
    return result.insertId;
};

export const update = async (id, challanData, connection) => {
    const db = connection || pool;
    const { total_quantity } = challanData;
    const [result] = await db.query(
        `UPDATE sales_challans SET total_quantity = ? WHERE id = ?`,
        [total_quantity, id]
    );
    return result.affectedRows;
};

export const findById = async (id, connection) => {
    const db = connection || pool;
    const [rows] = await db.query(
        `SELECT c.*, cust.name as customer_name, cust.email as customer_email, u.name as created_by_name
         FROM sales_challans c
         JOIN customers cust ON c.customer_id = cust.id
         JOIN users u ON c.created_by = u.id
         WHERE c.id = ?`,
        [id]
    );
    return rows[0];
};

export const findAll = async (searchParams = {}) => {
    let query = `
        SELECT c.*, cust.name as customer_name 
        FROM sales_challans c
        JOIN customers cust ON c.customer_id = cust.id
        WHERE 1=1
    `;
    const values = [];

    if (searchParams.status) {
        query += ' AND c.status = ?';
        values.push(searchParams.status);
    }
    if (searchParams.customer_id) {
        query += ' AND c.customer_id = ?';
        values.push(searchParams.customer_id);
    }
    
    const page = parseInt(searchParams.page) || 1;
    const limit = parseInt(searchParams.limit) || 50;
    const offset = (page - 1) * limit;

    if (searchParams.search) {
        query += ' AND (c.challan_number LIKE ? OR cust.name LIKE ?)';
        const searchPattern = `%${searchParams.search}%`;
        const exactPattern = `${searchParams.search}%`;
        values.push(searchPattern, searchPattern);
        
        query += ` ORDER BY 
            CASE 
                WHEN c.challan_number LIKE ? THEN 1
                WHEN cust.name LIKE ? THEN 2
                ELSE 3
            END,
            c.created_at DESC LIMIT ? OFFSET ?`;
        values.push(exactPattern, exactPattern, limit, offset);
    } else {
        query += ' ORDER BY c.created_at DESC LIMIT ? OFFSET ?';
        values.push(limit, offset);
    }

    const [rows] = await pool.query(query, values);
    return rows;
};

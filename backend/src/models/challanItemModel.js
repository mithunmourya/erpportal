import pool from '../config/db.js';

export const bulkCreate = async (items, connection) => {
    const db = connection || pool;
    if (items.length === 0) return;
    
    // items is array of arrays: [[challan_id, product_id, name_snapshot, price_snapshot, quantity, total_price], ...]
    const [result] = await db.query(
        `INSERT INTO challan_items (challan_id, product_id, product_name_snapshot, unit_price_snapshot, quantity, total_price) 
         VALUES ?`,
        [items]
    );
    return result.affectedRows;
};

export const deleteByChallanId = async (challanId, connection) => {
    const db = connection || pool;
    const [result] = await db.query('DELETE FROM challan_items WHERE challan_id = ?', [challanId]);
    return result.affectedRows;
};

export const findByChallanId = async (challanId) => {
    const [rows] = await pool.query(
        `SELECT * FROM challan_items WHERE challan_id = ?`,
        [challanId]
    );
    return rows;
};

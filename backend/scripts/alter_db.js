import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const alterDB = async () => {
    try {
        const pool = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        await pool.query("ALTER TABLE stock_movements MODIFY COLUMN movement_type ENUM('IN', 'OUT', 'ADJUSTMENT') NOT NULL");
        console.log("Updated movement_type ENUM");

        try {
            await pool.query("ALTER TABLE stock_movements ADD COLUMN reference_type VARCHAR(50)");
            console.log("Added reference_type");
        } catch (e) {
            if (e.code !== 'ER_DUP_FIELDNAME') throw e;
        }

        try {
            await pool.query("ALTER TABLE stock_movements ADD COLUMN reference_id INT");
            console.log("Added reference_id");
        } catch (e) {
            if (e.code !== 'ER_DUP_FIELDNAME') throw e;
        }

        console.log('Database altered successfully');
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

alterDB();

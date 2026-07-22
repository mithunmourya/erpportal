import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const testSearch = async () => {
    try {
        const pool = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        const searchPattern = '%Wire%';
        const exactPattern = 'Wire%';
        const [rows] = await pool.query(
            `SELECT name, sku FROM products WHERE is_active = true AND (name LIKE ? OR sku LIKE ?)
             ORDER BY CASE WHEN sku LIKE ? THEN 1 WHEN name LIKE ? THEN 2 ELSE 3 END, name ASC LIMIT 10`,
            [searchPattern, searchPattern, exactPattern, exactPattern]
        );
        console.log("Search Results:", rows);
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

testSearch();

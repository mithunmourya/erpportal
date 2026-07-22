import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
import * as stockMovementModel from './src/models/stockMovementModel.js';
import * as productModel from './src/models/productModel.js';

const testStock = async () => {
    try {
        const pool = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        const [products] = await pool.query("SELECT * FROM products LIMIT 1");
        if(products.length > 0) {
            const product_id = products[0].id;
            const insertId = await stockMovementModel.create({
                product_id,
                quantity_changed: 5,
                movement_type: 'ADJUSTMENT',
                reason: 'Testing schema',
                reference_type: 'MANUAL_TEST',
                reference_id: 999,
                created_by: 1
            }, pool);
            console.log("Inserted with ID:", insertId);
        }
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

testStock();

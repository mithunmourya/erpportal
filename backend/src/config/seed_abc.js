import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function seed() {
    console.log('--- Seeding ABC Distributors Scenario ---');
    try {
        const hashedPassword = await bcrypt.hash('password123', 10);

        // 1. Clear tables safely
        console.log('Clearing old data...');
        await pool.query('SET FOREIGN_KEY_CHECKS = 0');
        await pool.query('TRUNCATE TABLE challan_items');
        await pool.query('TRUNCATE TABLE stock_movements');
        await pool.query('TRUNCATE TABLE sales_challans');
        await pool.query('TRUNCATE TABLE customer_follow_ups');
        await pool.query('TRUNCATE TABLE customers');
        await pool.query('TRUNCATE TABLE products');
        await pool.query('TRUNCATE TABLE users');
        await pool.query('SET FOREIGN_KEY_CHECKS = 1');

        // 2. Employees (Users)
        console.log('Seeding Employees...');
        await pool.query(
            `INSERT INTO users (name, email, password, role) VALUES ?`,
            [[
                ['Admin', 'admin@erp.com', hashedPassword, 'Admin'],
                ['Rahul', 'rahul@erp.com', hashedPassword, 'Sales'],
                ['Ramesh', 'ramesh@erp.com', hashedPassword, 'Warehouse'],
                ['Priya', 'priya@erp.com', hashedPassword, 'Accounts']
            ]]
        );

        // 3. Products Catalog
        console.log('Seeding Products...');
        const products = [
            ['Wireless Mouse', 'WM-01', 'Electronics', 500.00, 20, 'Bin A'],
            ['Keyboard', 'KB-01', 'Electronics', 800.00, 15, 'Bin B'],
            ['Monitor', 'MN-01', 'Electronics', 8000.00, 10, 'Bin C'],
            ['Printer', 'PR-01', 'Electronics', 12000.00, 5, 'Bin D']
        ];
        
        await pool.query(
            `INSERT INTO products (name, sku, category, unit_price, min_stock_alert, location) VALUES ?`,
            [products]
        );

        // Add initial stock movements to bring current_stock to correct levels
        const [insertedProducts] = await pool.query('SELECT id, name FROM products');
        for (const p of insertedProducts) {
            let initialQty = 0;
            if (p.name === 'Wireless Mouse') initialQty = 100;
            if (p.name === 'Keyboard') initialQty = 80;
            if (p.name === 'Monitor') initialQty = 40;
            if (p.name === 'Printer') initialQty = 15;

            // Trigger stock movement to update current_stock
            await pool.query(
                `INSERT INTO stock_movements (product_id, quantity_changed, movement_type, reason, created_by) VALUES (?, ?, ?, ?, ?)`,
                [p.id, initialQty, 'IN', 'Initial Inventory Load', 1]
            );
            await pool.query(
                `UPDATE products SET current_stock = current_stock + ? WHERE id = ?`,
                [initialQty, p.id]
            );
        }

        // 4. Customers (CRM)
        console.log('Seeding Customers...');
        await pool.query(
            `INSERT INTO customers (name, mobile, email, business_name, customer_type, address, status) VALUES ?`,
            [[
                ['Amit', '9876543210', 'amit@techworld.com', 'Tech World', 'Wholesale', 'New Delhi', 'Lead'],
                ['Smart Computers', '9123456789', 'contact@smartcomp.com', 'Smart Computers', 'Retail', 'Mumbai', 'Active'],
                ['Laptop Zone', '9988776655', 'sales@laptopzone.com', 'Laptop Zone', 'Retail', 'Pune', 'Lead']
            ]]
        );

        // Follow up for Laptop Zone (ID: 3)
        await pool.query(
            `INSERT INTO customer_follow_ups (customer_id, note, created_by) VALUES (?, ?, ?)`,
            [3, 'Initial Contact, will follow up next week', 2] // Assuming Laptop Zone gets ID 3 and Rahul is ID 2
        );

        console.log('--- Seeding Completed Successfully! ---');
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
}

seed();

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
dotenv.config({ path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env' });

const initialPool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const initDB = async () => {
    try {
        console.log('Connecting to database server...');
        await initialPool.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\``);
        console.log(`Database ${process.env.DB_NAME} ensured.`);
        await initialPool.end();

        const pool = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });

        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                role ENUM('Admin', 'Sales', 'Warehouse', 'Accounts') NOT NULL,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS customers (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                mobile VARCHAR(20) NOT NULL,
                email VARCHAR(255) NOT NULL,
                business_name VARCHAR(255) NOT NULL,
                gst_number VARCHAR(50),
                customer_type ENUM('Retail', 'Wholesale', 'Distributor') NOT NULL,
                address TEXT NOT NULL,
                status ENUM('Lead', 'Active', 'Inactive') NOT NULL,
                follow_up_date DATE,
                notes TEXT,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS customer_follow_ups (
                id INT AUTO_INCREMENT PRIMARY KEY,
                customer_id INT NOT NULL,
                note TEXT NOT NULL,
                created_by INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
                FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS products (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                sku VARCHAR(100) NOT NULL UNIQUE,
                category VARCHAR(100) NOT NULL,
                unit_price DECIMAL(10,2) NOT NULL,
                current_stock INT NOT NULL DEFAULT 0,
                min_stock_alert INT NOT NULL,
                location VARCHAR(255) NOT NULL,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS stock_movements (
                id INT AUTO_INCREMENT PRIMARY KEY,
                product_id INT NOT NULL,
                quantity_changed INT NOT NULL,
                movement_type ENUM('IN', 'OUT', 'ADJUSTMENT') NOT NULL,
                reason VARCHAR(255) NOT NULL,
                reference_type VARCHAR(50),
                reference_id INT,
                created_by INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
                FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS sales_challans (
                id INT AUTO_INCREMENT PRIMARY KEY,
                challan_number VARCHAR(100) NOT NULL UNIQUE,
                customer_id INT NOT NULL,
                total_quantity INT NOT NULL,
                status ENUM('Draft', 'Confirmed', 'Cancelled') NOT NULL,
                created_by INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
                FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS challan_items (
                id INT AUTO_INCREMENT PRIMARY KEY,
                challan_id INT NOT NULL,
                product_id INT NOT NULL,
                product_name_snapshot VARCHAR(255) NOT NULL,
                unit_price_snapshot DECIMAL(10,2) NOT NULL,
                quantity INT NOT NULL,
                total_price DECIMAL(10,2) NOT NULL,
                FOREIGN KEY (challan_id) REFERENCES sales_challans(id) ON DELETE CASCADE,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
            )
        `);

        const [users] = await pool.query('SELECT COUNT(*) as count FROM users');
        if (users[0].count === 0) {
            console.log('No users found. Creating default Admin...');
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await pool.query(
                'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
                ['System Admin', 'admin@erp.com', hashedPassword, 'Admin']
            );
            console.log('Default admin created: admin@erp.com / admin123');
        }

        console.log('Database initialization complete!');
        process.exit(0);
    } catch (error) {
        console.error('Error initializing database:', error);
        process.exit(1);
    }
};

initDB();

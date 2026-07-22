import { execSync } from 'child_process';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });

export default async () => {
    console.log('\n[Jest Setup] Dropping and re-initializing test database...');
    try {
        const pool = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
        });
        
        await pool.query(`DROP DATABASE IF EXISTS \`${process.env.DB_NAME}\``);
        await pool.end();

        execSync('node src/config/init_db.js', { 
            env: { ...process.env, NODE_ENV: 'test' },
            stdio: 'inherit'
        });
        console.log('[Jest Setup] Test database initialized successfully.');
    } catch (error) {
        console.error('[Jest Setup] Failed to initialize test database.', error);
        process.exit(1);
    }
};

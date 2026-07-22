import request from 'supertest';
import app from '../src/app.js';
import pool from '../src/config/db.js';

describe('Auth & RBAC Test Suite', () => {
    let adminToken;
    let salesToken;
    let salesUserId;

    afterAll(async () => {
        await pool.end();
    });

    it('should login as default Admin', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'admin@erp.com', password: 'admin123' });
        
        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.token).toBeDefined();
        adminToken = res.body.data.token;
    });

    it('should fail with missing JWT token', async () => {
        const res = await request(app).get('/api/users');
        expect(res.statusCode).toEqual(401);
        expect(res.body.success).toBe(false);
    });

    it('should fail with malformed JWT token', async () => {
        const res = await request(app)
            .get('/api/users')
            .set('Authorization', 'Bearer invalid_token_abc');
        expect(res.statusCode).toEqual(401);
        expect(res.body.success).toBe(false);
    });

    it('should fail registration with invalid ENUM role', async () => {
        const res = await request(app)
            .post('/api/users')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                name: 'Hacker',
                email: 'hacker@erp.com',
                password: 'password123',
                role: 'SuperAdmin' // Invalid
            });
        
        expect(res.statusCode).toEqual(400); // Bad Request
    });

    it('should create a Sales user', async () => {
        const res = await request(app)
            .post('/api/users')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                name: 'Test Sales',
                email: 'sales_auth@erp.com',
                password: 'password123',
                role: 'Sales'
            });
        
        expect(res.statusCode).toEqual(201);
        salesUserId = res.body.data.id;
    });

    it('should login as Sales user', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'sales_auth@erp.com', password: 'password123' });
        
        expect(res.statusCode).toEqual(200);
        salesToken = res.body.data.token;
    });

    it('should block Sales user from accessing Admin-only endpoint', async () => {
        const res = await request(app)
            .get('/api/users')
            .set('Authorization', `Bearer ${salesToken}`);
        
        expect(res.statusCode).toEqual(403);
        expect(res.body.success).toBe(false);
    });

    it('should deactivate the Sales user (Admin action)', async () => {
        const res = await request(app)
            .put(`/api/users/${salesUserId}/deactivate`)
            .set('Authorization', `Bearer ${adminToken}`);
        
        expect(res.statusCode).toEqual(200);
    });

    it('should block login for deactivated user', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'sales_auth@erp.com', password: 'password123' });
        
        expect(res.statusCode).toEqual(401);
        expect(res.body.message).toMatch(/deactivated/i);
    });
});

import request from 'supertest';
import app from '../src/app.js';
import pool from '../src/config/db.js';

describe('CRM & Data Integrity Test Suite', () => {
    let adminToken;
    let customerId;

    beforeAll(async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'admin@erp.com', password: 'admin123' });
        adminToken = res.body.data.token;
    });

    afterAll(async () => {
        await pool.end();
    });

    it('should create a valid customer', async () => {
        const res = await request(app)
            .post('/api/customers')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                name: 'Data Integrity Corp',
                mobile: '9999999999',
                email: 'integrity@example.com',
                business_name: 'DI Corp',
                customer_type: 'Retail',
                address: '123 Main St',
                status: 'Active'
            });
        
        expect(res.statusCode).toEqual(201);
        customerId = res.body.data.id;
    });

    it('should fail creating customer with duplicate email', async () => {
        const res = await request(app)
            .post('/api/customers')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                name: 'Copy Cat',
                mobile: '8888888888',
                email: 'integrity@example.com', // Duplicate
                business_name: 'CC Corp',
                customer_type: 'Retail',
                address: '123 Copy St',
                status: 'Active'
            });
        
        expect(res.statusCode).toEqual(409);
    });

    it('should deactivate the customer', async () => {
        const res = await request(app)
            .put(`/api/customers/${customerId}/deactivate`)
            .set('Authorization', `Bearer ${adminToken}`);
        
        expect(res.statusCode).toEqual(200);
    });

    it('should implicitly exclude deactivated customer from GET list', async () => {
        const res = await request(app)
            .get('/api/customers')
            .set('Authorization', `Bearer ${adminToken}`);
        
        expect(res.statusCode).toEqual(200);
        const customers = res.body.data;
        const found = customers.find(c => c.id === customerId);
        expect(found).toBeUndefined(); // Must not exist in the active list
    });
});

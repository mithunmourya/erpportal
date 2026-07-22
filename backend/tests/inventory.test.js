import request from 'supertest';
import app from '../src/app.js';
import pool from '../src/config/db.js';

describe('Inventory & Stock Rules Test Suite', () => {
    let adminToken;
    let productId;

    beforeAll(async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'admin@erp.com', password: 'admin123' });
        adminToken = res.body.data.token;
    });

    afterAll(async () => {
        await pool.end();
    });

    it('should create a new product', async () => {
        const res = await request(app)
            .post('/api/products')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                name: 'Stock Rule Item',
                sku: 'STOCK-001',
                category: 'Testing',
                unit_price: 50.00,
                min_stock_alert: 5,
                location: 'Bin 1'
            });
        
        expect(res.statusCode).toEqual(201);
        productId = res.body.data.id;
        expect(res.body.data.current_stock).toEqual(0); // Ensure it defaults to 0
    });

    it('should log an IN stock movement', async () => {
        const res = await request(app)
            .post(`/api/products/${productId}/stock-movements`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                movement_type: 'IN',
                quantity_changed: 10,
                reason: 'Initial load'
            });
        
        expect(res.statusCode).toEqual(201);
        expect(res.body.data.new_stock).toEqual(10);
    });

    it('should fail logging an OUT movement exceeding current stock', async () => {
        const res = await request(app)
            .post(`/api/products/${productId}/stock-movements`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                movement_type: 'OUT',
                quantity_changed: 20, // Only 10 available
                reason: 'Too many out'
            });
        
        expect(res.statusCode).toEqual(400);
        expect(res.body.message).toMatch(/insufficient stock/i);
    });

    it('should verify stock was not mutated after failed OUT movement', async () => {
        const res = await request(app)
            .get(`/api/products/${productId}`)
            .set('Authorization', `Bearer ${adminToken}`);
        
        expect(res.statusCode).toEqual(200);
        expect(res.body.data.current_stock).toEqual(10);
    });

    it('should verify stock movements are immutable (no PUT/DELETE endpoints)', async () => {
        // We know we didn't implement these, but we must verify they return 404
        const putRes = await request(app)
            .put(`/api/products/${productId}/stock-movements/1`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ quantity_changed: 50 });
        
        expect(putRes.statusCode).toEqual(404);

        const delRes = await request(app)
            .delete(`/api/products/${productId}/stock-movements/1`)
            .set('Authorization', `Bearer ${adminToken}`);
        
        expect(delRes.statusCode).toEqual(404);
    });
});

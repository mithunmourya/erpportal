import request from 'supertest';
import app from '../src/app.js';
import pool from '../src/config/db.js';

describe('Sales Challan Atomic Transactions & Snapshots Test Suite', () => {
    let adminToken;
    let customerId;
    let productId1;
    let productId2;
    let challanId;

    beforeAll(async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'admin@erp.com', password: 'admin123' });
        adminToken = res.body.data.token;

        // Create Customer
        const custRes = await request(app)
            .post('/api/customers')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                name: 'Sales Cust', mobile: '7777777777', email: 'sales@cust.com',
                business_name: 'Biz', customer_type: 'Retail', address: 'Add', status: 'Active'
            });
        customerId = custRes.body.data.id;

        // Create Product 1
        const p1Res = await request(app)
            .post('/api/products')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                name: 'Apple', sku: 'APL-1', category: 'Fruit', unit_price: 10.00, min_stock_alert: 0, location: 'A'
            });
        productId1 = p1Res.body.data.id;

        // Add Stock to Product 1
        await request(app)
            .post(`/api/products/${productId1}/stock-movements`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ movement_type: 'IN', quantity_changed: 100, reason: 'Load' });

        // Create Product 2
        const p2Res = await request(app)
            .post('/api/products')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                name: 'Banana', sku: 'BAN-1', category: 'Fruit', unit_price: 5.00, min_stock_alert: 0, location: 'B'
            });
        productId2 = p2Res.body.data.id;

        // Add Stock to Product 2 (Only 5 items)
        await request(app)
            .post(`/api/products/${productId2}/stock-movements`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ movement_type: 'IN', quantity_changed: 5, reason: 'Load' });
    });

    afterAll(async () => {
        await pool.end();
    });

    it('should create a Draft Sales Challan', async () => {
        const res = await request(app)
            .post('/api/challans')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                customer_id: customerId,
                items: [
                    { product_id: productId1, quantity: 10 },
                    { product_id: productId2, quantity: 10 } // Demands 10, but only 5 in stock
                ]
            });
        
        expect(res.statusCode).toEqual(201);
        expect(res.body.data.status).toEqual('Draft');
        challanId = res.body.data.id;
    });

    it('should abort confirmation if one item exceeds warehouse stock (Atomicity check)', async () => {
        const res = await request(app)
            .put(`/api/challans/${challanId}/confirm`)
            .set('Authorization', `Bearer ${adminToken}`);
        
        expect(res.statusCode).toEqual(400);
        expect(res.body.message).toMatch(/insufficient stock/i);
    });

    it('should verify NO partial stock deduction occurred due to transaction rollback', async () => {
        const p1Res = await request(app).get(`/api/products/${productId1}`).set('Authorization', `Bearer ${adminToken}`);
        const p2Res = await request(app).get(`/api/products/${productId2}`).set('Authorization', `Bearer ${adminToken}`);
        
        // Stock should remain at initial values (100 and 5)
        expect(p1Res.body.data.current_stock).toEqual(100);
        expect(p2Res.body.data.current_stock).toEqual(5);
    });

    it('should verify price snapshot immutability', async () => {
        // Change the master product price
        await request(app)
            .put(`/api/products/${productId1}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                name: 'Apple Red', // Name changed
                sku: 'APL-1',
                category: 'Fruit',
                unit_price: 20.00, // Price doubled
                min_stock_alert: 0,
                location: 'A'
            });
        
        // Fetch the draft challan
        const res = await request(app)
            .get(`/api/challans/${challanId}`)
            .set('Authorization', `Bearer ${adminToken}`);
        
        expect(res.statusCode).toEqual(200);
        
        const items = res.body.data.items;
        const appleItem = items.find(i => i.product_id === productId1);
        
        // Snapshot should remain 'Apple' and '10.00'
        expect(appleItem.product_name_snapshot).toEqual('Apple');
        expect(Number(appleItem.unit_price_snapshot)).toEqual(10.00);
    });
});

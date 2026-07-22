const API_URL = 'http://localhost:5000/api';

async function runTests() {
    console.log('--- STARTING E2E API TESTS ---\n');
    let token = '';
    let customerId;
    let productId;
    let challanId;

    const request = async (method, endpoint, body = null) => {
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        
        const options = { method, headers };
        if (body) options.body = JSON.stringify(body);
        
        const response = await fetch(`${API_URL}${endpoint}`, options);
        const data = await response.json();
        
        if (!response.ok) {
            console.error(`[❌ FAILED] ${method} ${endpoint} => ${data.message || JSON.stringify(data)}`);
            process.exit(1);
        }
        
        console.log(`[✅ SUCCESS] ${method} ${endpoint}`);
        return data.data;
    };

    try {
        // Phase 1: Auth
        console.log('--- Phase 1: Auth ---');
        const loginData = await request('POST', '/auth/login', {
            email: 'admin@erp.com',
            password: 'admin123'
        });
        token = loginData.token;
        console.log('Admin logged in, token received.\n');

        // Phase 1.5: User Management
        console.log('--- Phase 1.5: Users ---');
        const newUser = await request('POST', '/users', {
            name: 'Test Sales',
            email: 'sales@erp.com',
            password: 'sales123',
            role: 'Sales'
        });
        console.log('Sales user created.\n');

        // Phase 2: Customers
        console.log('--- Phase 2: Customers ---');
        const customer = await request('POST', '/customers', {
            name: 'John Doe',
            mobile: '1234567890',
            email: 'john@example.com',
            business_name: 'Doe Enterprises',
            customer_type: 'Wholesale',
            address: '123 Test St',
            status: 'Active'
        });
        customerId = customer.id;
        console.log('Customer created.\n');

        // Phase 3: Products
        console.log('--- Phase 3: Products ---');
        const product = await request('POST', '/products', {
            name: 'Test Widget',
            sku: 'WIDGET-001',
            category: 'Widgets',
            unit_price: 150.00,
            min_stock_alert: 10,
            location: 'A1-Bin2'
        });
        productId = product.id;
        console.log('Product created (initial stock is 0).\n');

        // Phase 4: Stock Movements
        console.log('--- Phase 4: Stock Movements ---');
        const movement = await request('POST', `/products/${productId}/stock-movements`, {
            movement_type: 'IN',
            quantity_changed: 100,
            reason: 'Initial Restock'
        });
        console.log(`Stock Movement Added. New Stock: ${movement.new_stock}\n`);

        if (movement.new_stock !== 100) {
            throw new Error('Stock movement calculation failed!');
        }

        // Phase 5: Sales Challan (Draft)
        console.log('--- Phase 5: Sales Challan (Draft) ---');
        const challan = await request('POST', '/challans', {
            customer_id: customerId,
            items: [
                { product_id: productId, quantity: 25 }
            ]
        });
        challanId = challan.id;
        console.log(`Challan Created. Status: ${challan.status}, Total Qty: ${challan.total_quantity}\n`);

        // Phase 6: Confirm Challan
        console.log('--- Phase 6: Confirm Challan ---');
        const confirmedChallan = await request('PUT', `/challans/${challanId}/confirm`);
        console.log(`Challan Confirmed. Status: ${confirmedChallan.status}\n`);

        // Verify Final Stock
        console.log('--- Verification ---');
        const finalProduct = await request('GET', `/products/${productId}`);
        console.log(`Final Product Stock: ${finalProduct.current_stock} (Expected: 75)`);
        
        if (finalProduct.current_stock !== 75) {
            throw new Error('Final stock calculation is incorrect after confirmation!');
        }

        console.log('\n✅ ALL E2E TESTS PASSED SUCCESSFULLY! The architecture works flawlessly.');
    } catch (error) {
        console.error('\n❌ Test Suite Failed:', error.message);
    }
}

runTests();

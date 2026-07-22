const baseUrl = 'http://localhost:5000/api';

const users = [
    { email: 'admin@erp.com', password: 'admin123', role: 'Admin' },
    { email: 'sales@erp.com', password: 'Sales@123', role: 'Sales' },
    { email: 'Warehouse@erp.com', password: 'Warehouse@123', role: 'Warehouse' },
    { email: 'accounts@erp.com', password: 'Accounts@123', role: 'Accounts' }
];

const userRoutes = [
    { method: 'POST', path: '/users', body: { name: 'Test User', email: 'test_mut@erp.com', password: 'password123', role: 'Sales' } },
    { method: 'PUT', path: '/users/1', body: { name: 'Updated User' } },
    { method: 'PATCH', path: '/users/1/password', body: { oldPassword: 'password123', newPassword: 'newpassword123' } },
    { method: 'PATCH', path: '/users/1/role', body: { role: 'Warehouse' } },
    { method: 'PATCH', path: '/users/1/deactivate', body: {} },
    { method: 'PATCH', path: '/users/1/restore', body: {} }
];

const customerRoutes = [
    { method: 'POST', path: '/customers', body: { name: 'Test Customer', email: 'cust@test.com', phone: '1234567890' } },
    { method: 'PUT', path: '/customers/1', body: { name: 'Updated Customer' } },
    { method: 'PATCH', path: '/customers/1/deactivate', body: {} },
    { method: 'PATCH', path: '/customers/1/restore', body: {} }
];

async function testRoutesForUser(user) {
    console.log(`\n========================================`);
    console.log(`Testing User: ${user.email} (${user.role})`);
    try {
        const loginRes = await fetch(`${baseUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: user.email, password: user.password })
        });
        const loginData = await loginRes.json();
        
        if (!loginRes.ok) {
            console.log(`❌ Login Failed: ${loginRes.status}`);
            return;
        }
        
        const token = loginData.token || loginData.data?.token; 
        
        console.log(`\n--- Testing /users routes ---`);
        for (const route of userRoutes) {
            const res = await fetch(`${baseUrl}${route.path}`, {
                method: route.method,
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(route.body)
            });
            const statusIndicator = res.ok || res.status === 400 || res.status === 404 ? '✅ (Allowed)' : (res.status === 403 || res.status === 401 ? '❌ (Forbidden)' : '❓ (Other Error)');
            console.log(`${statusIndicator} ${route.method} ${route.path} -> Status: ${res.status}`);
        }

        console.log(`\n--- Testing /customers routes ---`);
        for (const route of customerRoutes) {
            const res = await fetch(`${baseUrl}${route.path}`, {
                method: route.method,
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(route.body)
            });
            const statusIndicator = res.ok || res.status === 400 || res.status === 404 ? '✅ (Allowed)' : (res.status === 403 || res.status === 401 ? '❌ (Forbidden)' : '❓ (Other Error)');
            console.log(`${statusIndicator} ${route.method} ${route.path} -> Status: ${res.status}`);
        }
        
    } catch (err) {
        console.error(`Error testing user ${user.email}: ${err.message}`);
    }
}

async function run() {
    for (const user of users) {
        await testRoutesForUser(user);
    }
}

run();

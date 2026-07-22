const users = [
    { email: 'admin@erp.com', password: 'admin123' },
    { email: 'sales@erp.com', password: 'Sales@123' },
    { email: 'Warehouse@erp.com', password: 'Warehouse@123' },
    { email: 'accounts@erp.com', password: 'Accounts@123' }
];

const routesToTest = [
    '/users',
    '/customers',
    '/products',
    '/stock-movements'
];

async function testUser(user) {
    console.log(`\n========================================`);
    console.log(`Testing User: ${user.email}`);
    try {
        const loginRes = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(user)
        });
        const loginData = await loginRes.json();
        
        if (!loginRes.ok) {
            console.log(`❌ Login Failed: ${loginData.message || loginRes.statusText}`);
            return;
        }
        
        console.log(`✅ Login Successful`);
        const token = loginData.token || loginData.data?.token; 
        
        for (const route of routesToTest) {
            const res = await fetch(`http://localhost:5000/api${route}`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            let data;
            try {
                data = await res.json();
            } catch (e) {
                data = await res.text();
            }
            const statusIndicator = res.ok ? '✅' : '❌';
            console.log(`${statusIndicator} GET /api${route} -> Status: ${res.status}`);
        }
        
    } catch (err) {
        console.error(`Error testing user ${user.email}: ${err.message}`);
    }
}

async function run() {
    for (const user of users) {
        await testUser(user);
    }
}

run();

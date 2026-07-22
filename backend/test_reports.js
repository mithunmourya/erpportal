import { getDailySales, getMonthlySales, getTotalRevenue } from './src/services/reportService.js';

async function test() {
    try {
        const total = await getTotalRevenue();
        console.log('Total Revenue:', total);
        
        const daily = await getDailySales(null, 'last_30_days');
        console.log('Daily last 30 days:', daily);
        
        const today = await getDailySales();
        console.log('Today:', today);
        
        const monthly = await getMonthlySales(null, 'last_12_months');
        console.log('Monthly last 12 months:', monthly);
        
        const currentMonth = await getMonthlySales();
        console.log('Current Month:', currentMonth);
        
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}

test();

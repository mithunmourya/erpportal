import db from '../config/db.js';

/**
 * Gets daily sales report.
 * If range = 'last_30_days', returns array of daily revenues.
 * If date is provided (YYYY-MM-DD), returns stats for that day.
 */
export const getDailySales = async (date, range) => {
    if (range === 'last_30_days') {
        const query = `
            SELECT 
                DATE(sc.created_at) as date,
                SUM(ci.total_price) as revenue,
                COUNT(DISTINCT sc.id) as challan_count
            FROM sales_challans sc
            LEFT JOIN challan_items ci ON sc.id = ci.challan_id
            WHERE sc.status = 'Confirmed'
              AND sc.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
            GROUP BY DATE(sc.created_at)
            ORDER BY DATE(sc.created_at) ASC
        `;
        const [rows] = await db.query(query);
        return rows;
    } else {
        const targetDate = date || new Date().toISOString().split('T')[0];
        const query = `
            SELECT 
                SUM(ci.total_price) as total_revenue,
                COUNT(DISTINCT sc.id) as challan_count,
                AVG(ci.total_price) as avg_challan_value
            FROM sales_challans sc
            LEFT JOIN challan_items ci ON sc.id = ci.challan_id
            WHERE sc.status = 'Confirmed'
              AND DATE(sc.created_at) = ?
        `;
        const [rows] = await db.query(query, [targetDate]);
        return {
            date: targetDate,
            revenue: rows[0].total_revenue || 0,
            challan_count: rows[0].challan_count || 0,
            avg_challan_value: rows[0].avg_challan_value || 0
        };
    }
};

/**
 * Gets monthly sales report.
 * If range = 'last_12_months', returns array of monthly revenues.
 * If month is provided (YYYY-MM), returns stats for that month.
 */
export const getMonthlySales = async (month, range) => {
    if (range === 'last_12_months') {
        const query = `
            SELECT 
                DATE_FORMAT(sc.created_at, '%Y-%m') as month,
                SUM(ci.total_price) as revenue
            FROM sales_challans sc
            LEFT JOIN challan_items ci ON sc.id = ci.challan_id
            WHERE sc.status = 'Confirmed'
              AND sc.created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
            GROUP BY DATE_FORMAT(sc.created_at, '%Y-%m')
            ORDER BY DATE_FORMAT(sc.created_at, '%Y-%m') ASC
        `;
        const [rows] = await db.query(query);
        return rows;
    } else {
        // Handle single month stats (current vs previous)
        const targetMonth = month || new Date().toISOString().slice(0, 7); // YYYY-MM
        
        // Revenue for target month
        const currentQuery = `
            SELECT 
                SUM(ci.total_price) as total_revenue,
                COUNT(DISTINCT sc.id) as challan_count
            FROM sales_challans sc
            LEFT JOIN challan_items ci ON sc.id = ci.challan_id
            WHERE sc.status = 'Confirmed'
              AND DATE_FORMAT(sc.created_at, '%Y-%m') = ?
        `;
        const [currentRow] = await db.query(currentQuery, [targetMonth]);
        
        // Calculate previous month for % change
        const [year, m] = targetMonth.split('-');
        let prevMonthDate = new Date(year, parseInt(m) - 2, 1);
        const prevMonth = prevMonthDate.toISOString().slice(0, 7);
        
        const prevQuery = `
            SELECT SUM(ci.total_price) as total_revenue
            FROM sales_challans sc
            LEFT JOIN challan_items ci ON sc.id = ci.challan_id
            WHERE sc.status = 'Confirmed'
              AND DATE_FORMAT(sc.created_at, '%Y-%m') = ?
        `;
        const [prevRow] = await db.query(prevQuery, [prevMonth]);
        
        const currentRevenue = parseFloat(currentRow[0].total_revenue) || 0;
        const prevRevenue = parseFloat(prevRow[0].total_revenue) || 0;
        
        let percentChange = 0;
        if (prevRevenue > 0) {
            percentChange = ((currentRevenue - prevRevenue) / prevRevenue) * 100;
        } else if (currentRevenue > 0) {
            percentChange = 100; // If prev was 0 and current > 0
        }

        // Get Top Customers
        const topCustomersQuery = `
            SELECT 
                c.name,
                c.business_name,
                SUM(ci.total_price) as revenue
            FROM sales_challans sc
            JOIN customers c ON sc.customer_id = c.id
            LEFT JOIN challan_items ci ON sc.id = ci.challan_id
            WHERE sc.status = 'Confirmed'
              AND DATE_FORMAT(sc.created_at, '%Y-%m') = ?
            GROUP BY c.id
            ORDER BY revenue DESC
            LIMIT 5
        `;
        const [topCustomers] = await db.query(topCustomersQuery, [targetMonth]);

        return {
            month: targetMonth,
            revenue: currentRevenue,
            challan_count: currentRow[0].challan_count || 0,
            percent_change: percentChange,
            top_customers: topCustomers
        };
    }
};

/**
 * Get total all-time revenue
 */
export const getTotalRevenue = async () => {
    const query = `
        SELECT SUM(ci.total_price) as total_revenue
        FROM sales_challans sc
        LEFT JOIN challan_items ci ON sc.id = ci.challan_id
        WHERE sc.status = 'Confirmed'
    `;
    const [rows] = await db.query(query);
    return rows[0].total_revenue || 0;
};

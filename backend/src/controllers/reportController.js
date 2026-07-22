import * as reportService from '../services/reportService.js';
import { sendSuccess } from '../utils/response.js';

export const getDailySales = async (req, res, next) => {
    try {
        const { date, range } = req.query;
        const data = await reportService.getDailySales(date, range);
        
        // Let's also pass down total revenue all time for convenience if requested, 
        // but to keep it clean we can fetch it here and attach it to the response.
        const totalRevenue = await reportService.getTotalRevenue();
        
        if (Array.isArray(data)) {
            return sendSuccess(res, { records: data, total_all_time: totalRevenue }, 200, "Daily sales report fetched successfully");
        }
        return sendSuccess(res, { ...data, total_all_time: totalRevenue }, 200, "Daily sales report fetched successfully");
    } catch (error) {
        next(error);
    }
};

export const getMonthlySales = async (req, res, next) => {
    try {
        const { month, range } = req.query;
        const data = await reportService.getMonthlySales(month, range);
        return sendSuccess(res, data, 200, "Monthly sales report fetched successfully");
    } catch (error) {
        next(error);
    }
};

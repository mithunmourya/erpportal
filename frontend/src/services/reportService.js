import api from './api';

export const getDailyReport = (params) => {
    return api.get('/accounts/reports/daily', { params });
};

export const getMonthlyReport = (params) => {
    return api.get('/accounts/reports/monthly', { params });
};

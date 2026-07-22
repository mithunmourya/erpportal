import api from './api';

export const getMovements = () => api.get('/inventory/movements');

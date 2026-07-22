import api from './api';

export const getCustomers = () => api.get('/customers');
export const getCustomerById = (id) => api.get(`/customers/${id}`);
export const createCustomer = (data) => api.post('/customers', data);
export const updateCustomer = (id, data) => api.put(`/customers/${id}`, data);
export const deactivateCustomer = (id) => api.put(`/customers/${id}/deactivate`);
export const addFollowUp = (id, note, next_follow_up_date) => api.post(`/customers/${id}/follow-ups`, { note, next_follow_up_date });

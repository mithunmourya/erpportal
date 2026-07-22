import api from './api';

export const getChallans = () => api.get('/challans');
export const getChallanById = (id) => api.get(`/challans/${id}`);
export const createDraftChallan = (data) => api.post('/challans', data);
export const updateChallan = (id, data) => api.put(`/challans/${id}`, data);
export const confirmChallan = (id) => api.put(`/challans/${id}/confirm`);

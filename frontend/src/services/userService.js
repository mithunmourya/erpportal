import api from './api';

export const getUsers = () => api.get('/users');
export const createUser = (data) => api.post('/users', data);
export const updateUser = (id, data) => api.put(`/users/${id}`, data);
export const deactivateUser = (id) => api.put(`/users/${id}/deactivate`);
export const changePassword = (data) => api.put('/users/change-password', data);
export const resetPassword = (id, data) => api.put(`/users/${id}/reset-password`, data);

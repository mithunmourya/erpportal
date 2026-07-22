import api from './api';

export const getProducts = () => api.get('/products');
export const getProductById = (id) => api.get(`/products/${id}`);
export const createProduct = (data) => api.post('/products', data);
export const updateProduct = (id, data) => api.put(`/products/${id}`, data);
export const deactivateProduct = (id) => api.put(`/products/${id}/deactivate`);
export const adjustStock = (id, data) => api.post(`/products/${id}/adjust`, data);

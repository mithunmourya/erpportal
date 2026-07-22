import * as productService from '../services/productService.js';
import { sendSuccess } from '../utils/response.js';

export const create = async (req, res, next) => {
    try {
        const product = await productService.createProduct(req.body);
        return sendSuccess(res, product, 201, 'Product created successfully');
    } catch (error) {
        next(error);
    }
};

export const update = async (req, res, next) => {
    try {
        const product = await productService.updateProduct(req.params.id, req.body);
        return sendSuccess(res, product, 200, 'Product updated successfully');
    } catch (error) {
        next(error);
    }
};

export const getAll = async (req, res, next) => {
    try {
        const products = await productService.getProducts(req.query);
        return sendSuccess(res, products, 200, 'Products retrieved successfully');
    } catch (error) {
        next(error);
    }
};

export const getById = async (req, res, next) => {
    try {
        const product = await productService.getProductById(req.params.id);
        return sendSuccess(res, product, 200, 'Product detail retrieved');
    } catch (error) {
        next(error);
    }
};

export const deactivate = async (req, res, next) => {
    try {
        const result = await productService.deactivateProduct(req.params.id);
        return sendSuccess(res, result, 200, 'Product deactivated');
    } catch (error) {
        next(error);
    }
};

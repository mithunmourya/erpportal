import * as productModel from '../models/productModel.js';

export const createProduct = async (data) => {
    const existingProduct = await productModel.findBySku(data.sku);
    if (existingProduct) {
        const error = new Error('A product with this SKU already exists');
        error.statusCode = 409;
        throw error;
    }

    const insertId = await productModel.create(data);
    return await productModel.findById(insertId);
};

export const updateProduct = async (id, data) => {
    const product = await productModel.findById(id);
    if (!product) {
        const error = new Error('Product not found');
        error.statusCode = 404;
        throw error;
    }

    if (data.sku && data.sku !== product.sku) {
        const existingProduct = await productModel.findBySku(data.sku);
        if (existingProduct) {
            const error = new Error('A product with this SKU already exists');
            error.statusCode = 409;
            throw error;
        }
    }

    await productModel.update(id, data);
    return await productModel.findById(id);
};

export const getProducts = async (searchParams) => {
    return await productModel.findAllActive(searchParams);
};

export const getProductById = async (id) => {
    const product = await productModel.findById(id);
    if (!product) {
        const error = new Error('Product not found');
        error.statusCode = 404;
        throw error;
    }
    return product;
};

export const deactivateProduct = async (id) => {
    const product = await productModel.findById(id);
    if (!product) {
        const error = new Error('Product not found');
        error.statusCode = 404;
        throw error;
    }

    await productModel.deactivate(id);
    return { message: 'Product deactivated successfully' };
};

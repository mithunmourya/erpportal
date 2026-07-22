import pool from '../config/db.js';
import * as stockMovementModel from '../models/stockMovementModel.js';
import * as productModel from '../models/productModel.js';

export const addMovement = async (productId, userId, data) => {
    const { quantity_changed, movement_type, reason } = data;

    if (!['IN', 'OUT'].includes(movement_type)) {
        const error = new Error('movement_type must be IN or OUT');
        error.statusCode = 400;
        throw error;
    }

    if (!Number.isInteger(quantity_changed) || quantity_changed <= 0) {
        const error = new Error('quantity_changed must be a positive integer');
        error.statusCode = 400;
        throw error;
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
        const product = await productModel.findByIdForUpdate(productId, connection);
        if (!product) {
            const error = new Error('Product not found');
            error.statusCode = 404;
            throw error;
        }
        if (!product.is_active) {
            const error = new Error('Cannot add stock movement to a deactivated product');
            error.statusCode = 400;
            throw error;
        }

        if (movement_type === 'OUT' && product.current_stock < quantity_changed) {
            const error = new Error('Insufficient stock for OUT movement');
            error.statusCode = 400;
            throw error;
        }

        const stockChange = movement_type === 'IN' ? quantity_changed : -quantity_changed;
        await productModel.adjustStock(productId, stockChange, connection);

        const insertId = await stockMovementModel.create({
            product_id: productId,
            quantity_changed,
            movement_type,
            reason: reason || '',
            created_by: userId
        }, connection);

        await connection.commit();
        connection.release();

        const updatedProduct = await productModel.findById(productId);
        return { 
            message: 'Stock movement recorded successfully', 
            movement_id: insertId,
            new_stock: updatedProduct.current_stock
        };
    } catch (error) {
        await connection.rollback();
        connection.release();
        throw error;
    }
};

export const getHistory = async (productId) => {
    const product = await productModel.findById(productId);
    if (!product) {
        const error = new Error('Product not found');
        error.statusCode = 404;
        throw error;
    }
    return await stockMovementModel.findByProductId(productId);
};

export const getAllMovements = async (searchParams) => {
    return await stockMovementModel.findAll(searchParams);
};

export const adjustStock = async (productId, userId, data) => {
    const { adjustment_type, quantity, reason } = data;

    if (!['ADD', 'REMOVE', 'SET'].includes(adjustment_type)) {
        const error = new Error('adjustment_type must be ADD, REMOVE, or SET');
        error.statusCode = 400;
        throw error;
    }

    if (!Number.isInteger(quantity) || quantity < 0) {
        const error = new Error('quantity must be a positive integer');
        error.statusCode = 400;
        throw error;
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
        const product = await productModel.findByIdForUpdate(productId, connection);
        if (!product) {
            const error = new Error('Product not found');
            error.statusCode = 404;
            throw error;
        }

        let stockChange = 0;
        let movementType = 'ADJUSTMENT'; // Always ADJUSTMENT for manual

        if (adjustment_type === 'ADD') {
            stockChange = quantity;
        } else if (adjustment_type === 'REMOVE') {
            stockChange = -quantity;
        } else if (adjustment_type === 'SET') {
            stockChange = quantity - product.current_stock;
        }

        if (stockChange !== 0) {
            await productModel.adjustStock(productId, stockChange, connection);

            await stockMovementModel.create({
                product_id: productId,
                quantity_changed: Math.abs(stockChange),
                movement_type: movementType,
                reason: reason || 'Manual Adjustment',
                reference_type: 'MANUAL_ADJUSTMENT',
                reference_id: null,
                created_by: userId
            }, connection);
        }

        await connection.commit();
        connection.release();

        const updatedProduct = await productModel.findById(productId);
        return { 
            message: 'Stock adjusted successfully', 
            new_stock: updatedProduct.current_stock
        };
    } catch (error) {
        await connection.rollback();
        connection.release();
        throw error;
    }
};

import pool from '../config/db.js';
import * as salesChallanModel from '../models/salesChallanModel.js';
import * as challanItemModel from '../models/challanItemModel.js';
import * as customerModel from '../models/customerModel.js';
import * as productModel from '../models/productModel.js';
import * as stockMovementModel from '../models/stockMovementModel.js';

const validateItemsAndGetSnapshots = async (items, connection) => {
    if (!items || !Array.isArray(items) || items.length === 0) {
        const error = new Error('Items array is required and cannot be empty');
        error.statusCode = 400;
        throw error;
    }

    let totalQuantity = 0;
    const snapshots = [];
    const aggregatedQuantities = {};

    // First pass: validate formats and aggregate total requested per product
    for (const item of items) {
        if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
            const error = new Error('Item quantity must be a positive integer');
            error.statusCode = 400;
            throw error;
        }
        aggregatedQuantities[item.product_id] = (aggregatedQuantities[item.product_id] || 0) + item.quantity;
    }

    // Second pass: fetch products, validate stock, and generate snapshots
    for (const item of items) {
        // We use findByIdForUpdate here if we want a read-lock, but standard findById is fine for Draft
        const product = await productModel.findById(item.product_id, connection);
        if (!product || !product.is_active) {
            const error = new Error(`Product ID ${item.product_id} is invalid or inactive`);
            error.statusCode = 400;
            throw error;
        }

        // Validate aggregated requested quantity against current stock
        const totalRequested = aggregatedQuantities[item.product_id];
        if (totalRequested > product.current_stock) {
            const error = new Error(`Order rejected: Requested quantity for ${product.name} (Qty: ${totalRequested}) exceeds available stock (Qty: ${product.current_stock}).`);
            error.statusCode = 400;
            throw error;
        }

        totalQuantity += item.quantity;
        const totalPrice = product.unit_price * item.quantity;

        snapshots.push({
            product_id: product.id,
            product_name_snapshot: product.name,
            unit_price_snapshot: product.unit_price,
            quantity: item.quantity,
            total_price: totalPrice
        });
    }

    return { totalQuantity, snapshots };
};

export const createChallan = async (userId, data) => {
    const { customer_id, items } = data;

    const customer = await customerModel.findById(customer_id);
    if (!customer || !customer.is_active) {
        const error = new Error('Customer is invalid or inactive');
        error.statusCode = 400;
        throw error;
    }

    let retries = 1;
    while (retries >= 0) {
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            const { totalQuantity, snapshots } = await validateItemsAndGetSnapshots(items, connection);

            const challanNumber = await salesChallanModel.generateChallanNumber(connection);
            
            const challanId = await salesChallanModel.create({
                challan_number: challanNumber,
                customer_id,
                total_quantity: totalQuantity,
                status: 'Draft',
                created_by: userId
            }, connection);

            const itemsToInsert = snapshots.map(s => [
                challanId, s.product_id, s.product_name_snapshot, s.unit_price_snapshot, s.quantity, s.total_price
            ]);

            await challanItemModel.bulkCreate(itemsToInsert, connection);

            await connection.commit();
            connection.release();

            return await getChallanDetail(challanId);
        } catch (error) {
            await connection.rollback();
            connection.release();
            if (error.code === 'ER_DUP_ENTRY' && retries > 0) {
                retries--;
                continue; // Retry generation
            }
            throw error;
        }
    }
};

export const updateChallan = async (id, data) => {
    const { items } = data;

    const challan = await salesChallanModel.findById(id);
    if (!challan) {
        const error = new Error('Challan not found');
        error.statusCode = 404;
        throw error;
    }

    if (challan.status !== 'Draft') {
        const error = new Error('Only Draft challans can be edited');
        error.statusCode = 409;
        throw error;
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
        const { totalQuantity, snapshots } = await validateItemsAndGetSnapshots(items, connection);

        await salesChallanModel.update(id, { total_quantity: totalQuantity }, connection);
        
        await challanItemModel.deleteByChallanId(id, connection);
        
        const itemsToInsert = snapshots.map(s => [
            id, s.product_id, s.product_name_snapshot, s.unit_price_snapshot, s.quantity, s.total_price
        ]);
        await challanItemModel.bulkCreate(itemsToInsert, connection);

        await connection.commit();
        connection.release();

        return await getChallanDetail(id);
    } catch (error) {
        await connection.rollback();
        connection.release();
        throw error;
    }
};

export const confirmChallan = async (id, userId) => {
    const challan = await salesChallanModel.findById(id);
    if (!challan) {
        const error = new Error('Challan not found');
        error.statusCode = 404;
        throw error;
    }

    if (challan.status !== 'Draft') {
        const error = new Error('Only Draft challans can be confirmed');
        error.statusCode = 409;
        throw error;
    }

    const items = await challanItemModel.findByChallanId(id);
    if (items.length === 0) {
        const error = new Error('Cannot confirm an empty challan');
        error.statusCode = 400;
        throw error;
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
        for (const item of items) {
            const product = await productModel.findByIdForUpdate(item.product_id, connection);
            
            if (!product) {
                throw new Error(`Product ID ${item.product_id} no longer exists`);
            }
            if (!product.is_active) {
                throw new Error(`Product ${product.name} is no longer active`);
            }
            if (product.current_stock < item.quantity) {
                throw new Error(`Insufficient stock for ${product.name}. Required: ${item.quantity}, Available: ${product.current_stock}`);
            }

            await productModel.adjustStock(product.id, -item.quantity, connection);

            await stockMovementModel.create({
                product_id: product.id,
                quantity_changed: item.quantity,
                movement_type: 'OUT',
                reason: `Sales Challan Confirmation #${challan.challan_number}`,
                reference_type: 'SALES_CHALLAN',
                reference_id: challan.id,
                created_by: userId
            }, connection);
        }

        await connection.query('UPDATE sales_challans SET status = ? WHERE id = ?', ['Confirmed', id]);

        await connection.commit();
        connection.release();

        return await getChallanDetail(id);
    } catch (error) {
        await connection.rollback();
        connection.release();
        if (!error.statusCode) {
            error.statusCode = 400;
        }
        throw error;
    }
};

export const getChallans = async (searchParams) => {
    return await salesChallanModel.findAll(searchParams);
};

export const getChallanDetail = async (id) => {
    const challan = await salesChallanModel.findById(id);
    if (!challan) {
        const error = new Error('Challan not found');
        error.statusCode = 404;
        throw error;
    }

    const items = await challanItemModel.findByChallanId(id);
    return { ...challan, items };
};

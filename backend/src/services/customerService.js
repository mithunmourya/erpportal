import * as customerModel from '../models/customerModel.js';
import * as customerFollowUpModel from '../models/customerFollowUpModel.js';

export const createCustomer = async (data) => {
    const existingEmail = await customerModel.findByEmail(data.email);
    if (existingEmail) {
        const error = new Error('Email already belongs to another customer');
        error.statusCode = 409;
        throw error;
    }

    const existingMobile = await customerModel.findByMobile(data.mobile);
    if (existingMobile) {
        const error = new Error('Mobile number already belongs to another customer');
        error.statusCode = 409;
        throw error;
    }

    const insertId = await customerModel.create(data);
    return await customerModel.findById(insertId);
};

export const updateCustomer = async (id, data) => {
    const customer = await customerModel.findById(id);
    if (!customer) {
        const error = new Error('Customer not found');
        error.statusCode = 404;
        throw error;
    }

    if (data.email && data.email !== customer.email) {
        const existingEmail = await customerModel.findByEmail(data.email);
        if (existingEmail) {
            const error = new Error('Email already belongs to another customer');
            error.statusCode = 409;
            throw error;
        }
    }

    if (data.mobile && data.mobile !== customer.mobile) {
        const existingMobile = await customerModel.findByMobile(data.mobile);
        if (existingMobile) {
            const error = new Error('Mobile number already belongs to another customer');
            error.statusCode = 409;
            throw error;
        }
    }

    await customerModel.update(id, data);
    return await customerModel.findById(id);
};

export const getCustomers = async (searchParams) => {
    return await customerModel.findAllActive(searchParams);
};

export const getCustomerDetail = async (id) => {
    const customer = await customerModel.findById(id);
    if (!customer) {
        const error = new Error('Customer not found');
        error.statusCode = 404;
        throw error;
    }

    const followUps = await customerFollowUpModel.findByCustomerId(id);
    return { ...customer, follow_ups: followUps };
};

export const deactivateCustomer = async (id) => {
    const customer = await customerModel.findById(id);
    if (!customer) {
        const error = new Error('Customer not found');
        error.statusCode = 404;
        throw error;
    }

    await customerModel.deactivate(id);
    return { message: 'Customer deactivated successfully' };
};

export const addFollowUp = async (customerId, note, nextFollowUpDate, createdBy) => {
    const customer = await customerModel.findById(customerId);
    if (!customer) {
        const error = new Error('Customer not found');
        error.statusCode = 404;
        throw error;
    }

    const insertId = await customerFollowUpModel.create({
        customer_id: customerId,
        note,
        created_by: createdBy
    });

    if (nextFollowUpDate) {
        await customerModel.update(customerId, { ...customer, follow_up_date: nextFollowUpDate });
    }

    const followUps = await customerFollowUpModel.findByCustomerId(customerId);
    return followUps.find(f => f.id === insertId);
};

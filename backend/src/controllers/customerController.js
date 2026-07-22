import * as customerService from '../services/customerService.js';
import { sendSuccess } from '../utils/response.js';

export const create = async (req, res, next) => {
    try {
        const customer = await customerService.createCustomer(req.body);
        return sendSuccess(res, customer, 201, 'Customer created successfully');
    } catch (error) {
        next(error);
    }
};

export const update = async (req, res, next) => {
    try {
        const customer = await customerService.updateCustomer(req.params.id, req.body);
        return sendSuccess(res, customer, 200, 'Customer updated successfully');
    } catch (error) {
        next(error);
    }
};

export const getAll = async (req, res, next) => {
    try {
        const customers = await customerService.getCustomers(req.query);
        return sendSuccess(res, customers, 200, 'Customers retrieved successfully');
    } catch (error) {
        next(error);
    }
};

export const getById = async (req, res, next) => {
    try {
        const customer = await customerService.getCustomerDetail(req.params.id);
        return sendSuccess(res, customer, 200, 'Customer detail retrieved');
    } catch (error) {
        next(error);
    }
};

export const deactivate = async (req, res, next) => {
    try {
        const result = await customerService.deactivateCustomer(req.params.id);
        return sendSuccess(res, result, 200, 'Customer deactivated');
    } catch (error) {
        next(error);
    }
};

export const addFollowUp = async (req, res, next) => {
    try {
        const { note, next_follow_up_date } = req.body;
        if (!note) {
            const error = new Error('Note is required');
            error.statusCode = 400;
            throw error;
        }
        const followUp = await customerService.addFollowUp(req.params.id, note, next_follow_up_date, req.user.id);
        return sendSuccess(res, followUp, 201, 'Follow up added successfully');
    } catch (error) {
        next(error);
    }
};

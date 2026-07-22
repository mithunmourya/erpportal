import * as salesChallanService from '../services/salesChallanService.js';
import { sendSuccess } from '../utils/response.js';

export const create = async (req, res, next) => {
    try {
        let challan = await salesChallanService.createChallan(req.user.id, req.body);
        if (req.body.status === 'Confirmed') {
            challan = await salesChallanService.confirmChallan(challan.id, req.user.id);
        }
        return sendSuccess(res, challan, 201, 'Sales challan created successfully');
    } catch (error) {
        next(error);
    }
};

export const update = async (req, res, next) => {
    try {
        let challan = await salesChallanService.updateChallan(req.params.id, req.body);
        if (req.body.status === 'Confirmed') {
            challan = await salesChallanService.confirmChallan(challan.id, req.user.id);
        }
        return sendSuccess(res, challan, 200, 'Sales challan updated successfully');
    } catch (error) {
        next(error);
    }
};

export const confirm = async (req, res, next) => {
    try {
        const challan = await salesChallanService.confirmChallan(req.params.id, req.user.id);
        return sendSuccess(res, challan, 200, 'Sales challan confirmed successfully');
    } catch (error) {
        next(error);
    }
};

export const getAll = async (req, res, next) => {
    try {
        const challans = await salesChallanService.getChallans(req.query);
        return sendSuccess(res, challans, 200, 'Sales challans retrieved successfully');
    } catch (error) {
        next(error);
    }
};

export const getById = async (req, res, next) => {
    try {
        const challan = await salesChallanService.getChallanDetail(req.params.id);
        return sendSuccess(res, challan, 200, 'Sales challan detail retrieved');
    } catch (error) {
        next(error);
    }
};

import * as stockMovementService from '../services/stockMovementService.js';
import { sendSuccess } from '../utils/response.js';

export const addMovement = async (req, res, next) => {
    try {
        const result = await stockMovementService.addMovement(req.params.id, req.user.id, req.body);
        return sendSuccess(res, result, 201, 'Stock movement added successfully');
    } catch (error) {
        next(error);
    }
};

export const getHistory = async (req, res, next) => {
    try {
        const history = await stockMovementService.getHistory(req.params.id);
        return sendSuccess(res, history, 200, 'Stock movement history retrieved');
    } catch (error) {
        next(error);
    }
};

export const getAll = async (req, res, next) => {
    try {
        const movements = await stockMovementService.getAllMovements(req.query);
        return sendSuccess(res, movements, 200, 'All stock movements retrieved');
    } catch (error) {
        next(error);
    }
};

export const adjustStock = async (req, res, next) => {
    try {
        const result = await stockMovementService.adjustStock(req.params.id, req.user.id, req.body);
        return sendSuccess(res, result, 200, 'Stock adjusted successfully');
    } catch (error) {
        next(error);
    }
};

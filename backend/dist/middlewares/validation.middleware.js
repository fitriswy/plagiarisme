"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateQuery = exports.validateParams = exports.validate = void 0;
const errorHandler_1 = require("../errors/errorHandler");
const validate = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true
        });
        if (error) {
            const errorMessage = error.details
                .map(detail => detail.message)
                .join(', ');
            return next(new errorHandler_1.AppError(errorMessage, 400));
        }
        req.body = value;
        next();
    };
};
exports.validate = validate;
const validateParams = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.params);
        if (error) {
            const errorMessage = error.details
                .map(detail => detail.message)
                .join(', ');
            return next(new errorHandler_1.AppError(errorMessage, 400));
        }
        req.params = value;
        next();
    };
};
exports.validateParams = validateParams;
const validateQuery = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.query);
        if (error) {
            const errorMessage = error.details
                .map(detail => detail.message)
                .join(', ');
            return next(new errorHandler_1.AppError(errorMessage, 400));
        }
        req.query = value;
        next();
    };
};
exports.validateQuery = validateQuery;

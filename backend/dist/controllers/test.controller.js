"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestController = TestController;
const api_errors_1 = require("../errors/api_errors");
const test_service_1 = require("../services/test.service");
async function TestController(req, res) {
    try {
        const data = await (0, test_service_1.TestServices)();
        return res.status(200).json({
            success: true,
            message: "Test data",
            data
        });
    }
    catch (error) {
        return (0, api_errors_1.handlerAnyError)(error, res);
    }
}

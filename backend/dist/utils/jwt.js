"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateToken = void 0;
const jsonwebtoken_1 = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "123456";
const generateToken = async (payload) => {
    const token = (0, jsonwebtoken_1.sign)(payload, JWT_SECRET, { algorithm: "HS256", expiresIn: "30d" });
    return token;
};
exports.generateToken = generateToken;

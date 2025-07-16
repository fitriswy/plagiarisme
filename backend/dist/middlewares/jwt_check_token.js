"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jwtCheckToken = void 0;
const jsonwebtoken_1 = require("jsonwebtoken");
const jwtCheckToken = (req, res, next) => {
    const token = req.headers.authorization?.split("Bearer ")[1];
    if (!token)
        return res.status(401).json({ messagge: "Token dibutuhkan." });
    const JWT_SECRET = process.env.JWT_SECRET || "123456";
    (0, jsonwebtoken_1.verify)(token, JWT_SECRET, {
        algorithms: ["HS256"]
    }, (err, decode) => {
        if (err) {
            console.log(err);
            return res.status(401).json({ message: "Token invalid atau sudah kadaluarsa." });
        }
        req.user = decode;
        next();
    });
};
exports.jwtCheckToken = jwtCheckToken;

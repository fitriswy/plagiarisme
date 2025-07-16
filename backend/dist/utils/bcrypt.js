"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashing = hashing;
exports.verifyHash = verifyHash;
const bcryptjs_1 = require("bcryptjs");
const saltAround = 10;
async function hashing(password) {
    try {
        const hashed = (0, bcryptjs_1.hash)(password, saltAround);
        return hashed;
    }
    catch (error) {
        console.log(`gagal hashing password: ${error.message}`);
        return null;
    }
}
async function verifyHash(inputPassword, storedPassword) {
    try {
        const match = await (0, bcryptjs_1.compare)(inputPassword, storedPassword);
        return match ? true : false;
    }
    catch (error) {
        console.log(`gagal verifikasi password: ${error.message}`);
        return false;
    }
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestServices = TestServices;
async function TestServices() {
    const testDataFromDB = Array.from({ length: 10 }).map((_, i) => ({
        id: i + 1,
        titile: `Judul Film ${i + 1}`,
        description: `Deskripsi ${i + 1}`
    }));
    return testDataFromDB;
}

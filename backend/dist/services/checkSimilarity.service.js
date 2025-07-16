"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkPlagiarism = checkPlagiarism;
const client_1 = require("@prisma/client");
const rabinKarp_service_1 = require("./rabinKarp.service");
const prisma = new client_1.PrismaClient();
async function checkPlagiarism(docId) {
    const targetDoc = await prisma.document.findUnique({ where: { id: docId } });
    if (!targetDoc)
        throw new Error('Dokumen tidak ditemukan.');
    const allDocs = await prisma.document.findMany({ where: { id: { not: docId } } });
    const patterns = targetDoc.content.split(/[.?!]\s+/).filter(p => p.length > 10);
    const results = [];
    for (const otherDoc of allDocs) {
        let matchCount = 0;
        for (const sentence of patterns) {
            if ((0, rabinKarp_service_1.rabinKarp)(otherDoc.content, sentence)) {
                matchCount++;
            }
        }
        const similarity = (matchCount / patterns.length) * 100;
        // Simpan ke tabel PlagiarismResult
        await prisma.plagiarismResult.create({
            data: {
                doc1Id: docId,
                doc2Id: otherDoc.id,
                similarity,
            },
        });
        results.push({ doc2Id: otherDoc.id, similarity });
    }
    return results;
}

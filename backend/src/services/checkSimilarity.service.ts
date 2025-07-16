import { PrismaClient } from '@prisma/client';
import { rabinKarp } from './rabinKarp.service';

const prisma = new PrismaClient();

export async function checkPlagiarism(docId: number): Promise<{ doc2Id: number, similarity: number }[]> {
  const targetDoc = await prisma.document.findUnique({ where: { id: docId } });
  if (!targetDoc) throw new Error('Dokumen tidak ditemukan.');

  const allDocs = await prisma.document.findMany({ where: { id: { not: docId } } });

  const patterns = targetDoc.content.split(/[.?!]\s+/).filter(p => p.length > 10);

  const results: { doc2Id: number, similarity: number }[] = [];

  for (const otherDoc of allDocs) {
    let matchCount = 0;

    for (const sentence of patterns) {
      if (rabinKarp(otherDoc.content, sentence)) {
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

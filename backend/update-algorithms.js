const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateAlgorithms() {
  try {
    // Update semua hasil plagiarisme ke RABIN_KARP
    const result = await prisma.plagiarismResult.updateMany({
      where: {
        algorithm: {
          in: ['COSINE_SIMILARITY', 'JACCARD']
        }
      },
      data: {
        algorithm: 'RABIN_KARP'
      }
    });

    console.log(`Updated ${result.count} plagiarism results to RABIN_KARP algorithm`);
    
    // Verifikasi bahwa semua data sudah diupdate
    const remainingOldAlgorithms = await prisma.plagiarismResult.findMany({
      where: {
        algorithm: {
          in: ['COSINE_SIMILARITY', 'JACCARD']
        }
      }
    });

    if (remainingOldAlgorithms.length === 0) {
      console.log('✅ All data successfully updated to RABIN_KARP');
    } else {
      console.log(`⚠️  Still ${remainingOldAlgorithms.length} records with old algorithms`);
    }

  } catch (error) {
    console.error('Error updating algorithms:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateAlgorithms();

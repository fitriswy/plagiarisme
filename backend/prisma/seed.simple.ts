import { Algorithm, PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123!', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@plagiarisme.com' },
    update: {},
    create: {
      name: 'Administrator',
      email: 'admin@plagiarisme.com',
      password: adminPassword,
      role: 'ADMIN'
    }
  });

  // Create test dosen
  const dosenPassword = await bcrypt.hash('dosen123!', 12);
  const dosen = await prisma.user.upsert({
    where: { email: 'dosen@plagiarisme.com' },
    update: {},
    create: {
      name: 'Dr. Jane Smith',
      email: 'dosen@plagiarisme.com',
      password: dosenPassword,
      role: 'DOSEN'
    }
  });

  // Create test mahasiswa
  const mahasiswaPassword = await bcrypt.hash('mahasiswa123!', 12);
  const mahasiswa = await prisma.user.upsert({
    where: { email: 'mahasiswa@plagiarisme.com' },
    update: {},
    create: {
      name: 'John Doe',
      email: 'mahasiswa@plagiarisme.com',
      password: mahasiswaPassword,
      role: 'MAHASISWA'
    }
  });

  // Create sample documents
  const doc1 = await prisma.document.create({
    data: {
      title: 'Pengantar Ilmu Komputer',
      content: 'Ilmu komputer adalah studi tentang algoritma dan struktur data. Komputer modern menggunakan sistem biner untuk memproses informasi. Pemrograman adalah proses menulis instruksi untuk komputer. Algoritma adalah serangkaian langkah-langkah logis untuk menyelesaikan masalah. Struktur data adalah cara mengorganisir dan menyimpan data dalam komputer.',
      filename: 'sample-1.txt',
      originalName: 'pengantar-ilmu-komputer.txt',
      fileSize: 1024,
      fileType: 'text/plain',
      userId: mahasiswa.id,
      status: 'PROCESSED'
    }
  });

  const doc2 = await prisma.document.create({
    data: {
      title: 'Algoritma dan Pemrograman',
      content: 'Algoritma merupakan kumpulan instruksi yang disusun secara sistematis untuk menyelesaikan suatu permasalahan. Dalam pemrograman, algoritma sangat penting untuk membuat program yang efisien. Struktur data seperti array, linked list, dan tree digunakan untuk menyimpan dan mengakses data dengan efektif.',
      filename: 'sample-2.txt',
      originalName: 'algoritma-pemrograman.txt',
      fileSize: 1536,
      fileType: 'text/plain',
      userId: mahasiswa.id,
      status: 'PROCESSED'
    }
  });

  const doc3 = await prisma.document.create({
    data: {
      title: 'Basis Data dan Sistem Informasi',
      content: 'Basis data adalah kumpulan data yang terorganisir dan dapat diakses dengan mudah. Sistem manajemen basis data (DBMS) digunakan untuk mengelola basis data. SQL adalah bahasa yang digunakan untuk mengakses dan memanipulasi data dalam basis data relasional.',
      filename: 'sample-3.txt',
      originalName: 'basis-data.txt',
      fileSize: 2048,
      fileType: 'text/plain',
      userId: dosen.id,
      status: 'PROCESSED'
    }
  });

  // Create sample plagiarism results
  await prisma.plagiarismResult.create({
    data: {
      doc1Id: doc1.id,
      doc2Id: doc2.id,
      similarity: 75.5,
      matchedText: 'Algoritma adalah serangkaian langkah-langkah logis untuk menyelesaikan masalah\n---\nStruktur data adalah cara mengorganisir dan menyimpan data dalam komputer',
      algorithm: 'RABIN_KARP'
    }
  });

  await prisma.plagiarismResult.create({
    data: {
      doc1Id: doc1.id,
      doc2Id: doc3.id,
      similarity: 25.3,
      matchedText: 'sistem untuk mengelola data',
      Algorithm: 'COSINE_SIMILARITY'
    }
  });

  console.log('✅ Database seeding completed!');
  console.log(`👤 Admin user: admin@plagiarisme.com / admin123!`);
  console.log(`👨‍🏫 Dosen user: dosen@plagiarisme.com / dosen123!`);
  console.log(`👨‍🎓 Mahasiswa user: mahasiswa@plagiarisme.com / mahasiswa123!`);
  console.log(`📄 Created 3 sample documents`);
  console.log(`🔍 Created 2 sample plagiarism results`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

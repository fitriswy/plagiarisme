"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Starting database seeding...');
    // Create admin user
    const adminPassword = await bcrypt_1.default.hash('admin123!', 12);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@plagiarisme.com' },
        update: {},
        create: {
            name: 'Administrator',
            email: 'admin@plagiarisme.com',
            password: adminPassword,
            role: 'ADMIN',
            isActive: true,
            emailVerified: true
        }
    });
    // Create test dosen
    const dosenPassword = await bcrypt_1.default.hash('dosen123!', 12);
    const dosen = await prisma.user.upsert({
        where: { email: 'dosen@plagiarisme.com' },
        update: {},
        create: {
            name: 'Dr. Jane Smith',
            email: 'dosen@plagiarisme.com',
            password: dosenPassword,
            role: 'DOSEN',
            isActive: true,
            emailVerified: true
        }
    });
    // Create test mahasiswa
    const mahasiswaPassword = await bcrypt_1.default.hash('mahasiswa123!', 12);
    const mahasiswa = await prisma.user.upsert({
        where: { email: 'mahasiswa@plagiarisme.com' },
        update: {},
        create: {
            name: 'John Doe',
            email: 'mahasiswa@plagiarisme.com',
            password: mahasiswaPassword,
            role: 'MAHASISWA',
            isActive: true,
            emailVerified: true
        }
    });
    // Create sample documents
    const sampleDocuments = [
        {
            title: 'Pengantar Ilmu Komputer',
            content: 'Ilmu komputer adalah studi tentang algoritma dan struktur data. Komputer modern menggunakan sistem biner untuk memproses informasi. Pemrograman adalah proses menulis instruksi untuk komputer. Algoritma adalah serangkaian langkah-langkah logis untuk menyelesaikan masalah. Struktur data adalah cara mengorganisir dan menyimpan data dalam komputer.',
            filename: 'sample-1.txt',
            originalName: 'pengantar-ilmu-komputer.txt',
            fileSize: 1024,
            fileType: 'text/plain',
            userId: mahasiswa.id,
            status: 'PROCESSED'
        },
        {
            title: 'Algoritma dan Pemrograman',
            content: 'Algoritma merupakan kumpulan instruksi yang disusun secara sistematis untuk menyelesaikan suatu permasalahan. Dalam pemrograman, algoritma sangat penting untuk membuat program yang efisien. Struktur data seperti array, linked list, dan tree digunakan untuk menyimpan dan mengakses data dengan efektif.',
            filename: 'sample-2.txt',
            originalName: 'algoritma-pemrograman.txt',
            fileSize: 1536,
            fileType: 'text/plain',
            userId: mahasiswa.id,
            status: 'PROCESSED'
        },
        {
            title: 'Basis Data dan Sistem Informasi',
            content: 'Basis data adalah kumpulan data yang terorganisir dan dapat diakses dengan mudah. Sistem manajemen basis data (DBMS) digunakan untuk mengelola basis data. SQL adalah bahasa yang digunakan untuk mengakses dan memanipulasi data dalam basis data relasional.',
            filename: 'sample-3.txt',
            originalName: 'basis-data.txt',
            fileSize: 2048,
            fileType: 'text/plain',
            userId: dosen.id,
            status: 'PROCESSED'
        },
        {
            title: 'Jaringan Komputer dan Internet',
            content: 'Jaringan komputer adalah sekumpulan perangkat komputer yang saling terhubung untuk berbagi resources. Internet adalah jaringan global yang menghubungkan jutaan komputer di seluruh dunia. Protokol TCP/IP digunakan untuk komunikasi antar komputer dalam jaringan.',
            filename: 'sample-4.txt',
            originalName: 'jaringan-komputer.txt',
            fileSize: 1800,
            fileType: 'text/plain',
            userId: dosen.id,
            status: 'PROCESSED'
        }
    ];
    const createdDocuments = [];
    for (const doc of sampleDocuments) {
        const document = await prisma.document.create({
            data: doc
        });
        createdDocuments.push(document);
    }
    // Create sample plagiarism results
    const plagiarismResults = [
        {
            doc1Id: createdDocuments[0].id,
            doc2Id: createdDocuments[1].id,
            similarity: 75.5,
            matchedText: 'Algoritma adalah serangkaian langkah-langkah logis untuk menyelesaikan masalah\n---\nStruktur data adalah cara mengorganisir dan menyimpan data dalam komputer',
            algorithm: 'RABIN_KARP'
        },
        {
            doc1Id: createdDocuments[0].id,
            doc2Id: createdDocuments[2].id,
            similarity: 42.8,
            matchedText: 'sistem untuk mengelola data\n---\nstruktur data yang efisien',
            algorithm: 'RABIN_KARP'
        },
        {
            doc1Id: createdDocuments[1].id,
            doc2Id: createdDocuments[0].id,
            similarity: 75.5,
            matchedText: 'Algoritma adalah serangkaian langkah-langkah logis untuk menyelesaikan masalah\n---\nStruktur data adalah cara mengorganisir dan menyimpan data dalam komputer',
            algorithm: 'RABIN_KARP'
        },
        {
            doc1Id: createdDocuments[2].id,
            doc2Id: createdDocuments[3].id,
            similarity: 36.2,
            matchedText: 'komputer yang saling terhubung\n---\njaringan komputer modern',
            algorithm: 'RABIN_KARP'
        }
    ];
    for (const result of plagiarismResults) {
        await prisma.plagiarismResult.create({
            data: result
        });
    }
    console.log('✅ Database seeding completed!');
    console.log(`👤 Admin user: admin@plagiarisme.com / admin123!`);
    console.log(`👨‍🏫 Dosen user: dosen@plagiarisme.com / dosen123!`);
    console.log(`👨‍🎓 Mahasiswa user: mahasiswa@plagiarisme.com / mahasiswa123!`);
    console.log(`📄 Created ${createdDocuments.length} sample documents`);
    console.log(`🔍 Created ${plagiarismResults.length} sample plagiarism results`);
}
main()
    .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});

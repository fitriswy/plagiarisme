import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: `"Sistem Plagiarisme" <${process.env.SMTP_USER}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error('Gagal mengirim email');
    }
  }

  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    const subject = 'Selamat Datang di Sistem Deteksi Plagiarisme';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Selamat Datang, ${name}!</h2>
        <p>Terima kasih telah mendaftar di Sistem Deteksi Plagiarisme.</p>
        <p>Anda dapat mulai menggunakan layanan kami untuk:</p>
        <ul>
          <li>Upload dokumen dalam format PDF, DOC, DOCX, atau TXT</li>
          <li>Melakukan deteksi plagiarisme otomatis</li>
          <li>Melihat laporan hasil analisis</li>
          <li>Mengelola dokumen Anda</li>
        </ul>
        <p>Jika ada pertanyaan, jangan ragu untuk menghubungi kami.</p>
        <p>Salam,<br>Tim Sistem Deteksi Plagiarisme</p>
      </div>
    `;

    await this.sendEmail({ to: email, subject, html });
  }

  async sendPlagiarismReport(email: string, documentTitle: string, similarity: number): Promise<void> {
    const subject = 'Hasil Deteksi Plagiarisme';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Hasil Deteksi Plagiarisme</h2>
        <p>Dokumen: <strong>${documentTitle}</strong></p>
        <p>Tingkat Kesamaan: <strong style="color: ${similarity > 70 ? '#e74c3c' : similarity > 40 ? '#f39c12' : '#27ae60'};">${similarity.toFixed(2)}%</strong></p>
        
        ${similarity > 70 ? 
          '<div style="background-color: #ffebee; padding: 15px; border-left: 4px solid #e74c3c; margin: 20px 0;"><strong>⚠️ Peringatan:</strong> Tingkat kesamaan tinggi terdeteksi!</div>' :
          similarity > 40 ?
          '<div style="background-color: #fff8e1; padding: 15px; border-left: 4px solid #f39c12; margin: 20px 0;"><strong>⚡ Perhatian:</strong> Tingkat kesamaan sedang terdeteksi.</div>' :
          '<div style="background-color: #e8f5e8; padding: 15px; border-left: 4px solid #27ae60; margin: 20px 0;"><strong>✅ Baik:</strong> Tingkat kesamaan rendah.</div>'
        }
        
        <p>Login ke sistem untuk melihat detail lengkap hasil analisis.</p>
        <p>Salam,<br>Tim Sistem Deteksi Plagiarisme</p>
      </div>
    `;

    await this.sendEmail({ to: email, subject, html });
  }
}

export default new EmailService();

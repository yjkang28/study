// backend/utils/emailSender.js
const nodemailer = require('nodemailer');
require('dotenv').config();

const sendEmail = async (to, subject, text) => {
  try {
    const transporter = nodemailer.createTransport({
       host: 'smtp.naver.com',
      port: 465,           // SSL 포트
      secure: true,        // true for 465, false for 587
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    await transporter.sendMail({
      from: `"StudyWithMe" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text
    });

    console.log(`✅ 이메일 발송 완료 → ${to}`);
  } catch (error) {
    console.error('❌ 이메일 발송 실패:', error);
    throw error;
  }
};

module.exports = sendEmail;

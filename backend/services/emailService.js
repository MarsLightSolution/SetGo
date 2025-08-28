// emails/emailService.js
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send Email Helper
 * @param {string} to - Recipient email(s)
 * @param {string} subject - Email subject
 * @param {string} html - Email body (HTML)
 */
async function sendEmail(to, subject, html) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      html,
    });
    console.log(`[EmailService] Email sent to: ${to}`);
  } catch (error) {
    console.error(`[EmailService] Failed to send email: ${error.message}`);
  }
}

module.exports = { sendEmail };

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
const logger = require('../utils/logger');

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
    logger.info(`[EmailService] Email sent`, { to });
  } catch (error) {
    logger.error('[EmailService] Failed to send email', { message: error.message, stack: error.stack });
  }
}

module.exports = { sendEmail };

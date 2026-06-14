const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

class EmailService {
  constructor() {
    // We create a mock/test transporter or standard transporter depending on environment variables
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.ethereal.email',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || 'mock_user',
        pass: process.env.SMTP_PASS || 'mock_pass',
      },
      // If we are in test mode or don't have SMTP settings, we fall back to a mock logging transport
      ...( (!process.env.SMTP_HOST) ? { jsonTransport: true } : {} )
    });
  }

  async sendMail({ to, subject, text, html }) {
    try {
      const mailOptions = {
        from: process.env.SMTP_FROM || '"EMS Enterprise Support" <noreply@ems.local>',
        to,
        subject,
        text,
        html,
      };

      let info;
      if (!process.env.SMTP_HOST) {
        // Mock sending by logging and utilizing JSON transporter
        info = await this.transporter.sendMail(mailOptions);
        logger.info(`[MOCK EMAIL SENT] To: ${to} | Subject: ${subject}`);
        logger.debug(`[MOCK EMAIL CONTENT] Envelope: ${JSON.stringify(info.envelope)} | Message: ${info.message}`);
      } else {
        info = await this.transporter.sendMail(mailOptions);
        logger.info(`[EMAIL SENT] MessageId: ${info.messageId} | To: ${to}`);
      }
      return info;
    } catch (err) {
      logger.error('Failed to send email notification:', err);
      // Do not block app execution on notification sending failure
      return null;
    }
  }
}

module.exports = new EmailService();

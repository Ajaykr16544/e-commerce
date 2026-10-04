const nodemailer = require('nodemailer');

/**
 * Send email helper
 */
const sendEmail = async (options) => {
  // If SMTP is not configured, log email preview to console
  if (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'your_email_user') {
    console.log('\n[EmailService - Development Simulation]');
    console.log(`To: ${options.email}`);
    console.log(`Subject: ${options.subject}`);
    console.log(`Message:\n${options.message || options.html}`);
    console.log('--------------------------------------------\n');
    return { success: true, simulated: true };
  }

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT || 2525,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'ShopNest <noreply@shopnest.com>',
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  const info = await transporter.sendMail(mailOptions);
  return info;
};

module.exports = sendEmail;

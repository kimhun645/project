const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Email sending endpoint
app.post('/send-email', async (req, res) => {
  try {
    const { to, cc, subject, html, text, replyTo } = req.body;

    // Validate required fields
    if (!to || !subject || !html) {
      return res.status(400).json({ 
        error: 'Missing required fields: to, subject, html' 
      });
    }

    console.log('📧 Sending email via Google Workspace SMTP:', {
      to,
      cc,
      subject
    });

    // SMTP Configuration
    const smtpConfig = {
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: 'koratnrs@rockchatn.com',
        pass: process.env.SMTP_PASSWORD
      },
      tls: {
        rejectUnauthorized: false
      }
    };

    if (!smtpConfig.auth.pass) {
      throw new Error('SMTP_PASSWORD environment variable is required');
    }

    // Create transporter
    const transporter = nodemailer.createTransporter(smtpConfig);

    // Verify connection
    await transporter.verify();
    console.log('✅ SMTP connection verified');

    // Email options
    const mailOptions = {
      from: `"Stock Scribe System" <koratnrs@rockchatn.com>`,
      to: to,
      cc: cc ? (Array.isArray(cc) ? cc.join(', ') : cc) : undefined,
      subject: subject,
      html: html,
      text: text || html.replace(/<[^>]*>/g, ''),
      replyTo: replyTo || 'koratnrs@rockchatn.com'
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', info.messageId);

    return res.status(200).json({
      success: true,
      message: 'Email sent successfully',
      messageId: info.messageId
    });

  } catch (error) {
    console.error('❌ Error sending email:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Unknown error occurred'
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'Email Service' });
});

// Start server
app.listen(PORT, () => {
  console.log(`📧 Email service running on port ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;

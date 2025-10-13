import express from 'express';
import nodemailer from 'nodemailer';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: "Backend is running 🚀",
    timestamp: new Date().toISOString(),
    endpoints: {
      'health': '/api/health',
      'products': '/api/products',
      'products-get': 'GET /api/products/:id',
      'products-create': 'POST /api/products',
      'products-update': 'PUT /api/products/:id',
      'products-delete': 'DELETE /api/products/:id',
      'categories': '/api/categories',
      'categories-get': 'GET /api/categories/:id',
      'categories-create': 'POST /api/categories',
      'categories-update': 'PUT /api/categories/:id',
      'categories-delete': 'DELETE /api/categories/:id',
      'suppliers': '/api/suppliers',
      'suppliers-get': 'GET /api/suppliers/:id',
      'suppliers-create': 'POST /api/suppliers',
      'suppliers-update': 'PUT /api/suppliers/:id',
      'suppliers-delete': 'DELETE /api/suppliers/:id',
      'send-email': 'POST /api/send-email',
      'health': 'GET /api/health'
    }
  });
});

// Email sending endpoint
app.post('/api/send-email', async (req, res) => {
  try {
    const { to, cc, subject, html, text, replyTo } = req.body;

    // Validate required fields
    if (!to || !subject || !html) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required fields: to, subject, html' 
      });
    }

    console.log('📧 Sending email via Google Workspace SMTP:', {
      to,
      cc,
      subject
    });

    // SMTP Configuration with app password
    const smtpConfig = {
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: 'koratnrs@rockchatn.com',
        pass: process.env.SMTP_PASSWORD || 'mfmdcefubmsogmzx' // Use environment variable or fallback
      },
      tls: {
        rejectUnauthorized: false
      }
    };

    if (!smtpConfig.auth.pass) {
      throw new Error('SMTP_PASSWORD environment variable is required');
    }

    // Create transporter
    const transporter = nodemailer.createTransport(smtpConfig);

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
app.get('/api/health', (req, res) => {
  res.json({ 
    ok: true,
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`📧 Email service running on port ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📧 Email endpoint: http://localhost:${PORT}/api/send-email`);
});

export default app;

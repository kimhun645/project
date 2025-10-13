const { onRequest } = require('firebase-functions/v2/https');
const nodemailer = require('nodemailer');
const cors = require('cors')({ origin: true });
const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// Email sending function
exports.sendEmail = onRequest((req, res) => {
  return cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

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
});

// Categories API endpoints
exports.categories = onRequest((req, res) => {
  return cors(req, res, async () => {
    try {
      if (req.method === 'GET') {
        // Get all categories
        const categoriesSnapshot = await db.collection('categories').get();
        const categories = [];
        categoriesSnapshot.forEach(doc => {
          categories.push({
            id: doc.id,
            ...doc.data()
          });
        });
        return res.json({ categories });
      }
      
      if (req.method === 'POST') {
        // Create new category
        const { name, description, is_medicine } = req.body;
        
        // Validate required fields
        if (!name || name.trim() === '') {
          return res.status(400).json({ 
            success: false,
            error: 'Category name is required' 
          });
        }

        // Check if category with same name already exists
        const existingCategoriesSnapshot = await db.collection('categories')
          .where('name', '==', name.trim())
          .get();
        
        if (!existingCategoriesSnapshot.empty) {
          return res.status(400).json({ 
            success: false,
            error: 'Category with this name already exists' 
          });
        }

        const categoryData = {
          name: name.trim(),
          description: description?.trim() || '',
          is_medicine: is_medicine || false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const docRef = await db.collection('categories').add(categoryData);
        
        const newCategory = {
          id: docRef.id,
          ...categoryData
        };

        console.log('✅ Category created successfully:', newCategory);
        return res.status(201).json({ 
          success: true,
          category: newCategory 
        });
      }
      
      return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
      console.error('Error in categories API:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Internal server error' 
      });
    }
  });
});

// Category by ID API endpoints
exports.categoryById = onRequest((req, res) => {
  return cors(req, res, async () => {
    try {
      const { id } = req.params;
      
      if (req.method === 'PUT') {
        // Update category
        const { name, description, is_medicine } = req.body;
        
        // Validate required fields
        if (!name || name.trim() === '') {
          return res.status(400).json({ 
            success: false,
            error: 'Category name is required' 
          });
        }

        // Check if category exists
        const categoryDoc = await db.collection('categories').doc(id).get();
        if (!categoryDoc.exists) {
          return res.status(404).json({ 
            success: false,
            error: 'Category not found' 
          });
        }

        // Check if another category with same name already exists
        const existingCategoriesSnapshot = await db.collection('categories')
          .where('name', '==', name.trim())
          .get();
        
        const duplicateCategory = existingCategoriesSnapshot.docs.find(doc => doc.id !== id);
        if (duplicateCategory) {
          return res.status(400).json({ 
            success: false,
            error: 'Category with this name already exists' 
          });
        }

        const updateData = {
          name: name.trim(),
          description: description?.trim() || '',
          is_medicine: is_medicine || false,
          updated_at: new Date().toISOString()
        };

        await db.collection('categories').doc(id).update(updateData);
        
        const updatedCategory = {
          id,
          ...categoryDoc.data(),
          ...updateData
        };

        console.log('✅ Category updated successfully:', updatedCategory);
        return res.json({ 
          success: true,
          category: updatedCategory 
        });
      }
      
      if (req.method === 'DELETE') {
        // Delete category
        // Check if category exists
        const categoryDoc = await db.collection('categories').doc(id).get();
        if (!categoryDoc.exists) {
          return res.status(404).json({ 
            success: false,
            error: 'Category not found' 
          });
        }

        // Check if category has products
        const productsSnapshot = await db.collection('products')
          .where('category_id', '==', id)
          .get();
        
        if (!productsSnapshot.empty) {
          return res.status(400).json({ 
            success: false,
            error: `Cannot delete category. It has ${productsSnapshot.size} products. Please move or delete products first.` 
          });
        }

        await db.collection('categories').doc(id).delete();
        
        console.log('✅ Category deleted successfully:', id);
        return res.json({ 
          success: true,
          message: 'Category deleted successfully' 
        });
      }
      
      return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
      console.error('Error in category API:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Internal server error' 
      });
    }
  });
});

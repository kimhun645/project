import express from "express";
import admin from "firebase-admin";
import nodemailer from "nodemailer";

const app = express();
app.use(express.json());

// CORS configuration - Allow all origins temporarily for testing
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'false');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Firebase admin init
try {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: "stock-6e930"
  });
  console.log("✅ Firebase Admin SDK initialized successfully");
} catch (error) {
  console.error("❌ Firebase Admin SDK initialization failed:", error);
  process.exit(1);
}

// Initialize Firestore
const db = admin.firestore();
console.log("✅ Firestore initialized successfully");

// Middleware ตรวจสอบ Firebase token
async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const idToken = authHeader.split("Bearer ")[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized" });
  }
}

// Health check endpoint (ไม่ต้อง auth)
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Global auth middleware for all /api routes except health and test endpoints
// TEMPORARILY DISABLED FOR TESTING
// app.use('/api', (req, res, next) => {
//   if (req.path === '/health' || req.path.startsWith('/test/')) {
//     return next();
//   }
//   return authMiddleware(req, res, next);
// });

// Test endpoints without authentication (temporary)
app.get("/api/test/products", async (req, res) => {
  try {
    const productsSnapshot = await db.collection('products').get();
    const products = [];
    productsSnapshot.forEach(doc => {
      products.push({ id: doc.id, ...doc.data() });
    });
    res.json({ products });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.get("/api/test/categories", async (req, res) => {
  try {
    const categoriesSnapshot = await db.collection('categories').get();
    const categories = [];
    categoriesSnapshot.forEach(doc => {
      categories.push({ id: doc.id, ...doc.data() });
    });
    res.json({ categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Test endpoint สำหรับตรวจสอบ auth
app.get("/api/test", (req, res) => {
  res.json({ 
    message: "Authentication successful", 
    user: {
      uid: req.user.uid,
      email: req.user.email,
      name: req.user.name
    }
  });
});

// Firestore endpoints
// Get all products
app.get("/api/products", async (req, res) => {
  try {
    const productsSnapshot = await db.collection('products').get();
    const products = [];
    productsSnapshot.forEach(doc => {
      products.push({
        id: doc.id,
        ...doc.data()
      });
    });
    res.json({ products });
  } catch (error) {
    console.error('Error getting products:', error);
    res.status(500).json({ error: 'Failed to get products' });
  }
});

// Get all categories
app.get("/api/categories", async (req, res) => {
  try {
    const categoriesSnapshot = await db.collection('categories').get();
    const categories = [];
    categoriesSnapshot.forEach(doc => {
      categories.push({
        id: doc.id,
        ...doc.data()
      });
    });
    res.json({ categories });
  } catch (error) {
    console.error('Error getting categories:', error);
    res.status(500).json({ error: 'Failed to get categories' });
  }
});

// Get all suppliers
app.get("/api/suppliers", async (req, res) => {
  try {
    const suppliersSnapshot = await db.collection('suppliers').get();
    const suppliers = [];
    suppliersSnapshot.forEach(doc => {
      suppliers.push({
        id: doc.id,
        ...doc.data()
      });
    });
    res.json({ suppliers });
  } catch (error) {
    console.error('Error getting suppliers:', error);
    res.status(500).json({ error: 'Failed to get suppliers' });
  }
});

// Get all stock movements
app.get("/api/stock-movements", async (req, res) => {
  try {
    const movementsSnapshot = await db.collection('movements').get();
    const movements = [];
    movementsSnapshot.forEach(doc => {
      movements.push({
        id: doc.id,
        ...doc.data()
      });
    });
    res.json({ movements });
  } catch (error) {
    console.error('Error getting stock movements:', error);
    res.status(500).json({ error: 'Failed to get stock movements' });
  }
});

// Get all users
app.get("/api/users", async (req, res) => {
  try {
    const usersSnapshot = await db.collection('users').get();
    const users = [];
    usersSnapshot.forEach(doc => {
      users.push({
        id: doc.id,
        ...doc.data()
      });
    });
    res.json({ users });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// Get all budget requests
app.get("/api/budget-requests", async (req, res) => {
  try {
    const budgetRequestsSnapshot = await db.collection('budgetRequests').get();
    const budgetRequests = [];
    budgetRequestsSnapshot.forEach(doc => {
      budgetRequests.push({
        id: doc.id,
        ...doc.data()
      });
    });
    res.json({ budgetRequests });
  } catch (error) {
    console.error('Error getting budget requests:', error);
    res.status(500).json({ error: 'Failed to get budget requests' });
  }
});

// Get all approvals
app.get("/api/approvals", async (req, res) => {
  try {
    const approvalsSnapshot = await db.collection('approvals').get();
    const approvals = [];
    approvalsSnapshot.forEach(doc => {
      approvals.push({
        id: doc.id,
        ...doc.data()
      });
    });
    res.json({ approvals });
  } catch (error) {
    console.error('Error getting approvals:', error);
    res.status(500).json({ error: 'Failed to get approvals' });
  }
});

// Get all approvers
app.get("/api/approvers", async (req, res) => {
  try {
    const approversSnapshot = await db.collection('approvers').get();
    const approvers = [];
    approversSnapshot.forEach(doc => {
      approvers.push({
        id: doc.id,
        ...doc.data()
      });
    });
    res.json({ approvers });
  } catch (error) {
    console.error('Error getting approvers:', error);
    res.status(500).json({ error: 'Failed to get approvers' });
  }
});

// Get all requesters
app.get("/api/requesters", async (req, res) => {
  try {
    const requestersSnapshot = await db.collection('requesters').get();
    const requesters = [];
    requestersSnapshot.forEach(doc => {
      requesters.push({
        id: doc.id,
        ...doc.data()
      });
    });
    res.json({ requesters });
  } catch (error) {
    console.error('Error getting requesters:', error);
    res.status(500).json({ error: 'Failed to get requesters' });
  }
});

// Get all account codes
app.get("/api/account-codes", async (req, res) => {
  try {
    const accountCodesSnapshot = await db.collection('accountCodes').get();
    const accountCodes = [];
    accountCodesSnapshot.forEach(doc => {
      accountCodes.push({
        id: doc.id,
        ...doc.data()
      });
    });
    res.json({ accountCodes });
  } catch (error) {
    console.error('Error getting account codes:', error);
    res.status(500).json({ error: 'Failed to get account codes' });
  }
});

// Get all access codes
app.get("/api/access-codes", async (req, res) => {
  try {
    const accessCodesSnapshot = await db.collection('accessCodes').get();
    const accessCodes = [];
    accessCodesSnapshot.forEach(doc => {
      accessCodes.push({
        id: doc.id,
        ...doc.data()
      });
    });
    res.json({ accessCodes });
  } catch (error) {
    console.error('Error getting access codes:', error);
    res.status(500).json({ error: 'Failed to get access codes' });
  }
});

// Get all approval logs
app.get("/api/approval-logs", async (req, res) => {
  try {
    const approvalLogsSnapshot = await db.collection('approvalLogs').get();
    const approvalLogs = [];
    approvalLogsSnapshot.forEach(doc => {
      approvalLogs.push({
        id: doc.id,
        ...doc.data()
      });
    });
    res.json({ approvalLogs });
  } catch (error) {
    console.error('Error getting approval logs:', error);
    res.status(500).json({ error: 'Failed to get approval logs' });
  }
});

// Get app settings
app.get("/api/app-settings", async (req, res) => {
  try {
    const appSettingsSnapshot = await db.collection('appSettings').get();
    const appSettings = [];
    appSettingsSnapshot.forEach(doc => {
      appSettings.push({
        id: doc.id,
        ...doc.data()
      });
    });
    res.json({ appSettings });
  } catch (error) {
    console.error('Error getting app settings:', error);
    res.status(500).json({ error: 'Failed to get app settings' });
  }
});

// Get settings (alias for app-settings)
app.get("/api/settings", async (req, res) => {
  try {
    const appSettingsSnapshot = await db.collection('appSettings').get();
    const settings = [];
    appSettingsSnapshot.forEach(doc => {
      settings.push({
        id: doc.id,
        ...doc.data()
      });
    });
    res.json(settings);
  } catch (error) {
    console.error('Error getting settings:', error);
    res.status(500).json({ error: 'Failed to get settings' });
  }
});

// Update settings
app.put("/api/settings/:key", async (req, res) => {
  try {
    const { key } = req.params;
    const updateData = req.body;
    
    const settingsRef = db.collection('appSettings').doc(key);
    await settingsRef.set(updateData, { merge: true });
    
    res.json({ message: 'Settings updated successfully', key, data: updateData });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Update settings (bulk)
app.put("/api/settings", async (req, res) => {
  try {
    const settingsData = req.body;
    
    // Update multiple settings
    const batch = db.batch();
    Object.entries(settingsData).forEach(([key, value]) => {
      const settingsRef = db.collection('appSettings').doc(key);
      batch.set(settingsRef, value, { merge: true });
    });
    
    await batch.commit();
    
    res.json({ message: 'Settings updated successfully', data: settingsData });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Get all movements (public endpoint for testing)
app.get("/api/movements", async (req, res) => {
  try {
    const movementsSnapshot = await db.collection('movements').get();
    const movements = [];
    movementsSnapshot.forEach(doc => {
      movements.push({
        id: doc.id,
        ...doc.data()
      });
    });
    res.json({ movements });
  } catch (error) {
    console.error('Error getting movements:', error);
    res.status(500).json({ error: 'Failed to get movements' });
  }
});

// Additional routes for frontend compatibility
app.get("/api/stats", async (req, res) => {
  try {
    // Get basic stats
    const [productsSnapshot, categoriesSnapshot, suppliersSnapshot, movementsSnapshot] = await Promise.all([
      db.collection('products').get(),
      db.collection('categories').get(),
      db.collection('suppliers').get(),
      db.collection('movements').get()
    ]);

    const stats = {
      totalProducts: productsSnapshot.size,
      totalCategories: categoriesSnapshot.size,
      totalSuppliers: suppliersSnapshot.size,
      totalMovements: movementsSnapshot.size,
      lowStockItems: 0, // Calculate based on products
      outOfStockItems: 0, // Calculate based on products
      recentMovements: movementsSnapshot.size
    };

    res.json(stats);
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// Search products
app.get("/api/search", async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.json([]);
    }

    const productsSnapshot = await db.collection('products').get();
    const products = [];
    
    productsSnapshot.forEach(doc => {
      const product = { id: doc.id, ...doc.data() };
      const searchTerm = q.toLowerCase();
      
      if (product.name?.toLowerCase().includes(searchTerm) ||
          product.sku?.toLowerCase().includes(searchTerm) ||
          product.barcode?.toLowerCase().includes(searchTerm)) {
        products.push(product);
      }
    });

    res.json(products);
  } catch (error) {
    console.error('Error searching products:', error);
    res.status(500).json({ error: 'Failed to search products' });
  }
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
        pass: 'viumcgrcmboowrsu' // App password
      },
      tls: {
        rejectUnauthorized: false
      }
    };

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

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

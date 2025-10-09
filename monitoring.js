import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Request logging middleware
export const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logEntry = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress
    };
    
    console.log(`[${logEntry.timestamp}] ${logEntry.method} ${logEntry.url} ${logEntry.status} - ${logEntry.duration}`);
  });
  
  next();
};

// Error handling middleware
export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  
  // Log error to file in production
  if (process.env.NODE_ENV === 'production') {
    const logDir = path.join(__dirname, 'logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir);
    }
    
    const errorLog = `[${new Date().toISOString()}] ${err.stack || err}\n`;
    fs.appendFileSync(path.join(logDir, 'error.log'), errorLog);
  }
  
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
};

// System monitoring class
export class SystemMonitoring {
  constructor(pool) {
    this.pool = pool;
  }

  async checkDatabaseHealth() {
    try {
      const start = Date.now();
      await this.pool.query('SELECT 1');
      const responseTime = Date.now() - start;
      
      return {
        status: 'healthy',
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async getDatabaseMetrics() {
    try {
      const queries = [
        'SELECT COUNT(*) as total_products FROM products',
        'SELECT COUNT(*) as total_categories FROM categories',
        'SELECT COUNT(*) as total_suppliers FROM suppliers',
        'SELECT COUNT(*) as total_movements FROM movements',
        'SELECT COUNT(*) as total_users FROM users'
      ];

      const results = await Promise.all(
        queries.map(query => this.pool.query(query))
      );

      return {
        products: parseInt(results[0].rows[0].total_products),
        categories: parseInt(results[1].rows[0].total_categories),
        suppliers: parseInt(results[2].rows[0].total_suppliers),
        movements: parseInt(results[3].rows[0].total_movements),
        users: parseInt(results[4].rows[0].total_users),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  getSystemResources() {
    const usage = process.memoryUsage();
    return {
      memory: {
        rss: `${Math.round(usage.rss / 1024 / 1024)} MB`,
        heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)} MB`,
        heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)} MB`,
        external: `${Math.round(usage.external / 1024 / 1024)} MB`
      },
      uptime: `${Math.round(process.uptime())} seconds`,
      cpu: process.cpuUsage(),
      timestamp: new Date().toISOString()
    };
  }
}

// Create system monitoring instance
export const systemMonitoring = new SystemMonitoring(null);


import express from 'express';
import cors from 'cors';
import { config, validateConfig } from './config.js';
import { logger } from './logger.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import transfersRouter from './routes/transfers.js';

/**
 * Vend - Monetized Transaction History API
 *
 * Blockchain data vending machine using x402 + Alchemy
 * Insert payment (USDC) → Get blockchain data instantly
 *
 * - x402 protocol for HTTP micropayments (402 Payment Required)
 * - Alchemy SDK for multi-chain transaction data
 * - Pay-per-use model (no accounts, no API keys)
 */

// Validate configuration on startup
try {
  validateConfig();
  logger.info('Configuration validated successfully');
} catch (error) {
  logger.error(error, 'Configuration validation failed');
  process.exit(1);
}

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
    }, 'Request completed');
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API info endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Vend 🎰',
    version: '1.0.0',
    description: 'Monetized Transaction History API using x402 and Alchemy',
    tagline: 'Blockchain data vending machine - Insert payment → Get data',
    protocol: 'x402',
    dataProvider: 'Alchemy',
    endpoints: {
      health: 'GET /health',
      transfers: 'GET /api/transfers',
      info: 'GET /api/transfers/info',
    },
    documentation: 'https://github.com/yourusername/vend',
  });
});

// API routes
app.use('/api/transfers', transfersRouter);

// Error handlers (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const server = app.listen(config.port, () => {
  logger.info({
    port: config.port,
    env: config.nodeEnv,
    network: config.alchemy.network,
  }, 'Vend server started');

  if (config.nodeEnv === 'development') {
    console.log('\n🎰 Vend - Monetized Transaction History API');
    console.log('   x402 + Alchemy | Insert payment → Get data');
    console.log(`   http://localhost:${config.port}\n`);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

export default app;

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Application configuration loaded from environment variables
 */
export const config = {
  // Server settings
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // Alchemy configuration
  alchemy: {
    apiKey: process.env.ALCHEMY_API_KEY,
    network: process.env.ALCHEMY_NETWORK || 'eth-mainnet',
  },

  // x402 Payment configuration
  payment: {
    address: process.env.PAYMENT_ADDRESS,
    network: process.env.PAYMENT_NETWORK || 'base-sepolia',
    pricePerQuery: process.env.PAYMENT_PRICE_PER_QUERY || '0.01',
  },

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
};

/**
 * Validates required environment variables
 * @throws {Error} If required variables are missing
 */
export function validateConfig() {
  const required = ['ALCHEMY_API_KEY', 'PAYMENT_ADDRESS'];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please copy .env.example to .env and fill in the values.'
    );
  }
}

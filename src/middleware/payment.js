/**
 * Vend Payment Middleware
 *
 * Uses x402-express for payment handling
 * Configured for USDC payments on Base network
 */

import { Alchemy, Network } from 'alchemy-sdk';
import { paymentRequired, createUSDCVerifier, createDemoVerifier } from '../../packages/x402-express/src/index.js';
import { config } from '../config.js';
import { logger } from '../logger.js';

/**
 * Initialize Alchemy instance for payment network
 */
let paymentAlchemy = null;

function getPaymentAlchemy() {
  if (!paymentAlchemy) {
    const networkMap = {
      'base-mainnet': Network.BASE_MAINNET,
      'base-sepolia': Network.BASE_SEPOLIA,
    };

    paymentAlchemy = new Alchemy({
      apiKey: config.alchemy.apiKey,
      network: networkMap[config.payment.network] || Network.BASE_SEPOLIA,
    });

    logger.info({ network: config.payment.network }, 'Payment Alchemy SDK initialized');
  }
  return paymentAlchemy;
}

/**
 * Logger adapter for x402-express
 */
function x402Logger(message, level, data) {
  logger[level](data, message);
}

/**
 * Create payment verifier based on environment
 */
function createVerifier() {
  if (config.nodeEnv === 'development') {
    // In development, use demo verifier that also accepts real USDC payments
    const usdcVerifier = createUSDCVerifier({
      alchemy: getPaymentAlchemy(),
      network: config.payment.network,
      logger: x402Logger,
    });

    const demoVerifier = createDemoVerifier({
      acceptedHashes: ['demo'],
      logger: x402Logger,
    });

    // Composite verifier: try demo first, then USDC
    return async (paymentHash, expectedAmount, context) => {
      // Try demo bypass first
      if (await demoVerifier(paymentHash, expectedAmount, context)) {
        return true;
      }
      // Fall back to real USDC verification
      return await usdcVerifier(paymentHash, expectedAmount, context);
    };
  }

  // Production: only USDC verification
  return createUSDCVerifier({
    alchemy: getPaymentAlchemy(),
    network: config.payment.network,
    logger: x402Logger,
  });
}

/**
 * Payment middleware factory for Vend
 * Wraps x402-express with Vend configuration
 *
 * @param {Object} options - Middleware options
 * @param {string} [options.price] - Override default price
 * @param {boolean} [options.required] - Whether payment is required
 * @returns {Function} Express middleware
 */
export function vendPaymentRequired(options = {}) {
  const {
    price = config.payment.pricePerQuery,
    required = true,
  } = options;

  const verifier = createVerifier();

  const chainIdMap = {
    'base-mainnet': 8453,
    'base-sepolia': 84532,
  };

  return paymentRequired({
    price,
    currency: 'USDC',
    recipient: config.payment.address,
    network: config.payment.network,
    chainId: chainIdMap[config.payment.network],
    verifier,
    required,
    logger: x402Logger,
    onVerified: (req, paymentInfo) => {
      logger.info({
        paymentHash: paymentInfo.hash,
        amount: paymentInfo.amount,
        endpoint: req.path,
      }, 'Payment verified for Vend request');
    },
    onRejected: (req, reason) => {
      logger.warn({
        reason,
        endpoint: req.path,
        paymentHash: req.headers['x-payment-hash'],
      }, 'Payment rejected for Vend request');
    },
  });
}

/**
 * Re-export for backward compatibility
 */
export { vendPaymentRequired as paymentRequired };

export default vendPaymentRequired;

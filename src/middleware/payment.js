import { config } from '../config.js';
import { logger } from '../logger.js';

/**
 * x402 Payment Middleware
 * Implements HTTP 402 Payment Required for API endpoints
 *
 * Based on x402 protocol: https://x402.org
 * Requires payment via stablecoin before serving protected content
 */

/**
 * Creates payment instructions for x402 protocol
 * @param {string} endpoint - The protected endpoint path
 * @param {string} price - Price in USD (e.g., "0.01")
 * @returns {Object} x402 payment instructions
 */
function createPaymentInstructions(endpoint, price) {
  return {
    protocol: 'x402',
    version: '1.0',
    payment: {
      recipient: config.payment.address,
      amount: price,
      currency: 'USDC',
      network: config.payment.network,
      chainId: config.payment.network === 'base-sepolia' ? 84532 : 8453, // Base Sepolia or Base Mainnet
    },
    resource: {
      endpoint,
      method: 'GET',
      description: 'Transaction history query',
    },
    facilitator: {
      url: process.env.X402_FACILITATOR_URL || 'https://x402.coinbase.com',
      verification: 'auto',
    },
    instructions: {
      message: 'Send payment to access blockchain transaction data',
      steps: [
        '1. Send USDC payment to the recipient address on the specified network',
        '2. Include transaction hash in X-Payment-Hash header',
        '3. Retry request with payment proof',
      ],
    },
  };
}

/**
 * Verifies payment was made
 * @param {string} paymentHash - Transaction hash of payment
 * @param {string} expectedAmount - Expected payment amount
 * @returns {Promise<boolean>} Whether payment is valid
 */
async function verifyPayment(paymentHash, expectedAmount) {
  // TODO: Implement actual payment verification via facilitator
  // This would typically involve:
  // 1. Querying the blockchain for the transaction
  // 2. Verifying recipient, amount, and currency
  // 3. Checking transaction is confirmed
  //
  // For MVP/demo purposes, this is a placeholder
  // In production, integrate with x402 facilitator or blockchain query

  logger.info({
    paymentHash,
    expectedAmount,
  }, 'Payment verification requested (placeholder)');

  // Placeholder: Accept any non-empty hash for demo
  if (process.env.NODE_ENV === 'development' && paymentHash === 'demo') {
    logger.warn('Using demo payment bypass (development only)');
    return true;
  }

  // TODO: Real verification logic here
  // Example: Query Base network for transaction
  // const tx = await queryTransaction(paymentHash);
  // return tx.to === config.payment.address && tx.value >= expectedAmount;

  return false;
}

/**
 * Payment middleware factory
 * @param {Object} options - Middleware options
 * @param {string} options.price - Price per request (e.g., "0.01")
 * @param {boolean} options.required - Whether payment is required (default: true)
 * @returns {Function} Express middleware
 */
export function paymentRequired(options = {}) {
  const {
    price = config.payment.pricePerQuery,
    required = true,
  } = options;

  return async (req, res, next) => {
    // Skip payment check if not required (for testing)
    if (!required) {
      logger.info('Payment check skipped (not required)');
      return next();
    }

    // Check for payment proof in headers
    const paymentHash = req.headers['x-payment-hash'];
    const paymentAmount = req.headers['x-payment-amount'];

    // If no payment provided, return 402 with instructions
    if (!paymentHash) {
      const instructions = createPaymentInstructions(req.path, price);

      logger.info({
        endpoint: req.path,
        price,
      }, 'Payment required - sending 402 response');

      return res.status(402).json({
        error: 'Payment Required',
        status: 402,
        ...instructions,
      });
    }

    // Verify payment
    try {
      const isValid = await verifyPayment(paymentHash, price);

      if (!isValid) {
        logger.warn({
          paymentHash,
          expectedAmount: price,
        }, 'Payment verification failed');

        return res.status(402).json({
          error: 'Invalid Payment',
          status: 402,
          message: 'Payment could not be verified',
          received: {
            hash: paymentHash,
            amount: paymentAmount,
          },
          expected: {
            amount: price,
            currency: 'USDC',
            network: config.payment.network,
            recipient: config.payment.address,
          },
        });
      }

      // Payment verified - attach to request and continue
      req.payment = {
        hash: paymentHash,
        amount: paymentAmount || price,
        verified: true,
        timestamp: new Date().toISOString(),
      };

      logger.info({
        paymentHash,
        amount: price,
      }, 'Payment verified successfully');

      next();
    } catch (error) {
      logger.error({ err: error }, 'Payment verification error');

      return res.status(500).json({
        error: 'Payment Verification Error',
        status: 500,
        message: 'Failed to verify payment',
      });
    }
  };
}

/**
 * Demo/bypass middleware for development
 * Sets demo payment header automatically
 */
export function demoPaymentBypass(req, res, next) {
  if (config.nodeEnv === 'development' && !req.headers['x-payment-hash']) {
    logger.warn('Using demo payment bypass');
    req.headers['x-payment-hash'] = 'demo';
  }
  next();
}

export default paymentRequired;

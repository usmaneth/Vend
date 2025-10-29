/**
 * x402-express - HTTP 402 Payment Required middleware for Express.js
 *
 * Implements the x402 protocol for HTTP-based micropayments
 * https://x402.org
 */

/**
 * Creates payment instructions for x402 protocol
 * @param {Object} options - Payment instruction options
 * @param {string} options.endpoint - The protected endpoint path
 * @param {string} options.price - Price in specified currency (e.g., "0.01")
 * @param {string} options.currency - Currency code (e.g., "USDC", "USD", "BTC")
 * @param {string} options.recipient - Payment recipient address/identifier
 * @param {string} [options.network] - Blockchain network (e.g., "base-sepolia", "bitcoin-mainnet")
 * @param {number} [options.chainId] - EVM chain ID if applicable
 * @param {string} [options.method] - HTTP method (default: "GET")
 * @param {string} [options.description] - Resource description
 * @param {string} [options.facilitatorUrl] - Optional payment facilitator URL
 * @param {Object} [options.customInstructions] - Custom instruction steps
 * @returns {Object} x402 payment instructions
 */
export function createPaymentInstructions(options) {
  const {
    endpoint,
    price,
    currency,
    recipient,
    network,
    chainId,
    method = 'GET',
    description = 'Protected resource',
    facilitatorUrl,
    customInstructions,
  } = options;

  const instructions = {
    protocol: 'x402',
    version: '1.0',
    payment: {
      recipient,
      amount: price,
      currency,
    },
    resource: {
      endpoint,
      method,
      description,
    },
  };

  // Add optional blockchain-specific fields
  if (network) {
    instructions.payment.network = network;
  }
  if (chainId) {
    instructions.payment.chainId = chainId;
  }

  // Add facilitator if provided
  if (facilitatorUrl) {
    instructions.facilitator = {
      url: facilitatorUrl,
      verification: 'auto',
    };
  }

  // Add human-readable instructions
  instructions.instructions = customInstructions || {
    message: `Pay ${price} ${currency} to access this resource`,
    steps: [
      `1. Send ${price} ${currency} payment to ${recipient}`,
      '2. Include payment proof in X-Payment-Hash header',
      '3. Retry request with payment proof',
    ],
  };

  return instructions;
}

/**
 * Payment verification middleware factory
 *
 * @param {Object} options - Middleware configuration
 * @param {string} options.price - Price per request (e.g., "0.01")
 * @param {string} options.currency - Currency code (e.g., "USDC", "USD")
 * @param {string} options.recipient - Payment recipient address/identifier
 * @param {Function} options.verifier - Payment verification function (async)
 *   - Function signature: async (paymentHash, expectedAmount, context) => boolean
 *   - paymentHash: Payment proof from X-Payment-Hash header
 *   - expectedAmount: Expected payment amount as string
 *   - context: Additional context (req, config, etc.)
 * @param {boolean} [options.required=true] - Whether payment is required
 * @param {string} [options.network] - Blockchain network
 * @param {number} [options.chainId] - EVM chain ID
 * @param {string} [options.facilitatorUrl] - Payment facilitator URL
 * @param {Function} [options.onVerified] - Callback when payment is verified (req, paymentInfo) => void
 * @param {Function} [options.onRejected] - Callback when payment is rejected (req, reason) => void
 * @param {Object} [options.customInstructions] - Custom payment instructions
 * @param {string} [options.headerName='x-payment-hash'] - Header name for payment proof
 * @param {Function} [options.logger] - Logger function (message, level, data) => void
 *
 * @returns {Function} Express middleware
 *
 * @example
 * import { paymentRequired } from 'x402-express';
 *
 * // Simple usage with custom verifier
 * app.get('/api/data',
 *   paymentRequired({
 *     price: '0.01',
 *     currency: 'USDC',
 *     recipient: '0x742d35Cc...',
 *     verifier: async (hash, amount) => {
 *       // Your verification logic
 *       return await verifyPayment(hash, amount);
 *     }
 *   }),
 *   (req, res) => {
 *     res.json({ data: 'protected content' });
 *   }
 * );
 */
export function paymentRequired(options) {
  const {
    price,
    currency,
    recipient,
    verifier,
    required = true,
    network,
    chainId,
    facilitatorUrl,
    onVerified,
    onRejected,
    customInstructions,
    headerName = 'x-payment-hash',
    logger,
  } = options;

  // Validate required options
  if (!verifier || typeof verifier !== 'function') {
    throw new Error('x402-express: verifier function is required');
  }
  if (!price || !currency || !recipient) {
    throw new Error('x402-express: price, currency, and recipient are required');
  }

  const log = (message, level = 'info', data = {}) => {
    if (logger) {
      logger(message, level, data);
    }
  };

  return async (req, res, next) => {
    // Skip payment check if not required (for testing)
    if (!required) {
      log('Payment check skipped (not required)', 'info');
      return next();
    }

    // Check for payment proof in headers
    const paymentHash = req.headers[headerName];
    const paymentAmount = req.headers['x-payment-amount'];

    // If no payment provided, return 402 with instructions
    if (!paymentHash) {
      const instructions = createPaymentInstructions({
        endpoint: req.path,
        price,
        currency,
        recipient,
        network,
        chainId,
        method: req.method,
        facilitatorUrl,
        customInstructions,
      });

      log('Payment required - sending 402 response', 'info', {
        endpoint: req.path,
        price,
        currency,
      });

      return res.status(402).json({
        error: 'Payment Required',
        status: 402,
        ...instructions,
      });
    }

    // Verify payment
    try {
      log('Payment verification requested', 'info', {
        paymentHash,
        expectedAmount: price,
      });

      // Call user-provided verifier with context
      const context = {
        req,
        price,
        currency,
        recipient,
        network,
        chainId,
      };

      const isValid = await verifier(paymentHash, price, context);

      if (!isValid) {
        log('Payment verification failed', 'warn', {
          paymentHash,
          expectedAmount: price,
        });

        if (onRejected) {
          onRejected(req, 'verification_failed');
        }

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
            currency,
            recipient,
            network,
          },
        });
      }

      // Payment verified - attach to request and continue
      const paymentInfo = {
        hash: paymentHash,
        amount: paymentAmount || price,
        currency,
        verified: true,
        timestamp: new Date().toISOString(),
      };

      req.payment = paymentInfo;

      log('Payment verified successfully', 'info', {
        paymentHash,
        amount: price,
      });

      if (onVerified) {
        onVerified(req, paymentInfo);
      }

      next();
    } catch (error) {
      log('Payment verification error', 'error', {
        error: error.message,
        paymentHash,
      });

      if (onRejected) {
        onRejected(req, 'verification_error');
      }

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
 * Automatically sets demo payment header
 *
 * @param {Object} [options] - Options
 * @param {string} [options.demoHash='demo'] - Demo payment hash value
 * @param {Function} [options.logger] - Logger function
 * @returns {Function} Express middleware
 *
 * @example
 * import { demoPaymentBypass } from 'x402-express';
 *
 * if (process.env.NODE_ENV === 'development') {
 *   app.use(demoPaymentBypass());
 * }
 */
export function demoPaymentBypass(options = {}) {
  const { demoHash = 'demo', logger } = options;

  const log = (message, level = 'info', data = {}) => {
    if (logger) {
      logger(message, level, data);
    }
  };

  return (req, res, next) => {
    if (!req.headers['x-payment-hash']) {
      log('Using demo payment bypass', 'warn');
      req.headers['x-payment-hash'] = demoHash;
    }
    next();
  };
}

export default { paymentRequired, demoPaymentBypass, createPaymentInstructions };

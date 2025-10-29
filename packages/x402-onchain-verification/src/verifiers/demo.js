/**
 * Demo payment verifier for development/testing
 *
 * Accepts specific payment hashes without actual verification
 * NEVER use in production!
 */

/**
 * Creates a demo verifier that accepts predefined payment hashes
 *
 * @param {Object} options - Verifier options
 * @param {string[]} [options.acceptedHashes=['demo']] - Payment hashes to accept
 * @param {boolean} [options.enabledInProduction=false] - Allow in production (dangerous!)
 * @param {Function} [options.logger] - Logger function
 * @returns {Function} Verifier function
 *
 * @example
 * import { createDemoVerifier } from 'x402-express';
 *
 * const verifier = createDemoVerifier({
 *   acceptedHashes: ['demo', 'test123'],
 * });
 *
 * app.get('/api/data',
 *   paymentRequired({
 *     price: '0.01',
 *     currency: 'USDC',
 *     recipient: '0x...',
 *     verifier
 *   }),
 *   handler
 * );
 */
export function createDemoVerifier(options = {}) {
  const {
    acceptedHashes = ['demo'],
    enabledInProduction = false,
    logger,
  } = options;

  const log = (message, level = 'info', data = {}) => {
    if (logger) {
      logger(message, level, data);
    }
  };

  return async (paymentHash, expectedAmount, context) => {
    const isProduction = process.env.NODE_ENV === 'production';

    // Safety check - don't allow demo verifier in production unless explicitly enabled
    if (isProduction && !enabledInProduction) {
      log('Demo verifier disabled in production', 'error', { paymentHash });
      return false;
    }

    const isAccepted = acceptedHashes.includes(paymentHash);

    if (isAccepted) {
      log('Demo payment accepted', 'warn', {
        paymentHash,
        expectedAmount,
        environment: process.env.NODE_ENV,
      });
    } else {
      log('Demo payment rejected', 'warn', {
        paymentHash,
        acceptedHashes,
      });
    }

    return isAccepted;
  };
}

export default createDemoVerifier;

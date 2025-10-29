/**
 * x402-express
 *
 * HTTP 402 Payment Required middleware for Express.js
 * Implement micropayments in your API using the x402 protocol
 *
 * @example
 * import { paymentRequired } from 'x402-express';
 *
 * app.get('/api/data',
 *   paymentRequired({
 *     price: '0.01',
 *     currency: 'USDC',
 *     recipient: '0x...',
 *     verifier: myVerifierFunction
 *   }),
 *   handler
 * );
 */

export {
  paymentRequired,
  demoPaymentBypass,
  createPaymentInstructions,
} from './middleware.js';

export { createUSDCVerifier } from './verifiers/usdc.js';
export { createDemoVerifier } from './verifiers/demo.js';

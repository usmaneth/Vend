/**
 * USDC payment verifier for EVM chains
 *
 * Verifies USDC payments on Ethereum, Base, Polygon, etc.
 * Requires Alchemy SDK for blockchain queries
 */

/**
 * USDC contract addresses by network
 */
const USDC_CONTRACTS = {
  // Ethereum
  'eth-mainnet': '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  'eth-sepolia': '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',

  // Base
  'base-mainnet': '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  'base-sepolia': '0x036CbD53842c5426634e7929541eC2318f3dCF7e',

  // Polygon
  'polygon-mainnet': '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
  'polygon-amoy': '0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582',

  // Arbitrum
  'arbitrum-mainnet': '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
  'arbitrum-sepolia': '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',

  // Optimism
  'optimism-mainnet': '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
  'optimism-sepolia': '0x5fd84259d66Cd46123540766Be93DFE6D43130D7',
};

/**
 * ERC20 Transfer event signature
 * Transfer(address indexed from, address indexed to, uint256 value)
 */
const TRANSFER_EVENT_SIGNATURE = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

/**
 * Creates a USDC payment verifier
 *
 * @param {Object} options - Verifier options
 * @param {Object} options.alchemy - Alchemy SDK instance (must be initialized for payment network)
 * @param {string} options.network - Network name (e.g., 'base-sepolia', 'eth-mainnet')
 * @param {string} [options.usdcContract] - Custom USDC contract address (overrides default)
 * @param {number} [options.tolerance=0.000001] - Amount tolerance for verification (in USDC)
 * @param {Function} [options.logger] - Logger function
 * @returns {Function} Verifier function
 *
 * @example
 * import { Alchemy, Network } from 'alchemy-sdk';
 * import { createUSDCVerifier } from 'x402-express';
 *
 * const alchemy = new Alchemy({
 *   apiKey: process.env.ALCHEMY_API_KEY,
 *   network: Network.BASE_SEPOLIA,
 * });
 *
 * const verifier = createUSDCVerifier({
 *   alchemy,
 *   network: 'base-sepolia',
 * });
 *
 * app.get('/api/data',
 *   paymentRequired({
 *     price: '0.01',
 *     currency: 'USDC',
 *     recipient: '0x742d35Cc...',
 *     verifier
 *   }),
 *   handler
 * );
 */
export function createUSDCVerifier(options) {
  const {
    alchemy,
    network,
    usdcContract,
    tolerance = 0.000001,
    logger,
  } = options;

  if (!alchemy) {
    throw new Error('x402-express: Alchemy SDK instance is required for USDC verifier');
  }

  if (!network) {
    throw new Error('x402-express: network is required for USDC verifier');
  }

  const contractAddress = usdcContract || USDC_CONTRACTS[network];

  if (!contractAddress) {
    throw new Error(
      `x402-express: USDC contract not found for network "${network}". ` +
      'Supported networks: ' + Object.keys(USDC_CONTRACTS).join(', ')
    );
  }

  const log = (message, level = 'info', data = {}) => {
    if (logger) {
      logger(message, level, data);
    }
  };

  /**
   * Verifier function
   * @param {string} paymentHash - Transaction hash
   * @param {string} expectedAmount - Expected amount in USDC (e.g., "0.01")
   * @param {Object} context - Verification context from middleware
   * @returns {Promise<boolean>}
   */
  return async (paymentHash, expectedAmount, context) => {
    try {
      const { recipient } = context;

      log('Verifying USDC payment', 'info', {
        paymentHash,
        expectedAmount,
        network,
        recipient,
      });

      // Fetch transaction receipt
      const receipt = await alchemy.core.getTransactionReceipt(paymentHash);

      if (!receipt) {
        log('Transaction not found', 'warn', { paymentHash });
        return false;
      }

      // Check transaction succeeded
      if (receipt.status !== 1) {
        log('Transaction failed', 'warn', {
          paymentHash,
          status: receipt.status,
        });
        return false;
      }

      // Parse logs for USDC Transfer event
      const transferLog = receipt.logs.find(log => {
        // Check if log is from USDC contract and matches Transfer signature
        return log.address.toLowerCase() === contractAddress.toLowerCase() &&
               log.topics[0] === TRANSFER_EVENT_SIGNATURE;
      });

      if (!transferLog) {
        log('No USDC transfer found in transaction', 'warn', {
          paymentHash,
          contractAddress,
        });
        return false;
      }

      // Decode Transfer event
      // topics[0] = event signature
      // topics[1] = from address (indexed)
      // topics[2] = to address (indexed)
      // data = amount (uint256)
      const toAddress = '0x' + transferLog.topics[2].slice(26); // Remove padding
      const amountHex = transferLog.data;
      const amountInSmallestUnit = BigInt(amountHex);

      // USDC has 6 decimals
      const amountInUSDC = Number(amountInSmallestUnit) / 1e6;

      // Convert expected amount to number
      const expectedAmountNum = parseFloat(expectedAmount);

      log('Payment details parsed', 'debug', {
        paymentHash,
        toAddress,
        amountInUSDC,
        expectedAmount: expectedAmountNum,
        recipient,
      });

      // Verify recipient matches
      if (toAddress.toLowerCase() !== recipient.toLowerCase()) {
        log('Payment sent to wrong address', 'warn', {
          paymentHash,
          expected: recipient,
          actual: toAddress,
        });
        return false;
      }

      // Verify amount is sufficient (with tolerance for rounding)
      if (amountInUSDC < expectedAmountNum - tolerance) {
        log('Payment amount insufficient', 'warn', {
          paymentHash,
          expected: expectedAmountNum,
          actual: amountInUSDC,
        });
        return false;
      }

      log('USDC payment verified successfully', 'info', {
        paymentHash,
        amount: amountInUSDC,
        recipient: toAddress,
      });

      return true;
    } catch (error) {
      log('Error verifying USDC payment', 'error', {
        error: error.message,
        paymentHash,
      });
      return false;
    }
  };
}

export default createUSDCVerifier;

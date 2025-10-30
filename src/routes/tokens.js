import express from 'express';
import { getTokenBalances, getTokenMetadata, getTokenPrices } from '../services/alchemy.js';
import { paymentRequired } from '../middleware/payment.js';
import { logger } from '../logger.js';

const router = express.Router();

/**
 * GET /api/tokens/balances
 *
 * Fetch token balances for a wallet address
 * Requires x402 payment to access
 *
 * Query Parameters:
 * - address: Wallet address (required)
 * - contractAddresses: Token contract addresses to check (comma-separated, optional)
 *
 * Headers:
 * - X-Payment-Hash: Transaction hash of payment (required)
 *
 * Example:
 * GET /api/tokens/balances?address=0x...
 * Headers: X-Payment-Hash: 0xabc123...
 */
router.get('/balances', paymentRequired({ price: '0.01' }), async (req, res, next) => {
  try {
    const { address, contractAddresses } = req.query;

    // Validate required parameters
    if (!address) {
      return res.status(400).json({
        error: 'Bad Request',
        status: 400,
        message: 'address parameter is required',
        example: '/api/tokens/balances?address=0x...',
      });
    }

    const contracts = contractAddresses ? contractAddresses.split(',') : [];

    logger.info({ address, tokenCount: contracts.length }, 'Token balances request received');

    // Fetch token balances
    const result = await getTokenBalances(address, contracts);

    // Return response with payment metadata
    res.json({
      payment: req.payment,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/tokens/metadata
 *
 * Fetch metadata for a specific token
 * Requires x402 payment to access
 *
 * Query Parameters:
 * - contractAddress: Token contract address (required)
 *
 * Headers:
 * - X-Payment-Hash: Transaction hash of payment (required)
 *
 * Example:
 * GET /api/tokens/metadata?contractAddress=0x...
 * Headers: X-Payment-Hash: 0xabc123...
 */
router.get('/metadata', paymentRequired({ price: '0.005' }), async (req, res, next) => {
  try {
    const { contractAddress } = req.query;

    // Validate required parameters
    if (!contractAddress) {
      return res.status(400).json({
        error: 'Bad Request',
        status: 400,
        message: 'contractAddress parameter is required',
        example: '/api/tokens/metadata?contractAddress=0x...',
      });
    }

    logger.info({ contractAddress }, 'Token metadata request received');

    // Fetch token metadata
    const metadata = await getTokenMetadata(contractAddress);

    // Return response with payment metadata
    res.json({
      payment: req.payment,
      data: metadata,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/tokens/prices
 *
 * Fetch prices for tokens (Note: Requires external price API integration)
 * Requires x402 payment to access
 *
 * Query Parameters:
 * - addresses: Token contract addresses (comma-separated, required)
 *
 * Headers:
 * - X-Payment-Hash: Transaction hash of payment (required)
 *
 * Example:
 * GET /api/tokens/prices?addresses=0x...,0x...
 * Headers: X-Payment-Hash: 0xabc123...
 */
router.get('/prices', paymentRequired({ price: '0.01' }), async (req, res, next) => {
  try {
    const { addresses } = req.query;

    // Validate required parameters
    if (!addresses) {
      return res.status(400).json({
        error: 'Bad Request',
        status: 400,
        message: 'addresses parameter is required',
        example: '/api/tokens/prices?addresses=0x...,0x...',
      });
    }

    const addressList = addresses.split(',');

    logger.info({ tokenCount: addressList.length }, 'Token prices request received');

    // Fetch token prices
    const result = await getTokenPrices({ addresses: addressList });

    // Return response with payment metadata
    res.json({
      payment: req.payment,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

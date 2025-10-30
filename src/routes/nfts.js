import express from 'express';
import { getNFTsForOwner, getNFTMetadata, getNFTFloorPrice } from '../services/alchemy.js';
import { paymentRequired } from '../middleware/payment.js';
import { logger } from '../logger.js';

const router = express.Router();

/**
 * GET /api/nfts
 *
 * Fetch NFTs owned by a wallet address
 * Requires x402 payment to access
 *
 * Query Parameters:
 * - owner: Wallet address (required)
 * - contractAddresses: NFT contract addresses to filter (comma-separated, optional)
 * - pageKey: Pagination key from previous response
 * - omitMetadata: Skip metadata fetching for faster response (true/false, default: false)
 *
 * Headers:
 * - X-Payment-Hash: Transaction hash of payment (required)
 *
 * Example:
 * GET /api/nfts?owner=0x...&omitMetadata=false
 * Headers: X-Payment-Hash: 0xabc123...
 */
router.get('/', paymentRequired({ price: '0.01' }), async (req, res, next) => {
  try {
    const {
      owner,
      contractAddresses,
      pageKey,
      omitMetadata,
    } = req.query;

    // Validate required parameters
    if (!owner) {
      return res.status(400).json({
        error: 'Bad Request',
        status: 400,
        message: 'owner parameter is required',
        example: '/api/nfts?owner=0x...',
      });
    }

    // Build query parameters
    const queryParams = {
      owner,
      omitMetadata: omitMetadata === 'true',
    };

    if (contractAddresses) {
      queryParams.contractAddresses = contractAddresses.split(',');
    }
    if (pageKey) {
      queryParams.pageKey = pageKey;
    }

    logger.info({ params: queryParams }, 'NFT request received');

    // Fetch NFTs
    const result = await getNFTsForOwner(queryParams);

    // Return response with payment metadata
    res.json({
      payment: req.payment, // Added by payment middleware
      data: result,
      pagination: result.pageKey ? {
        pageKey: result.pageKey,
        hasMore: true,
      } : null,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/nfts/metadata
 *
 * Fetch metadata for a specific NFT
 * Requires x402 payment to access
 *
 * Query Parameters:
 * - contractAddress: NFT contract address (required)
 * - tokenId: Token ID (required)
 *
 * Headers:
 * - X-Payment-Hash: Transaction hash of payment (required)
 *
 * Example:
 * GET /api/nfts/metadata?contractAddress=0x...&tokenId=1234
 * Headers: X-Payment-Hash: 0xabc123...
 */
router.get('/metadata', paymentRequired({ price: '0.005' }), async (req, res, next) => {
  try {
    const { contractAddress, tokenId } = req.query;

    // Validate required parameters
    if (!contractAddress || !tokenId) {
      return res.status(400).json({
        error: 'Bad Request',
        status: 400,
        message: 'contractAddress and tokenId parameters are required',
        example: '/api/nfts/metadata?contractAddress=0x...&tokenId=1234',
      });
    }

    logger.info({ contractAddress, tokenId }, 'NFT metadata request received');

    // Fetch NFT metadata
    const metadata = await getNFTMetadata({ contractAddress, tokenId });

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
 * GET /api/nfts/floor-price
 *
 * Fetch floor price for an NFT collection
 * Requires x402 payment to access
 *
 * Query Parameters:
 * - contractAddress: NFT contract address (required)
 *
 * Headers:
 * - X-Payment-Hash: Transaction hash of payment (required)
 *
 * Example:
 * GET /api/nfts/floor-price?contractAddress=0x...
 * Headers: X-Payment-Hash: 0xabc123...
 */
router.get('/floor-price', paymentRequired({ price: '0.005' }), async (req, res, next) => {
  try {
    const { contractAddress } = req.query;

    // Validate required parameters
    if (!contractAddress) {
      return res.status(400).json({
        error: 'Bad Request',
        status: 400,
        message: 'contractAddress parameter is required',
        example: '/api/nfts/floor-price?contractAddress=0x...',
      });
    }

    logger.info({ contractAddress }, 'NFT floor price request received');

    // Fetch floor price
    const floorPrice = await getNFTFloorPrice(contractAddress);

    // Return response with payment metadata
    res.json({
      payment: req.payment,
      data: floorPrice,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

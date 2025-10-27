import { Alchemy, Network } from 'alchemy-sdk';
import { config } from '../config.js';
import { logger } from '../logger.js';

/**
 * Maps config network names to Alchemy SDK network constants
 */
const NETWORK_MAP = {
  'eth-mainnet': Network.ETH_MAINNET,
  'eth-sepolia': Network.ETH_SEPOLIA,
  'polygon-mainnet': Network.MATIC_MAINNET,
  'polygon-mumbai': Network.MATIC_MUMBAI,
  'arbitrum-mainnet': Network.ARB_MAINNET,
  'arbitrum-sepolia': Network.ARB_SEPOLIA,
  'optimism-mainnet': Network.OPT_MAINNET,
  'optimism-sepolia': Network.OPT_SEPOLIA,
  'base-mainnet': Network.BASE_MAINNET,
  'base-sepolia': Network.BASE_SEPOLIA,
};

/**
 * Initialize Alchemy SDK instance
 */
const alchemyConfig = {
  apiKey: config.alchemy.apiKey,
  network: NETWORK_MAP[config.alchemy.network] || Network.ETH_MAINNET,
};

const alchemy = new Alchemy(alchemyConfig);

logger.info({ network: config.alchemy.network }, 'Alchemy SDK initialized');

/**
 * Fetches asset transfers for a given address
 * @param {Object} params - Query parameters
 * @param {string} params.fromAddress - Source address filter
 * @param {string} params.toAddress - Destination address filter
 * @param {string[]} params.contractAddresses - Token contract addresses
 * @param {string[]} params.category - Transfer categories (external, internal, erc20, erc721, erc1155)
 * @param {string} params.fromBlock - Start block (hex or "latest")
 * @param {string} params.toBlock - End block (hex or "latest")
 * @param {number} params.maxCount - Max results per page
 * @param {string} params.pageKey - Pagination key
 * @param {string} params.order - Sort order ("asc" or "desc")
 * @param {boolean} params.withMetadata - Include block metadata
 * @returns {Promise<Object>} Transfer data
 */
export async function getAssetTransfers(params) {
  try {
    const {
      fromAddress,
      toAddress,
      contractAddresses,
      category = ['external', 'internal', 'erc20', 'erc721', 'erc1155'],
      fromBlock = '0x0',
      toBlock = 'latest',
      maxCount = 100,
      pageKey,
      order = 'desc',
      withMetadata = true,
    } = params;

    // Validate required params
    if (!fromAddress && !toAddress) {
      throw new Error('Either fromAddress or toAddress must be provided');
    }

    // Build query parameters
    const queryParams = {
      category,
      withMetadata,
      maxCount: Math.min(maxCount, 1000), // Cap at 1000 per Alchemy limits
      order,
    };

    if (fromAddress) queryParams.fromAddress = fromAddress;
    if (toAddress) queryParams.toAddress = toAddress;
    if (contractAddresses) queryParams.contractAddresses = contractAddresses;
    if (fromBlock !== '0x0') queryParams.fromBlock = fromBlock;
    if (toBlock !== 'latest') queryParams.toBlock = toBlock;
    if (pageKey) queryParams.pageKey = pageKey;

    logger.info({ params: queryParams }, 'Fetching asset transfers');

    // Make the API call
    const response = await alchemy.core.getAssetTransfers(queryParams);

    logger.info({
      transferCount: response.transfers.length,
      hasMore: !!response.pageKey,
    }, 'Asset transfers retrieved');

    return {
      transfers: response.transfers,
      pageKey: response.pageKey,
      totalCount: response.transfers.length,
    };
  } catch (error) {
    logger.error({ err: error }, 'Error fetching asset transfers');
    throw error;
  }
}

/**
 * Fetches token balances for an address
 * @param {string} address - Wallet address
 * @param {string[]} contractAddresses - Optional token contract addresses
 * @returns {Promise<Object>} Token balances
 */
export async function getTokenBalances(address, contractAddresses = []) {
  try {
    logger.info({ address, tokenCount: contractAddresses.length }, 'Fetching token balances');

    const balances = contractAddresses.length > 0
      ? await alchemy.core.getTokenBalances(address, contractAddresses)
      : await alchemy.core.getTokenBalances(address);

    return {
      address,
      balances: balances.tokenBalances,
    };
  } catch (error) {
    logger.error({ err: error }, 'Error fetching token balances');
    throw error;
  }
}

/**
 * Fetches token metadata
 * @param {string} contractAddress - Token contract address
 * @returns {Promise<Object>} Token metadata
 */
export async function getTokenMetadata(contractAddress) {
  try {
    logger.info({ contractAddress }, 'Fetching token metadata');

    const metadata = await alchemy.core.getTokenMetadata(contractAddress);

    return metadata;
  } catch (error) {
    logger.error({ err: error }, 'Error fetching token metadata');
    throw error;
  }
}

export default alchemy;

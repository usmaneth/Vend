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

/**
 * Fetches NFTs owned by an address
 * @param {Object} params - Query parameters
 * @param {string} params.owner - Wallet address
 * @param {string[]} params.contractAddresses - Optional NFT contract addresses to filter
 * @param {string} params.pageKey - Pagination key
 * @param {boolean} params.omitMetadata - Skip fetching metadata (faster)
 * @returns {Promise<Object>} NFT data
 */
export async function getNFTsForOwner(params) {
  try {
    const {
      owner,
      contractAddresses = [],
      pageKey,
      omitMetadata = false,
    } = params;

    if (!owner) {
      throw new Error('Owner address is required');
    }

    const options = {
      omitMetadata,
    };

    if (contractAddresses.length > 0) {
      options.contractAddresses = contractAddresses;
    }
    if (pageKey) {
      options.pageKey = pageKey;
    }

    logger.info({ owner, options }, 'Fetching NFTs for owner');

    const response = await alchemy.nft.getNftsForOwner(owner, options);

    logger.info({
      nftCount: response.ownedNfts.length,
      totalCount: response.totalCount,
      hasMore: !!response.pageKey,
    }, 'NFTs retrieved');

    return {
      nfts: response.ownedNfts,
      pageKey: response.pageKey,
      totalCount: response.totalCount,
    };
  } catch (error) {
    logger.error({ err: error }, 'Error fetching NFTs');
    throw error;
  }
}

/**
 * Fetches NFT metadata
 * @param {Object} params - Query parameters
 * @param {string} params.contractAddress - NFT contract address
 * @param {string} params.tokenId - Token ID
 * @returns {Promise<Object>} NFT metadata
 */
export async function getNFTMetadata(params) {
  try {
    const { contractAddress, tokenId } = params;

    if (!contractAddress || !tokenId) {
      throw new Error('Contract address and token ID are required');
    }

    logger.info({ contractAddress, tokenId }, 'Fetching NFT metadata');

    const metadata = await alchemy.nft.getNftMetadata(contractAddress, tokenId);

    return metadata;
  } catch (error) {
    logger.error({ err: error }, 'Error fetching NFT metadata');
    throw error;
  }
}

/**
 * Fetches floor price for an NFT collection
 * @param {string} contractAddress - NFT contract address
 * @returns {Promise<Object>} Floor price data
 */
export async function getNFTFloorPrice(contractAddress) {
  try {
    logger.info({ contractAddress }, 'Fetching NFT floor price');

    const floorPrice = await alchemy.nft.getFloorPrice(contractAddress);

    return floorPrice;
  } catch (error) {
    logger.error({ err: error }, 'Error fetching NFT floor price');
    throw error;
  }
}

/**
 * Fetches token prices
 * @param {Object} params - Query parameters
 * @param {string[]} params.addresses - Token contract addresses
 * @returns {Promise<Object>} Token price data
 */
export async function getTokenPrices(params) {
  try {
    const { addresses } = params;

    if (!addresses || addresses.length === 0) {
      throw new Error('At least one token address is required');
    }

    logger.info({ tokenCount: addresses.length }, 'Fetching token prices');

    // Note: Alchemy doesn't have a direct price API, but we can get token metadata
    // In production, you'd integrate with CoinGecko, CoinMarketCap, or DeFi price oracles
    const prices = await Promise.all(
      addresses.map(async (address) => {
        const metadata = await alchemy.core.getTokenMetadata(address);
        return {
          address,
          symbol: metadata.symbol,
          name: metadata.name,
          decimals: metadata.decimals,
          // Note: Price would come from external API
          price: null,
          message: 'Price data requires external API integration (CoinGecko, etc.)',
        };
      })
    );

    return {
      tokens: prices,
    };
  } catch (error) {
    logger.error({ err: error }, 'Error fetching token prices');
    throw error;
  }
}

export default alchemy;

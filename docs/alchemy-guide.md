# Alchemy API Integration Guide

This guide covers how Vend uses Alchemy's APIs and how to extend the functionality with additional endpoints.

## Overview

Vend integrates with Alchemy's **Transfers API** (also called Asset Transfers API) to fetch historical blockchain data. This provides:

- Fast queries (500x faster than `eth_getLogs`)
- Automatic pagination
- Multi-chain support
- Rich metadata

[Alchemy Documentation](https://docs.alchemy.com/)

## Supported Networks

Vend supports all Alchemy-compatible networks:

| Network | Config Value | Chain ID |
|---------|-------------|----------|
| Ethereum Mainnet | `eth-mainnet` | 1 |
| Ethereum Sepolia | `eth-sepolia` | 11155111 |
| Polygon Mainnet | `polygon-mainnet` | 137 |
| Polygon Mumbai | `polygon-mumbai` | 80001 |
| Arbitrum Mainnet | `arbitrum-mainnet` | 42161 |
| Arbitrum Sepolia | `arbitrum-sepolia` | 421614 |
| Optimism Mainnet | `optimism-mainnet` | 10 |
| Optimism Sepolia | `optimism-sepolia` | 11155420 |
| Base Mainnet | `base-mainnet` | 8453 |
| Base Sepolia | `base-sepolia` | 84532 |

Set network in `.env`:
```bash
ALCHEMY_NETWORK=eth-mainnet
```

## Transfer Categories

Alchemy supports six transfer types:

1. **external** - ETH transfers between addresses
2. **internal** - ETH transfers from smart contracts
3. **erc20** - ERC-20 token transfers
4. **erc721** - NFT transfers (ERC-721)
5. **erc1155** - Multi-token transfers (ERC-1155)
6. **specialnft** - CryptoPunks and other special NFTs

## Query Examples

### Get All Transfer Types

```bash
curl -H "X-Payment-Hash: demo" \
  "http://localhost:3000/api/transfers?address=0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
```

Default: Returns all categories.

### Get Only Token Transfers

```bash
curl -H "X-Payment-Hash: demo" \
  "http://localhost:3000/api/transfers?address=0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045&category=erc20,erc721"
```

Categories: `erc20,erc721` (comma-separated)

### Filter by Sender

```bash
curl -H "X-Payment-Hash: demo" \
  "http://localhost:3000/api/transfers?fromAddress=0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
```

### Filter by Recipient

```bash
curl -H "X-Payment-Hash: demo" \
  "http://localhost:3000/api/transfers?toAddress=0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
```

### Filter by Token Contract

```bash
# USDC transfers only
curl -H "X-Payment-Hash: demo" \
  "http://localhost:3000/api/transfers?address=0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045&contractAddresses=0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
```

### Block Range

```bash
curl -H "X-Payment-Hash: demo" \
  "http://localhost:3000/api/transfers?address=0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045&fromBlock=0x1000000&toBlock=latest"
```

Blocks can be:
- Hex: `0x1000000`
- Number: `16777216`
- Special: `latest`, `earliest`

### Pagination

```bash
# First page
curl -H "X-Payment-Hash: demo" \
  "http://localhost:3000/api/transfers?address=0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045&maxCount=100"

# Next page (use pageKey from response)
curl -H "X-Payment-Hash: demo" \
  "http://localhost:3000/api/transfers?address=0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045&pageKey=abc123xyz"
```

Max: 1000 results per page
Page keys expire after 10 minutes

### Sort Order

```bash
# Newest first (default)
curl -H "X-Payment-Hash: demo" \
  "http://localhost:3000/api/transfers?address=0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045&order=desc"

# Oldest first
curl -H "X-Payment-Hash: demo" \
  "http://localhost:3000/api/transfers?address=0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045&order=asc"
```

## Response Format

```json
{
  "success": true,
  "data": {
    "transfers": [
      {
        "blockNum": "0x10e1b3a",
        "uniqueId": "0xabc...:0",
        "hash": "0xdef456...",
        "from": "0x123...",
        "to": "0x456...",
        "value": 1.5,
        "erc721TokenId": null,
        "erc1155Metadata": null,
        "tokenId": null,
        "asset": "ETH",
        "category": "external",
        "rawContract": {
          "value": "0x14d1120d7b160000",
          "address": null,
          "decimal": "0x12"
        },
        "metadata": {
          "blockTimestamp": "2023-10-15T12:34:56.000Z"
        }
      }
    ],
    "pageKey": "next_page_token_if_more_results",
    "totalCount": 100
  },
  "payment": {
    "hash": "demo",
    "amount": "0.01",
    "timestamp": "2025-01-15T12:00:00Z"
  },
  "pagination": {
    "hasMore": true,
    "pageKey": "next_page_token",
    "count": 100
  }
}
```

### Field Descriptions

- `blockNum`: Block number (hex)
- `hash`: Transaction hash
- `from`: Sender address
- `to`: Recipient address
- `value`: Amount transferred (decimal)
- `asset`: Asset symbol (ETH, USDC, etc.)
- `category`: Transfer type
- `rawContract.value`: Raw value (hex)
- `metadata.blockTimestamp`: ISO 8601 timestamp

## Extending with Token Balances

Add a token balances endpoint:

```javascript
// src/routes/balances.js
import express from 'express';
import { getTokenBalances, getTokenMetadata } from '../services/alchemy.js';
import { paymentRequired } from '../middleware/payment.js';

const router = express.Router();

router.get('/', paymentRequired({ price: '0.005' }), async (req, res, next) => {
  try {
    const { address, tokens } = req.query;

    if (!address) {
      return res.status(400).json({
        error: 'address parameter required',
      });
    }

    const contractAddresses = tokens ? tokens.split(',') : [];
    const balances = await getTokenBalances(address, contractAddresses);

    // Enrich with metadata
    const enriched = await Promise.all(
      balances.balances.map(async (balance) => {
        const metadata = await getTokenMetadata(balance.contractAddress);
        return {
          ...balance,
          symbol: metadata.symbol,
          name: metadata.name,
          decimals: metadata.decimals,
          logo: metadata.logo,
        };
      })
    );

    res.json({
      success: true,
      data: {
        address,
        balances: enriched,
      },
      payment: req.payment,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
```

Register in `src/index.js`:

```javascript
import balancesRouter from './routes/balances.js';

app.use('/api/balances', balancesRouter);
```

Usage:

```bash
curl -H "X-Payment-Hash: demo" \
  "http://localhost:3000/api/balances?address=0x..."
```

## Advanced Queries

### Get Transaction Timestamps

Transfers API returns block numbers. To get timestamps:

1. **Use `withMetadata: true`** (default in Vend)
   ```javascript
   const transfers = await alchemy.core.getAssetTransfers({
     fromAddress: address,
     withMetadata: true,
   });
   // transfers[0].metadata.blockTimestamp
   ```

2. **Query block separately**
   ```javascript
   const block = await alchemy.core.getBlock(transfer.blockNum);
   const timestamp = new Date(block.timestamp * 1000);
   ```

### Calculate Portfolio Value

```javascript
async function getPortfolioValue(address) {
  // Get token balances
  const { balances } = await getTokenBalances(address);

  // Get current prices (pseudo-code)
  const values = await Promise.all(
    balances.map(async (balance) => {
      const price = await getTokenPrice(balance.contractAddress);
      const amount = parseInt(balance.tokenBalance, 16) / Math.pow(10, balance.decimals);
      return amount * price;
    })
  );

  return values.reduce((sum, val) => sum + val, 0);
}
```

### Track NFT Provenance

```javascript
async function getNFTHistory(contractAddress, tokenId) {
  const transfers = await alchemy.core.getAssetTransfers({
    contractAddresses: [contractAddress],
    category: ['erc721'],
    order: 'asc', // Oldest first
  });

  return transfers.transfers
    .filter(t => t.erc721TokenId === tokenId)
    .map(t => ({
      from: t.from,
      to: t.to,
      timestamp: t.metadata.blockTimestamp,
      txHash: t.hash,
    }));
}
```

## Rate Limits

Alchemy free tier limits:

| Plan | Requests/Month | Requests/Second |
|------|----------------|-----------------|
| Free | 300M compute units | 330 cu/s |
| Growth | Custom | Custom |

Vend's impact:
- `getAssetTransfers`: ~150 CU per call
- `getTokenBalances`: ~20 CU per call
- `getTokenMetadata`: ~10 CU per call

With 300M CU/month:
- ~2M transfer queries
- ~15M token balance queries

Monitor usage at [dashboard.alchemy.com](https://dashboard.alchemy.com)

## Error Handling

Common errors:

### Invalid Address
```json
{
  "error": "invalid address"
}
```
→ Validate with `ethers.utils.isAddress()`

### Rate Limit Exceeded
```json
{
  "error": "exceeded rate limit"
}
```
→ Implement retry with backoff

### Network Not Supported
```json
{
  "error": "unsupported network"
}
```
→ Check `ALCHEMY_NETWORK` value

## Best Practices

1. **Cache Results**
   ```javascript
   const cache = new Map();

   async function getCachedTransfers(address) {
     if (cache.has(address)) {
       return cache.get(address);
     }

     const transfers = await getAssetTransfers({ fromAddress: address });
     cache.set(address, transfers);
     setTimeout(() => cache.delete(address), 300000); // 5 min TTL

     return transfers;
   }
   ```

2. **Batch Metadata Requests**
   ```javascript
   const metadataCache = new Map();

   async function getMetadataBatch(addresses) {
     const uncached = addresses.filter(a => !metadataCache.has(a));

     await Promise.all(
       uncached.map(async (address) => {
         const metadata = await getTokenMetadata(address);
         metadataCache.set(address, metadata);
       })
     );

     return addresses.map(a => metadataCache.get(a));
   }
   ```

3. **Handle Pagination**
   ```javascript
   async function getAllTransfers(address) {
     const allTransfers = [];
     let pageKey = undefined;

     do {
       const result = await getAssetTransfers({
         fromAddress: address,
         pageKey,
       });

       allTransfers.push(...result.transfers);
       pageKey = result.pageKey;
     } while (pageKey);

     return allTransfers;
   }
   ```

## Testing

### Mock Alchemy Responses

```javascript
// tests/alchemy.test.js
jest.mock('alchemy-sdk');

import { Alchemy } from 'alchemy-sdk';
import { getAssetTransfers } from '../src/services/alchemy.js';

Alchemy.mockImplementation(() => ({
  core: {
    getAssetTransfers: jest.fn().mockResolvedValue({
      transfers: [
        {
          blockNum: '0x123',
          hash: '0xabc',
          from: '0x111',
          to: '0x222',
          value: 1.0,
          asset: 'ETH',
        },
      ],
    }),
  },
}));

test('fetches transfers', async () => {
  const result = await getAssetTransfers({ fromAddress: '0x111' });
  expect(result.transfers).toHaveLength(1);
});
```

## Resources

- [Alchemy Transfers API Docs](https://docs.alchemy.com/reference/transfers-api-quickstart)
- [Alchemy SDK GitHub](https://github.com/alchemyplatform/alchemy-sdk-js)
- [Alchemy Dashboard](https://dashboard.alchemy.com/)
- [API Reference](https://docs.alchemy.com/reference/api-overview)

## Next Steps

- [Deployment Guide](./deployment.md) - Deploy to production
- [x402 Integration](./x402-integration.md) - Payment implementation

---

Questions? [Open an issue](https://github.com/yourusername/vend/issues)

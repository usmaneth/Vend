# x402-onchain-verification

**Direct on-chain payment verification for Express.js - x402 protocol without facilitator servers**

Implement x402 micropayments in your Express API with **direct blockchain verification**. No facilitator servers needed - your server verifies payments directly on-chain.

## Why This Package?

The x402 protocol supports two verification approaches:

### 1. **Facilitator-Based (Official x402-express)**
```
Client → Resource Server → Facilitator Server → Blockchain
                ↑                   ↓
                └─────────────────┘
```
- ✅ Gasless for clients
- ✅ No blockchain knowledge needed
- ❌ Requires facilitator infrastructure
- ❌ Additional service dependency

### 2. **Direct On-Chain (This Package)**
```
Client → Resource Server → Blockchain
           ↑                    ↓
           └────────────────────┘
```
- ✅ No facilitator needed
- ✅ Full control over verification
- ✅ Simpler architecture
- ✅ Lower latency (~200-400ms)
- ❌ Requires blockchain RPC access (Alchemy/Infura)

## When to Use Each?

| Use Case | Direct On-Chain<br/>(This Package) | Facilitator-Based<br/>(x402-express) |
|----------|:----------------------------------:|:------------------------------------:|
| Simple USDC payments | ✅ Perfect | ⚠️ Overkill |
| Self-hosted apps | ✅ Ideal | ❌ Extra complexity |
| Multiple chains/tokens | ⚠️ Manual setup | ✅ Abstracted |
| Gasless experience | ❌ Client pays gas | ✅ Facilitator handles |
| No external dependencies | ✅ Just blockchain RPC | ❌ Needs facilitator |
| Production apps | ✅ Production-ready | ✅ Production-ready |

## Quick Start

### Installation

```bash
npm install x402-onchain-verification alchemy-sdk
```

### Basic Example

```javascript
import express from 'express';
import { Alchemy, Network } from 'alchemy-sdk';
import { paymentRequired, createUSDCVerifier } from 'x402-onchain-verification';

const app = express();

// Initialize Alchemy for payment verification
const alchemy = new Alchemy({
  apiKey: process.env.ALCHEMY_API_KEY,
  network: Network.BASE_MAINNET,
});

// Create USDC verifier
const verifier = createUSDCVerifier({
  alchemy,
  network: 'base-mainnet',
});

// Protect endpoint with payment
app.get('/premium-data',
  paymentRequired({
    price: '0.01',
    currency: 'USDC',
    recipient: '0xYourAddress',
    network: 'base-mainnet',
    chainId: 8453,
    verifier
  }),
  (req, res) => {
    res.json({ data: 'premium content' });
  }
);

app.listen(3000);
```

That's it! Your API now requires USDC payment before serving data.

## How It Works

### 1. Client Requests Resource (No Payment)

```bash
GET /premium-data
```

**Server Response: 402 Payment Required**

```json
{
  "error": "Payment Required",
  "status": 402,
  "protocol": "x402",
  "payment": {
    "recipient": "0xYourAddress",
    "amount": "0.01",
    "currency": "USDC",
    "network": "base-mainnet",
    "chainId": 8453
  },
  "instructions": {
    "message": "Pay 0.01 USDC to access this resource",
    "steps": [
      "1. Send 0.01 USDC payment to 0xYourAddress",
      "2. Include payment proof in X-Payment-Hash header",
      "3. Retry request with payment proof"
    ]
  }
}
```

### 2. Client Sends USDC on Base

Client sends 0.01 USDC to the recipient address on Base network.

### 3. Client Retries with Payment Proof

```bash
GET /premium-data
X-Payment-Hash: 0x1234...abcd
```

**Server verifies payment on-chain:**
- ✅ Queries Base blockchain for transaction
- ✅ Parses USDC Transfer event
- ✅ Validates recipient matches
- ✅ Validates amount >= required
- ✅ Returns data if valid

**Response: 200 OK**

```json
{
  "data": "premium content",
  "payment": {
    "hash": "0x1234...abcd",
    "verified": true,
    "amount": "0.01",
    "currency": "USDC"
  }
}
```

## API Reference

### `paymentRequired(options)`

Creates payment requirement middleware.

**Options:**

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `price` | string | ✅ | Price per request (e.g., "0.01") |
| `currency` | string | ✅ | Currency code (e.g., "USDC") |
| `recipient` | string | ✅ | Payment recipient address |
| `verifier` | function | ✅ | Payment verification function |
| `network` | string | ❌ | Blockchain network |
| `chainId` | number | ❌ | EVM chain ID |
| `required` | boolean | ❌ | Whether payment is required (default: true) |
| `onVerified` | function | ❌ | Callback when payment verified |
| `onRejected` | function | ❌ | Callback when payment rejected |
| `logger` | function | ❌ | Logger function |

### `createUSDCVerifier(options)`

Creates a USDC payment verifier for EVM chains.

**Options:**

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `alchemy` | Alchemy | ✅ | Alchemy SDK instance |
| `network` | string | ✅ | Network name (e.g., "base-mainnet") |
| `usdcContract` | string | ❌ | Custom USDC contract address |
| `tolerance` | number | ❌ | Amount tolerance (default: 0.000001) |
| `logger` | function | ❌ | Logger function |

**Supported Networks:**
- Ethereum: `eth-mainnet`, `eth-sepolia`
- Base: `base-mainnet`, `base-sepolia` (Recommended)
- Polygon: `polygon-mainnet`, `polygon-amoy`
- Arbitrum: `arbitrum-mainnet`, `arbitrum-sepolia`
- Optimism: `optimism-mainnet`, `optimism-sepolia`

### `createDemoVerifier(options)`

Creates a demo verifier for development/testing.

**Options:**

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `acceptedHashes` | string[] | ❌ | Payment hashes to accept (default: ["demo"]) |
| `logger` | function | ❌ | Logger function |

## Production Example

```javascript
import express from 'express';
import { Alchemy, Network } from 'alchemy-sdk';
import { paymentRequired, createUSDCVerifier } from 'x402-onchain-verification';
import pino from 'pino';

const app = express();
const logger = pino();

// Initialize Alchemy
const alchemy = new Alchemy({
  apiKey: process.env.ALCHEMY_API_KEY,
  network: Network.BASE_MAINNET,
});

// Create USDC verifier with logging
const verifier = createUSDCVerifier({
  alchemy,
  network: 'base-mainnet',
  logger: (message, level, data) => {
    logger[level](data, message);
  },
});

// Protect endpoints with different prices
app.get('/cheap-data',
  paymentRequired({
    price: '0.001',
    currency: 'USDC',
    recipient: process.env.PAYMENT_ADDRESS,
    network: 'base-mainnet',
    chainId: 8453,
    verifier,
    onVerified: (req, paymentInfo) => {
      logger.info({ payment: paymentInfo }, 'Payment verified');
      // Track revenue, send notification, etc.
    },
    onRejected: (req, reason) => {
      logger.warn({ reason }, 'Payment rejected');
      // Log fraud attempts, block IP, etc.
    }
  }),
  (req, res) => res.json({ data: 'cheap content' })
);

app.get('/expensive-data',
  paymentRequired({
    price: '1.00',
    currency: 'USDC',
    recipient: process.env.PAYMENT_ADDRESS,
    network: 'base-mainnet',
    chainId: 8453,
    verifier
  }),
  (req, res) => res.json({ data: 'expensive content' })
);

app.listen(3000);
```

## Custom Verifiers

Create your own verifier for any payment method:

```javascript
// Example: Stripe verification
async function stripeVerifier(paymentHash, expectedAmount, context) {
  const { recipient } = context;

  // paymentHash could be Stripe payment intent ID
  const payment = await stripe.paymentIntents.retrieve(paymentHash);

  // Verify payment succeeded
  if (payment.status !== 'succeeded') return false;

  // Verify amount
  const amountInDollars = payment.amount / 100;
  if (amountInDollars < parseFloat(expectedAmount)) return false;

  // Verify recipient
  if (payment.destination !== recipient) return false;

  return true;
}

app.get('/api/data',
  paymentRequired({
    price: '5.00',
    currency: 'USD',
    recipient: 'acct_123...',
    verifier: stripeVerifier
  }),
  handler
);
```

## Comparison with Official x402-express

| Feature | x402-onchain-verification<br/>(This Package) | x402-express<br/>(Coinbase Official) |
|---------|:--------------------------------------------:|:-------------------------------------:|
| **Architecture** | Direct blockchain queries | Facilitator server |
| **Dependencies** | Alchemy/Infura RPC | Facilitator service |
| **Verification Time** | ~200-400ms | Varies |
| **Setup Complexity** | Low | Medium |
| **Gasless** | No (client pays) | Yes (facilitator handles) |
| **Multi-chain** | Manual setup per chain | Abstracted |
| **Control** | Full control | Delegated to facilitator |
| **Best For** | Simple USDC payments | Complex multi-chain/token |

**Both are valid x402 implementations!** Choose based on your needs:

- **Simple use case?** → Use this package (direct verification)
- **Complex multi-chain?** → Use official x402-express (facilitator-based)
- **Self-hosted?** → Use this package
- **Want gasless UX?** → Use official x402-express

## Development

### Demo Mode

Use the demo verifier for testing:

```javascript
import { createDemoVerifier } from 'x402-onchain-verification';

const verifier = createDemoVerifier();

app.get('/test',
  paymentRequired({
    price: '0.01',
    currency: 'USDC',
    recipient: '0x...',
    verifier
  }),
  handler
);

// Test with:
// curl -H "X-Payment-Hash: demo" http://localhost:3000/test
```

## Real-World Example

See **[Vend](https://github.com/usmaneth/Vend)** - a production API built with this package:

```bash
# 1. Request without payment
curl "https://vend.xyz/api/transfers?address=0x..."
# → 402 Payment Required with payment instructions

# 2. Send 0.01 USDC on Base

# 3. Retry with payment proof
curl -H "X-Payment-Hash: 0x123...abc" \
  "https://vend.xyz/api/transfers?address=0x..."
# → 200 OK with blockchain data
```

## Technical Details

### On-Chain Verification Process

1. **Fetch transaction receipt** from blockchain (Alchemy/Infura)
2. **Parse ERC20 Transfer event** from transaction logs
3. **Decode event data:**
   - Event signature: `0xddf252ad...` (Transfer event)
   - topics[2]: recipient address (indexed)
   - data: amount in smallest unit (uint256)
4. **Validate:**
   - Transaction succeeded (status === 1)
   - Recipient matches expected address
   - Amount >= required amount (with tolerance)
5. **Return result** to middleware

### USDC Contracts

Configured for all major networks:

```javascript
const USDC_CONTRACTS = {
  'eth-mainnet': '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  'base-mainnet': '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  'polygon-mainnet': '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
  'arbitrum-mainnet': '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
  'optimism-mainnet': '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
  // ... and testnets
};
```

## Roadmap

- [x] USDC verification on 8+ EVM chains
- [x] Production-ready error handling
- [x] Comprehensive logging
- [ ] TypeScript definitions
- [ ] Payment caching
- [ ] Lightning Network verifier
- [ ] Bitcoin on-chain verifier
- [ ] Rate limiting helpers

## Contributing

Contributions welcome! This package is part of the [Vend](https://github.com/usmaneth/Vend) monorepo.

## Related Projects

- **[Vend](https://github.com/usmaneth/Vend)** - Monetized transaction history API (reference implementation)
- **[x402-express](https://npmjs.com/package/x402-express)** - Official Coinbase facilitator-based implementation
- **[x402 Protocol](https://github.com/coinbase/x402)** - Official x402 specification

## License

MIT

---

**Built for [Vend](https://github.com/usmaneth/Vend)**

*Direct on-chain verification. No facilitators needed.*

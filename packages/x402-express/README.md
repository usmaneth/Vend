# x402-express

**HTTP 402 Payment Required middleware for Express.js**

Implement micropayments in your API using the x402 protocol. Turn any Express endpoint into a pay-per-use service with cryptocurrency, stablecoins, Lightning Network, or any payment method.

## Features

- 🎯 **Simple API** - One line to add payment requirements to any endpoint
- 🔌 **Pluggable Verifiers** - Bring your own payment verification logic
- ⚡ **Built-in Verifiers** - USDC, demo mode, and more
- 🌐 **Blockchain Agnostic** - Works with Ethereum, Base, Bitcoin Lightning, or any payment method
- 🛡️ **Production Ready** - Error handling, logging, callbacks
- 📦 **Zero Dependencies** - Core package has no dependencies
- 🎨 **TypeScript Ready** - Full type definitions (coming soon)

## Installation

```bash
npm install x402-express
```

For blockchain payment verification, also install:
```bash
npm install alchemy-sdk  # For USDC/crypto payments
```

## Quick Start

### Basic Usage

```javascript
import express from 'express';
import { paymentRequired, createDemoVerifier } from 'x402-express';

const app = express();

// Demo verifier for development
const verifier = createDemoVerifier();

app.get('/api/data',
  paymentRequired({
    price: '0.01',
    currency: 'USDC',
    recipient: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    verifier
  }),
  (req, res) => {
    res.json({
      data: 'protected content',
      payment: req.payment  // Payment info attached by middleware
    });
  }
);

app.listen(3000);
```

### Production Usage (USDC on Base)

```javascript
import express from 'express';
import { Alchemy, Network } from 'alchemy-sdk';
import { paymentRequired, createUSDCVerifier } from 'x402-express';

const app = express();

// Initialize Alchemy for payment network
const alchemy = new Alchemy({
  apiKey: process.env.ALCHEMY_API_KEY,
  network: Network.BASE_MAINNET,
});

// Create USDC verifier
const verifier = createUSDCVerifier({
  alchemy,
  network: 'base-mainnet',
});

app.get('/api/transfers',
  paymentRequired({
    price: '0.01',
    currency: 'USDC',
    recipient: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    network: 'base-mainnet',
    chainId: 8453,
    verifier
  }),
  async (req, res) => {
    const data = await fetchBlockchainData();
    res.json({ data });
  }
);

app.listen(3000);
```

## How It Works

### 1. Client requests without payment

```bash
GET /api/data
```

**Response:** `402 Payment Required`

```json
{
  "error": "Payment Required",
  "status": 402,
  "protocol": "x402",
  "payment": {
    "recipient": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "amount": "0.01",
    "currency": "USDC",
    "network": "base-mainnet",
    "chainId": 8453
  },
  "instructions": {
    "message": "Pay 0.01 USDC to access this resource",
    "steps": [
      "1. Send 0.01 USDC payment to 0x742d35Cc...",
      "2. Include payment proof in X-Payment-Hash header",
      "3. Retry request with payment proof"
    ]
  }
}
```

### 2. Client sends payment

Client sends USDC on Base network to the recipient address.

### 3. Client retries with payment proof

```bash
GET /api/data
X-Payment-Hash: 0x1234...abcd
```

**Response:** `200 OK`

```json
{
  "data": "protected content",
  "payment": {
    "hash": "0x1234...abcd",
    "verified": true,
    "amount": "0.01",
    "currency": "USDC",
    "timestamp": "2025-01-15T12:00:00.000Z"
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
| `currency` | string | ✅ | Currency code (e.g., "USDC", "USD", "BTC") |
| `recipient` | string | ✅ | Payment recipient address/identifier |
| `verifier` | function | ✅ | Payment verification function |
| `required` | boolean | ❌ | Whether payment is required (default: true) |
| `network` | string | ❌ | Blockchain network (e.g., "base-mainnet") |
| `chainId` | number | ❌ | EVM chain ID |
| `facilitatorUrl` | string | ❌ | Payment facilitator URL |
| `onVerified` | function | ❌ | Callback when payment is verified |
| `onRejected` | function | ❌ | Callback when payment is rejected |
| `headerName` | string | ❌ | Header name for payment proof (default: "x-payment-hash") |
| `logger` | function | ❌ | Logger function |

**Returns:** Express middleware function

### `createUSDCVerifier(options)`

Creates a USDC payment verifier for EVM chains.

**Options:**

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `alchemy` | Alchemy | ✅ | Alchemy SDK instance |
| `network` | string | ✅ | Network name (e.g., "base-sepolia") |
| `usdcContract` | string | ❌ | Custom USDC contract address |
| `tolerance` | number | ❌ | Amount tolerance (default: 0.000001) |
| `logger` | function | ❌ | Logger function |

**Supported Networks:**
- Ethereum: `eth-mainnet`, `eth-sepolia`
- Base: `base-mainnet`, `base-sepolia`
- Polygon: `polygon-mainnet`, `polygon-amoy`
- Arbitrum: `arbitrum-mainnet`, `arbitrum-sepolia`
- Optimism: `optimism-mainnet`, `optimism-sepolia`

### `createDemoVerifier(options)`

Creates a demo verifier for development/testing.

**Options:**

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `acceptedHashes` | string[] | ❌ | Payment hashes to accept (default: ["demo"]) |
| `enabledInProduction` | boolean | ❌ | Allow in production (default: false, dangerous!) |
| `logger` | function | ❌ | Logger function |

## Custom Verifiers

Create your own verifier for any payment method:

```javascript
// Example: Stripe verification
async function stripeVerifier(paymentHash, expectedAmount, context) {
  const { recipient } = context;

  // paymentHash could be Stripe payment intent ID
  const payment = await stripe.paymentIntents.retrieve(paymentHash);

  // Verify payment succeeded
  if (payment.status !== 'succeeded') {
    return false;
  }

  // Verify amount
  const amountInDollars = payment.amount / 100;
  if (amountInDollars < parseFloat(expectedAmount)) {
    return false;
  }

  // Verify recipient (your Stripe account)
  if (payment.destination !== recipient) {
    return false;
  }

  return true;
}

app.get('/api/data',
  paymentRequired({
    price: '1.00',
    currency: 'USD',
    recipient: 'acct_123...',  // Your Stripe account ID
    verifier: stripeVerifier
  }),
  handler
);
```

## Advanced Usage

### Different Prices for Different Endpoints

```javascript
app.get('/api/cheap',
  paymentRequired({ price: '0.001', currency: 'USDC', recipient, verifier }),
  handler
);

app.get('/api/expensive',
  paymentRequired({ price: '1.00', currency: 'USDC', recipient, verifier }),
  handler
);
```

### Payment Callbacks

```javascript
paymentRequired({
  price: '0.01',
  currency: 'USDC',
  recipient,
  verifier,
  onVerified: (req, paymentInfo) => {
    console.log('Payment verified:', paymentInfo);
    // Track revenue, send notification, etc.
  },
  onRejected: (req, reason) => {
    console.log('Payment rejected:', reason);
    // Log fraud attempts, block IP, etc.
  }
})
```

### Custom Logger Integration

```javascript
import pino from 'pino';
const logger = pino();

const pinoLogger = (message, level, data) => {
  logger[level](data, message);
};

paymentRequired({
  price: '0.01',
  currency: 'USDC',
  recipient,
  verifier,
  logger: pinoLogger
})
```

### Demo Bypass for Development

```javascript
import { demoPaymentBypass } from 'x402-express';

if (process.env.NODE_ENV === 'development') {
  // Automatically adds X-Payment-Hash: demo to all requests
  app.use(demoPaymentBypass());
}
```

## Examples

See the `/examples` directory for complete examples:
- Basic USDC payments on Base
- Multi-currency support
- Custom payment verification
- Integration with existing APIs

## Protocol Specification

x402-express implements the x402 protocol for HTTP-based micropayments.

See: https://x402.org (if available)

The 402 HTTP status code was reserved for "payment required" in the original HTTP specification but was never standardized. x402 brings it to life with cryptocurrency payments.

## Roadmap

- [ ] TypeScript definitions
- [ ] Payment caching (avoid re-verification)
- [ ] Rate limiting integration
- [ ] Lightning Network verifier
- [ ] Bitcoin on-chain verifier
- [ ] Subscription model (time-based access)
- [ ] Payment facilitator support
- [ ] WebSocket support

## Contributing

Contributions welcome! This package is part of the [Vend](https://github.com/yourusername/txpay) monorepo.

## License

MIT

## Related Projects

- **Vend** - Monetized transaction history API (reference implementation)
- **x402.org** - x402 protocol specification

---

**Built with ❤️ by the Vend team**

*Turn any API into a vending machine: Insert payment → Get data*

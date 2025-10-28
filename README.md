# Vend 🎰

<img width="498" height="241" alt="Screenshot 2025-10-27 at 4 41 39 AM" src="https://github.com/user-attachments/assets/56a18ece-52db-4914-9553-b421f3c7f503" />

**Monetized Transaction History API using x402 and Alchemy**

Blockchain data on demand - like a vending machine for blockchain data. Insert payment (USDC), get instant access to transaction histories. No accounts, no API keys, just pay-per-use.

- 💰 **x402 Protocol** - HTTP micropayments (402 Payment Required)
- ⚡ **Alchemy SDK** - Fast, reliable blockchain data
- 🎰 **Vending Machine Model** - Insert payment → Get data instantly
- ✅ **Production Ready** - Real on-chain payment verification on Base

> **New!** Vend now uses [x402-express](https://npmjs.com/package/x402-express), our open-source middleware for adding micropayments to any Express API.

```
┌─────────────────────────────────┐
│         🎰 VEND                 │
│   Blockchain Data Vending       │
│                                 │
│  [Insert 0.01 USDC]            │
│         ↓                       │
│  [Get Transaction Data]         │
└─────────────────────────────────┘
```

## Why Vend?

**Traditional APIs:**
- Sign up for account
- Manage API keys
- Monthly subscriptions
- Rate limits

**Vend:**
- Pay USDC → Get data
- That's it. 💰

Perfect for AI agents, developers, and anyone who wants blockchain data without the hassle.

---

## 🔌 How x402 Works

**x402** is an open protocol that revives the HTTP `402 Payment Required` status code for instant micropayments over HTTP.

### The Flow

```
┌─────────────┐                           ┌─────────────┐
│   Client    │                           │    Vend     │
└──────┬──────┘                           └──────┬──────┘
       │                                          │
       │  1. GET /api/transfers?address=0x...    │
       │─────────────────────────────────────────>│
       │                                          │
       │  2. 402 Payment Required                 │
       │     {                                    │
       │       recipient: "0x742d...",            │
       │       amount: "0.01 USDC",               │
       │       network: "base"                    │
       │     }                                    │
       │<─────────────────────────────────────────│
       │                                          │
       │  3. [User sends 0.01 USDC on Base]      │
       │                                          │
       │  4. GET /api/transfers?address=0x...    │
       │     Header: X-Payment-Hash: 0xabc123... │
       │─────────────────────────────────────────>│
       │                                          │
       │     [Vend verifies payment on-chain]    │
       │     [Vend queries Alchemy for data]     │
       │                                          │
       │  5. 200 OK                               │
       │     { transfers: [...] }                 │
       │<─────────────────────────────────────────│
```

### Why x402?

- ✅ **No accounts** - No signup, no password, no OAuth
- ✅ **No API keys** - No keys to manage, rotate, or leak
- ✅ **Instant settlement** - Payment verified in ~2 seconds
- ✅ **Pay-per-use** - Only pay for what you use, when you use it
- ✅ **Agent-friendly** - AI agents can autonomously discover and pay for APIs
- ✅ **Permissionless** - Anyone with USDC can access the API

**Traditional API:**
```javascript
// Need to sign up, get API key, manage credentials
const response = await fetch('https://api.example.com/data', {
  headers: { 'Authorization': 'Bearer sk_live_xxxx...' }
});
```

**x402 API (Vend):**
```javascript
// Just pay and use - no credentials needed
let response = await fetch('https://vend.xyz/api/transfers?address=0x...');

if (response.status === 402) {
  const payment = await response.json();
  await sendUSDC(payment.recipient, payment.amount);

  // Retry with payment proof
  response = await fetch('https://vend.xyz/api/transfers?address=0x...', {
    headers: { 'X-Payment-Hash': txHash }
  });
}

const data = await response.json();
```

**Learn more:** [x402.org](https://x402.org)

### The 402 Response Format

When you request data without payment, Vend returns a `402 Payment Required` response with payment instructions:

```json
{
  "error": "Payment Required",
  "status": 402,
  "protocol": "x402",
  "version": "1.0",
  "payment": {
    "recipient": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "amount": "0.01",
    "currency": "USDC",
    "network": "base-sepolia",
    "chainId": 84532
  },
  "resource": {
    "endpoint": "/api/transfers",
    "method": "GET",
    "description": "Transaction history query"
  },
  "instructions": {
    "message": "Send payment to access blockchain transaction data",
    "steps": [
      "1. Send USDC payment to the recipient address",
      "2. Include transaction hash in X-Payment-Hash header",
      "3. Retry request with payment proof"
    ]
  }
}
```

After sending payment, include the transaction hash in your next request:

```bash
curl -H "X-Payment-Hash: 0xYourTransactionHash" \
  "https://vend.xyz/api/transfers?address=0x..."
```

Vend verifies the payment on-chain, then returns your data with a `200 OK` response.

---

## Features

- 🎰 **Pay-Per-Use** - Like a vending machine: insert payment, get data
- ⚡ **Instant Access** - No signup, no API keys, no waiting
- ✅ **Real Payment Verification** - On-chain USDC verification on Base (Sepolia/Mainnet)
- 🔗 **Multi-Chain** - Ethereum, Polygon, Base, Arbitrum, Optimism
- 📊 **Complete Data** - ETH, ERC20, ERC721, ERC1155 transfers with metadata
- 🤖 **Agent-Friendly** - Perfect for autonomous AI agents
- 📦 **Built with x402-express** - Uses our open-source micropayment middleware
- 🌐 **Open Source** - MIT licensed, fork and extend

---

## 🎬 Interactive Demo

See Vend in action without any setup:

```bash
npm run demo
```

**What you'll see:**
- 🎰 Visual vending machine flow
- 💰 x402 payment simulation
- 📊 Real blockchain data examples
- 🤖 AI agent use cases
- 🤝 Agent-to-agent commerce scenarios

**No API keys needed!**

---

## Quick Start

### Step 1: Install

```bash
git clone https://github.com/yourusername/vend.git
cd vend
npm install
```

### Step 2: Configure

Run the setup helper:

```bash
./configure.sh
```

Or manually edit `.env`:

```bash
cp .env.example .env
nano .env
```

Add your credentials:
```bash
ALCHEMY_API_KEY=your_alchemy_api_key_here
PAYMENT_ADDRESS=0xYourWalletAddressHere
```

**Get free Alchemy key:** [dashboard.alchemy.com](https://dashboard.alchemy.com)

### Step 3: Start Vend

```bash
npm run dev
```

**Output:**
```
INFO: Configuration validated successfully
INFO: Alchemy SDK initialized network=eth-mainnet
INFO: Vend server started port=3000

🎰 Vend is ready! Insert payment to get data.
```

---

## 🎰 Using Vend

### The Vending Machine Flow

```
1. Request data     → 402 Payment Required
2. Insert payment   → Send 0.01 USDC
3. Get data        → Instant blockchain data
```

### Quick Test

```bash
# Check if Vend is running
curl http://localhost:3000/health

# Try to get data (will ask for payment)
curl "http://localhost:3000/api/transfers?address=0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"

# In dev mode, use demo "payment"
curl -H "X-Payment-Hash: demo" \
  "http://localhost:3000/api/transfers?address=0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
```

---

## 📊 Query Examples

All examples use the demo payment header in development:
```bash
-H "X-Payment-Hash: demo"
```

### Example 1: Get All Transfers

```bash
curl -H "X-Payment-Hash: demo" \
  "http://localhost:3000/api/transfers?address=0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
```

**What you get:** All ETH, token, and NFT transfers for this address

**Response:**
```json
{
  "success": true,
  "data": {
    "transfers": [
      {
        "blockNum": "0x10e1b3a",
        "hash": "0x789abc...",
        "from": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
        "to": "0x123...",
        "value": 1.5,
        "asset": "ETH",
        "category": "external",
        "metadata": {
          "blockTimestamp": "2025-01-15T10:30:00.000Z"
        }
      }
    ],
    "totalCount": 100
  },
  "payment": {
    "hash": "demo",
    "verified": true
  }
}
```

---

### Example 2: Get Only Tokens (ERC20)

```bash
curl -H "X-Payment-Hash: demo" \
  "http://localhost:3000/api/transfers?address=0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045&category=erc20"
```

**Use case:** Track USDC, DAI, or other token movements

---

### Example 3: Get Only NFTs

```bash
curl -H "X-Payment-Hash: demo" \
  "http://localhost:3000/api/transfers?address=0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045&category=erc721,erc1155"
```

**Use case:** Monitor NFT collection activity, whale NFT purchases

---

### Example 4: Last 10 Transfers

```bash
curl -H "X-Payment-Hash: demo" \
  "http://localhost:3000/api/transfers?address=0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045&maxCount=10"
```

**Use case:** Quick snapshot of recent activity

---

### Example 5: Track USDC Only

```bash
curl -H "X-Payment-Hash: demo" \
  "http://localhost:3000/api/transfers?address=0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045&contractAddresses=0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
```

**Use case:** Monitor stablecoin payments

---

### Example 6: Outgoing Transfers Only

```bash
curl -H "X-Payment-Hash: demo" \
  "http://localhost:3000/api/transfers?fromAddress=0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045&maxCount=20"
```

**Use case:** Track wallet spending patterns

---

### Example 7: Incoming Transfers Only

```bash
curl -H "X-Payment-Hash: demo" \
  "http://localhost:3000/api/transfers?toAddress=0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045&maxCount=20"
```

**Use case:** Monitor payments received

---

### Example 8: Combine Filters

```bash
curl -H "X-Payment-Hash: demo" \
  "http://localhost:3000/api/transfers?address=0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045&category=erc20&maxCount=5&order=desc"
```

**Use case:** Recent token activity only

---

### Example 9: Paginate Large Datasets

```bash
# First page
curl -H "X-Payment-Hash: demo" \
  "http://localhost:3000/api/transfers?address=0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045&maxCount=100"

# Returns: { ..., "pageKey": "next_page_token" }

# Next page
curl -H "X-Payment-Hash: demo" \
  "http://localhost:3000/api/transfers?address=0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045&pageKey=next_page_token"
```

---

## 🎯 Query Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `address` | string | Wallet address (to OR from) | `0xd8dA...` |
| `fromAddress` | string | Sender address | `0xd8dA...` |
| `toAddress` | string | Recipient address | `0x123...` |
| `category` | string | Transfer types (comma-separated) | `erc20,erc721` |
| `contractAddresses` | string | Specific tokens (comma-separated) | `0xA0b8...` |
| `fromBlock` | string | Start block | `0x1000000` |
| `toBlock` | string | End block | `latest` |
| `maxCount` | number | Max results (1-1000) | `100` |
| `pageKey` | string | Pagination token | `abc123...` |
| `order` | string | Sort: `asc` or `desc` | `desc` |

### Categories

- `external` - ETH transfers
- `internal` - Contract ETH transfers
- `erc20` - Token transfers (USDC, DAI, etc.)
- `erc721` - NFTs
- `erc1155` - Multi-tokens
- `specialnft` - CryptoPunks, etc.

---

## 💡 What You Can Build

### 1. 🐋 Whale Tracker

Monitor large wallets and get alerts:

```javascript
// whale-tracker.js
import fetch from 'node-fetch';

const WHALES = [
  '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', // Vitalik
];

async function checkWhale(address) {
  const res = await fetch(
    `http://localhost:3000/api/transfers?address=${address}&maxCount=10`,
    { headers: { 'X-Payment-Hash': 'demo' } }
  );

  const data = await res.json();
  const large = data.data.transfers.filter(t => parseFloat(t.value) > 100);

  if (large.length > 0) {
    console.log(`🚨 WHALE ALERT for ${address}:`);
    large.forEach(t => {
      console.log(`  💰 ${t.value} ${t.asset} | ${t.from} → ${t.to}`);
    });
  }
}

// Check every 15 minutes
setInterval(() => WHALES.forEach(checkWhale), 15 * 60 * 1000);
```

**Run it:**
```bash
node whale-tracker.js
```

---

### 2. 📊 Portfolio Dashboard

Analytics for any wallet:

```javascript
// portfolio.js
import express from 'express';
import fetch from 'node-fetch';

const app = express();

app.get('/portfolio/:address', async (req, res) => {
  const response = await fetch(
    `http://localhost:3000/api/transfers?address=${req.params.address}&maxCount=100`,
    { headers: { 'X-Payment-Hash': 'demo' } }
  );

  const data = await response.json();
  const transfers = data.data.transfers;

  const analysis = {
    totalTransfers: transfers.length,
    ethTransfers: transfers.filter(t => t.asset === 'ETH').length,
    tokenTransfers: transfers.filter(t => t.category === 'erc20').length,
    nftTransfers: transfers.filter(t => t.category === 'erc721').length,
    topTokens: getTopTokens(transfers),
    recentActivity: transfers.slice(0, 10),
  };

  res.json(analysis);
});

function getTopTokens(transfers) {
  const counts = {};
  transfers.filter(t => t.category === 'erc20').forEach(t => {
    counts[t.asset] = (counts[t.asset] || 0) + 1;
  });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
}

app.listen(4000, () => console.log('📊 Portfolio API on :4000'));
```

**Test:**
```bash
node portfolio.js
curl http://localhost:4000/portfolio/0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045
```

---

### 3. 🤖 Trading Bot

Analyze wallets before trading:

```javascript
// trading-bot.js
import fetch from 'node-fetch';

class TradingBot {
  async analyzeWallet(address) {
    const res = await fetch(
      `http://localhost:3000/api/transfers?address=${address}&category=erc20&maxCount=50`,
      { headers: { 'X-Payment-Hash': 'demo' } }
    );

    const data = await res.json();
    const transfers = data.data.transfers;

    const tokenVolume = transfers.reduce((sum, t) => sum + parseFloat(t.value), 0);
    const uniqueTokens = new Set(transfers.map(t => t.asset)).size;

    return {
      isActiveTrader: transfers.length > 20,
      tokenVolume,
      uniqueTokens,
      riskScore: transfers.length > 30 ? 'high' : 'low',
    };
  }

  async shouldTrade(address) {
    const analysis = await this.analyzeWallet(address);
    console.log('Wallet Analysis:', analysis);

    if (analysis.isActiveTrader && analysis.riskScore === 'low') {
      console.log('✅ Safe to trade');
      return true;
    }

    console.log('❌ Risky wallet, skip');
    return false;
  }
}

const bot = new TradingBot();
bot.shouldTrade('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045');
```

---

### 4. 🎨 NFT Monitor

Track NFT collections:

```javascript
// nft-monitor.js
import fetch from 'node-fetch';

async function monitorNFT(contractAddress) {
  const res = await fetch(
    `http://localhost:3000/api/transfers?contractAddresses=${contractAddress}&category=erc721&maxCount=20`,
    { headers: { 'X-Payment-Hash': 'demo' } }
  );

  const data = await res.json();

  console.log(`\n🎨 Recent NFT Activity:`);
  data.data.transfers.forEach(t => {
    console.log(`  NFT #${t.erc721TokenId}: ${t.from} → ${t.to}`);
  });
}

// Monitor CryptoPunks
monitorNFT('0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB');
```

---

### 5. 💰 Payment Tracker

Monitor business payments:

```javascript
// payment-tracker.js
import fetch from 'node-fetch';

const BUSINESS_WALLET = '0xYourAddress';
const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';

async function checkPayments() {
  const res = await fetch(
    `http://localhost:3000/api/transfers?toAddress=${BUSINESS_WALLET}&contractAddresses=${USDC}&maxCount=50`,
    { headers: { 'X-Payment-Hash': 'demo' } }
  );

  const data = await res.json();
  const payments = data.data.transfers;
  const total = payments.reduce((sum, p) => sum + parseFloat(p.value), 0);

  console.log(`\n💰 Payment Summary:`);
  console.log(`  Total: ${payments.length} payments`);
  console.log(`  Amount: ${total.toFixed(2)} USDC`);
}

setInterval(checkPayments, 5 * 60 * 1000); // Every 5 min
```

---

### 6. 📈 DeFi Tracker

Monitor DeFi interactions:

```javascript
// defi-tracker.js
import fetch from 'node-fetch';

const UNISWAP = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D';

async function trackDeFi(userAddress) {
  const res = await fetch(
    `http://localhost:3000/api/transfers?fromAddress=${userAddress}&toAddress=${UNISWAP}&maxCount=100`,
    { headers: { 'X-Payment-Hash': 'demo' } }
  );

  const data = await res.json();
  const swaps = data.data.transfers;

  console.log(`\n📈 DeFi Activity:`);
  console.log(`  Uniswap swaps: ${swaps.length}`);

  const tokens = new Set(swaps.map(s => s.asset));
  console.log(`  Tokens: ${Array.from(tokens).join(', ')}`);
}

trackDeFi('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045');
```

---

## 🚀 Project Ideas

### Beginner
1. **Wallet Balance Tracker** - Monitor your own wallet
2. **Alert Bot** - Get notified of specific transfers
3. **Simple Dashboard** - Visualize with charts

### Intermediate
4. **Multi-Wallet Manager** - Track many wallets
5. **Token Flow Graph** - Visualize token movements
6. **NFT Floor Tracker** - Monitor collection activity
7. **Copy Trading Bot** - Follow whale trades

### Advanced
8. **AI Trading Assistant** - ML-powered trading signals
9. **Vend SaaS** - Deploy and charge users
10. **Agent Marketplace** - Autonomous agent commerce
11. **Fraud Detection** - Flag suspicious activity
12. **DeFi Credit Score** - Wallet creditworthiness

---

## 🎰 How Vend Works

### The Vending Machine Metaphor

```
Traditional API:
┌──────────────────────┐
│ 1. Sign up           │
│ 2. Get API key       │
│ 3. Set up billing    │
│ 4. Monitor quota     │
│ 5. Finally get data  │
└──────────────────────┘

Vend:
┌──────────────────────┐
│ 1. Insert payment    │
│ 2. Get data          │
└──────────────────────┘
```

### x402 Payment Flow

```
You                     Vend                    Alchemy
│                        │                         │
│  GET /api/transfers   │                         │
│──────────────────────>│                         │
│                        │                         │
│  402 Payment Required  │                         │
│  (Insert 0.01 USDC)   │                         │
│<──────────────────────│                         │
│                        │                         │
│  Send 0.01 USDC       │                         │
│──────────────────────>│                         │
│                        │                         │
│  GET with proof       │                         │
│──────────────────────>│                         │
│                        │  Query blockchain      │
│                        │───────────────────────>│
│                        │  Return data           │
│  Blockchain data      │<───────────────────────│
│<──────────────────────│                         │
```

---

## 📦 x402-express Integration

Vend is built on top of [x402-express](https://npmjs.com/package/x402-express), our open-source middleware for adding HTTP 402 micropayments to any Express.js application.

### What is x402-express?

x402-express is a standalone npm package that implements the x402 protocol for Express apps. It provides:

- 🎯 **Simple API** - Add `paymentRequired()` middleware to any endpoint
- 🔌 **Pluggable Verifiers** - USDC, Lightning Network, Stripe, or bring your own
- ⚡ **Built-in Verifiers** - USDC on 8+ EVM chains, demo mode
- 🛡️ **Production Ready** - Error handling, logging, callbacks
- 📦 **Zero Dependencies** - Core package has no dependencies

### How Vend Uses x402-express

```javascript
import { paymentRequired, createUSDCVerifier } from 'x402-express';
import { Alchemy, Network } from 'alchemy-sdk';

// Initialize Alchemy for payment verification
const alchemy = new Alchemy({
  apiKey: process.env.ALCHEMY_API_KEY,
  network: Network.BASE_SEPOLIA,
});

// Create USDC verifier
const verifier = createUSDCVerifier({
  alchemy,
  network: 'base-sepolia',
});

// Protect endpoint with payment requirement
app.get('/api/transfers',
  paymentRequired({
    price: '0.01',
    currency: 'USDC',
    recipient: process.env.PAYMENT_ADDRESS,
    network: 'base-sepolia',
    chainId: 84532,
    verifier
  }),
  async (req, res) => {
    // This only runs after payment is verified
    const data = await getBlockchainData();
    res.json({ data });
  }
);
```

### Use x402-express in Your Own Projects

Install the package:

```bash
npm install x402-express alchemy-sdk
```

Add micropayments to any API:

```javascript
import express from 'express';
import { paymentRequired, createUSDCVerifier } from 'x402-express';
import { Alchemy, Network } from 'alchemy-sdk';

const app = express();

const alchemy = new Alchemy({
  apiKey: process.env.ALCHEMY_API_KEY,
  network: Network.BASE_MAINNET,
});

const verifier = createUSDCVerifier({ alchemy, network: 'base-mainnet' });

app.get('/premium-data',
  paymentRequired({
    price: '0.05',
    currency: 'USDC',
    recipient: '0xYourAddress',
    verifier
  }),
  (req, res) => {
    res.json({ data: 'premium content' });
  }
);

app.listen(3000);
```

**Learn more:** [x402-express on npm](https://npmjs.com/package/x402-express) | [GitHub](https://github.com/yourusername/x402-express)

---

## 🛠️ Development

### Project Structure

```
vend/
├── src/
│   ├── index.js              # Vend server
│   ├── config.js             # Configuration
│   ├── logger.js             # Logging
│   ├── middleware/
│   │   ├── payment.js        # x402 payment (vending logic)
│   │   └── errorHandler.js   # Error handling
│   ├── routes/
│   │   └── transfers.js      # Data endpoint
│   └── services/
│       └── alchemy.js        # Alchemy integration
├── tests/                    # Tests
├── docs/                     # Documentation
└── demo.js                   # Interactive demo
```

### Scripts

```bash
npm run dev          # Start Vend in dev mode
npm start            # Start Vend in production
npm test             # Run tests
npm run demo         # Interactive demo
```

### Environment

Key variables in `.env`:
- `ALCHEMY_API_KEY` - Your Alchemy key (required)
- `PAYMENT_ADDRESS` - Where you receive payments (required)
- `ALCHEMY_NETWORK` - Network (default: eth-mainnet)
- `PAYMENT_NETWORK` - Payment network (default: base-sepolia)
- `PAYMENT_PRICE_PER_QUERY` - Price per query (default: 0.01)

---

## 📚 Documentation

- **[Getting Started](./docs/getting-started.md)** - Setup guide
- **[x402 Integration](./docs/x402-integration.md)** - Payment flow
- **[Alchemy Guide](./docs/alchemy-guide.md)** - Advanced queries
- **[Deployment](./docs/deployment.md)** - Go to production
- **[Architecture](./UNDERSTANDING_ARCHITECTURE.md)** - How it works
- **[Value Prop](./VALUE_PROPOSITION.md)** - Why Vend?

---

## 🚀 Deployment

### Vercel (Recommended)

```bash
npm i -g vercel
vercel

# Set env vars in dashboard
```

### Docker

```bash
docker build -t vend .
docker run -p 3000:3000 \
  -e ALCHEMY_API_KEY=your_key \
  -e PAYMENT_ADDRESS=0x... \
  vend
```

### VPS

```bash
npm i -g pm2
pm2 start src/index.js --name vend
pm2 save
pm2 startup
```

---

## 💰 Economics

### Development (Free)

- Alchemy: 300M compute units/month
- ~2M queries/month
- Cost: **$0**

### Production

| Queries/Day | Alchemy | Revenue @ $0.01 | Profit |
|-------------|---------|-----------------|--------|
| 1,000 | $49/mo | $300/mo | $251/mo |
| 10,000 | $199/mo | $3,000/mo | $2,801/mo |
| 100,000 | $499/mo | $30,000/mo | $29,501/mo |

---

## 🎯 Use Cases

| What | Queries/Day | Value |
|------|-------------|-------|
| Whale Tracker | 96 | Personal |
| Portfolio Dashboard | 10-50 | Personal finance |
| Trading Bot | 100-1000 | Automated trading |
| NFT Monitor | 50-200 | NFT analytics |
| Payment System | 20-100 | Business ops |
| DeFi Dashboard | 50-500 | DeFi analytics |

---

## ⚠️ Important

### Development Mode

Demo bypass (`X-Payment-Hash: demo`) only works in `NODE_ENV=development`.

### Production Mode

Vend is **production-ready** with real on-chain payment verification:

- ✅ USDC verification on Base (Sepolia & Mainnet)
- ✅ On-chain transaction parsing via Alchemy
- ✅ Recipient and amount validation
- ✅ Sub-second verification times

**For production:**
1. Set `NODE_ENV=production`
2. Set `PAYMENT_NETWORK=base-mainnet`
3. Set your production `PAYMENT_ADDRESS`
4. Test with real USDC on Base Mainnet
5. Monitor Alchemy usage (payment verification + data queries)

See [PAYMENT_VERIFICATION_IMPLEMENTATION.md](./PAYMENT_VERIFICATION_IMPLEMENTATION.md) for details.

---

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

Quick checklist:
- Fork the repo
- Create feature branch
- Add tests
- Submit PR

---

## 📖 API Reference

### GET /health

Health check.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-15T12:00:00.000Z",
  "uptime": 45.2
}
```

### GET /api/transfers

Get transaction history (requires payment).

**Headers:**
- `X-Payment-Hash` - Payment proof (use "demo" in dev)

**Parameters:** See [Query Parameters](#-query-parameters)

**Response:**
```json
{
  "success": true,
  "data": {
    "transfers": [...],
    "totalCount": 100
  },
  "payment": {
    "hash": "0x...",
    "verified": true
  }
}
```

### GET /api/transfers/info

Endpoint info (free, no payment).

---

## 🎯 Roadmap

- [x] Core vending logic with x402
- [x] Alchemy integration
- [x] Documentation
- [x] Interactive demo
- [x] Real payment verification on Base (USDC)
- [x] x402-express middleware package (npm published)
- [ ] Vend CLI (in progress)
- [ ] Token balances endpoint
- [ ] WebSocket support
- [ ] GraphQL API
- [ ] Mobile SDK
- [ ] Lightning Network support
- [ ] Payment caching & optimization

---

## 🌐 Community

- **Issues**: [GitHub Issues](https://github.com/yourusername/vend/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/vend/discussions)
- **Docs**: [./docs](./docs)

---

## 📄 License

MIT License - see [LICENSE](./LICENSE)

---

## 🙏 Built With

- [Alchemy](https://alchemy.com) - Blockchain infrastructure
- [Coinbase](https://coinbase.com) - x402 protocol
- [Base](https://base.org) - Payment settlement

---

## ⭐ Star Us!

If Vend is useful, please star and share!

[⭐ Star on GitHub](https://github.com/yourusername/vend) | [📖 Docs](./docs) | [🐛 Report Bug](https://github.com/yourusername/vend/issues) | [💡 Request Feature](https://github.com/yourusername/vend/issues)

---

**🎰 Made with ❤️ for the web3 community**

*Insert payment → Get blockchain data*

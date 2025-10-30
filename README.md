# Vend 🎰

<img width="498" height="241" alt="Screenshot 2025-10-27 at 4 41 39 AM" src="https://github.com/user-attachments/assets/56a18ece-52db-4914-9553-b421f3c7f503" />

**Monetizable Blockchain Data API via x402 & Alchemy**

Blockchain data on demand - like a vending machine. Insert payment (USDC), get instant access to NFTs, tokens, transactions, and more. No accounts, no API keys, just pay per query.

### Vend Project Structure 

**🖥️ Vend Server API (Express + x402):**
- 📊 **Transaction History** - Asset transfers (ETH, ERC20, ERC721, ERC1155)
- 🖼️ **NFT Data** - Owned NFTs, metadata, floor prices
- 🪙 **Token Balances** - ERC20 holdings and metadata
- 🔔 **Webhooks** - Real time notifications for new transactions
- 💰 **x402 Payments** - USDC micropayments with on chain verification
- ✅ **Production Ready** - Deploy to mainnet

**⌨️ CLI Tool (@asimfiles/vend-cli):**
- 🛠️ **8 Commands** - query, nfts, tokens, balance, info, config, saved, webhook
- 📋 **Output Formats** - Table, JSON, CSV
- 💾 **Saved Queries** - Create reusable query templates
- 🤖 **Automatic Payments** - Optional wallet integration for hands-free payments
- 🌐 **Multi-Network** - Base, Ethereum, Polygon, Arbitrum, Optimism

> **Powered by:** [x402-onchain-verification](https://npmjs.com/package/x402-onchain-verification) - Open-source middleware for direct on-chain payment verification. No facilitator servers needed.

```
┌─────────────────────────────────┐
│         🎰 VEND                 │
│   Blockchain Data Vending       │
│                                 │
│  [Insert 0.01 USDC]             │
│         ↓                       │
│  [Get Data]                     │
└─────────────────────────────────┘
```

---

## 🚀 Fork & Deploy in 5 Minutes

**Vend is production-ready with real on-chain payment verification.**

```bash
# 1. Fork & clone
git clone https://github.com/yourusername/vend.git
cd vend && npm install

# 2. Configure (get free Alchemy key from dashboard.alchemy.com)
cp .env.example .env
# Edit .env: Add ALCHEMY_API_KEY and PAYMENT_ADDRESS

# 3. Deploy to mainnet
export PAYMENT_NETWORK=base-mainnet
export NODE_ENV=production
npm start

# 4. Done! 🎉 Accept USDC payments on Base
```

Real USDC payments work immediately - no additional setup needed. Payment verification happens automatically on chain via Alchemy.

📖 **[Full Deployment Guide](./DEPLOYMENT.md)** | Supports Base, Ethereum, Polygon, Arbitrum, Optimism

---

## 🎯 Why Vend?

**Traditional APIs:**
- Sign up for account ❌
- Manage API keys ❌
- Monthly subscriptions ❌
- Rate limits ❌

**Vend:**
- Pay USDC → Get data ✅
- That's it. 💰

Perfect for:
- 🤖 **AI Agents** - No API key management, just send USDC
- 👨‍💻 **Developers** - Pay-per-use, no subscriptions
- 📊 **Data Analytics** - Access blockchain data on demand
- 🔬 **Researchers** - Query without account setup

---

## 🔌 How x402 Works

**x402** is an open protocol that revives the HTTP `402 Payment Required` status code for instant micropayments.

### The Flow

```
┌─────────────┐                           ┌─────────────┐
│   Client    │                           │    Vend     │
└──────┬──────┘                           └──────┬──────┘
       │                                          │
       │  1. GET /api/nfts?owner=0x...           │
       │─────────────────────────────────────────>│
       │                                          │
       │  2. 402 Payment Required                 │
       │     {                                    │
       │       recipient: "0x742d...",            │
       │       amount: "0.01 USDC",               │
       │       network: "base-mainnet"            │
       │     }                                    │
       │<─────────────────────────────────────────│
       │                                          │
       │  3. [Client sends 0.01 USDC on Base]    │
       │                                          │
       │  4. GET /api/nfts?owner=0x...           │
       │     Header: X-Payment-Hash: 0xabc123... │
       │─────────────────────────────────────────>│
       │                                          │
       │     [Vend verifies payment on-chain]    │
       │     [Vend queries Alchemy for NFTs]     │
       │                                          │
       │  5. 200 OK                               │
       │     { nfts: [...] }                      │
       │<─────────────────────────────────────────│
```

### Why x402?

- ⚡ **Instant** - No account signup, no OAuth, just pay
- 🔒 **Secure** - On-chain payment verification
- 💰 **Fair** - Pay only for what you use
- 🌐 **Open Standard** - Anyone can implement x402

---

## 📊 API Endpoints

All endpoints require USDC payment via x402. Payment is verified on-chain before returning data.

### Transaction History

```bash
GET /api/transfers?address=0x...&category=erc20

# Returns
{
  "payment": {
    "hash": "0xabc123...",
    "amount": "0.01",
    "currency": "USDC",
    "verified": true
  },
  "data": {
    "transfers": [
      {
        "blockNum": "0x163fcf9",
        "hash": "0x5a1882bb...",
        "from": "0xd8da6bf...",
        "to": "0x742d35cc...",
        "value": 1000000,
        "asset": "USDC",
        "category": "erc20"
      }
    ],
    "totalCount": 1523,
    "pageKey": "..."
  }
}
```

**Price:** $0.01 USDC
**Categories:** external, internal, erc20, erc721, erc1155

### NFT Ownership

```bash
GET /api/nfts?owner=0x...

# Returns NFTs owned by address
```

**Price:** $0.01 USDC
**Features:** Pagination, metadata, contract filtering

### NFT Metadata

```bash
GET /api/nfts/metadata?contractAddress=0x...&tokenId=1

# Returns single NFT metadata
```

**Price:** $0.005 USDC

### NFT Floor Price

```bash
GET /api/nfts/floor-price?contractAddress=0x...

# Returns collection floor price
```

**Price:** $0.005 USDC
**Source:** OpenSea, LooksRare

### Token Balances

```bash
GET /api/tokens/balances?address=0x...

# Returns all ERC20 token balances
```

**Price:** $0.01 USDC

### Token Metadata

```bash
GET /api/tokens/metadata?contractAddress=0x...

# Returns token info (name, symbol, decimals, logo)
```

**Price:** $0.005 USDC

### Webhooks

Create webhook subscriptions to get notified of new transactions:

```bash
# Create webhook
POST /api/webhooks
{
  "address": "0x...",
  "webhookUrl": "https://webhook.site/...",
  "categories": ["erc20", "erc721"]
}

# List webhooks
GET /api/webhooks

# Delete webhook
DELETE /api/webhooks/:id
```

**Price:** Free (no payment required for webhook management)
**Monitoring:** Server checks every 5 minutes for new transactions

---

## 🛠️ CLI Usage

Install globally:

```bash
npm install -g @asimfiles/vend-cli
```

Or use with npx:

```bash
npx @asimfiles/vend-cli --help
```

### Query Transaction History

```bash
# Table format (default)
vend query https://yourapi.com/api/transfers \
  --address 0xVitalik... \
  --tx-hash demo

# JSON format
vend query https://yourapi.com/api/transfers \
  --address 0xVitalik... \
  --format json

# CSV format (pipe to file)
vend query https://yourapi.com/api/transfers \
  --address 0xVitalik... \
  --format csv > transfers.csv
```

### Query NFTs

```bash
vend nfts https://yourapi.com/api/nfts \
  --owner 0xVitalik... \
  --tx-hash demo \
  --format table
```

### Query Token Balances

```bash
vend tokens https://yourapi.com/api/tokens/balances \
  --address 0xVitalik... \
  --tx-hash demo
```

### Automatic Payments

```bash
# Provide private key for automatic USDC payments
vend query https://yourapi.com/api/transfers \
  --address 0xVitalik... \
  --wallet 0xYourPrivateKey

# No manual payment needed! CLI sends USDC automatically
```

### Saved Queries

```bash
# Create a saved query
vend saved create whale-watch
# Interactive wizard prompts for details

# Run saved query
vend saved run whale-watch

# List saved queries
vend saved list

# Show query details
vend saved show whale-watch

# Delete query
vend saved delete whale-watch
```

### Webhooks

```bash
# Create webhook
vend webhook create https://yourapi.com/api/webhooks \
  --address 0xVitalik... \
  --notify https://webhook.site/your-webhook

# List webhooks
vend webhook list https://yourapi.com/api/webhooks

# Delete webhook
vend webhook delete https://yourapi.com/api/webhooks \
  --id wh_abc123
```

### All CLI Commands

| Command | Description |
|---------|-------------|
| `query` | Query transaction history |
| `nfts` | Query NFT ownership |
| `tokens` | Query token balances |
| `balance` | Get token balances (alias) |
| `info` | Get endpoint info (no payment) |
| `config` | Manage CLI configuration |
| `saved` | Manage saved queries |
| `webhook` | Manage webhooks |

Run `vend <command> --help` for detailed usage.

---

## 🚀 Deployment

> **✅ Production Ready!** Vend includes real on-chain USDC payment verification using [x402-onchain-verification](https://npmjs.com/package/x402-onchain-verification). Deploy to mainnet now!

📖 **[Complete Deployment Guide →](./DEPLOYMENT.md)**

The deployment guide includes:
- Testnet setup (Base Sepolia) for testing
- Mainnet configuration (Base, Ethereum, Polygon, etc.)
- Payment verification testing
- Security hardening
- Production checklist

### Quick Deploy Options

#### Railway

```bash
npm i -g @railway/cli
railway login
railway up  # Add env vars in dashboard
```

#### Render

1. Push to GitHub
2. Connect on [Render](https://render.com)
3. Add environment variables
4. Deploy!

#### Docker

```bash
docker build -t vend .
docker run -p 3000:3000 \
  -e ALCHEMY_API_KEY=your_key \
  -e PAYMENT_ADDRESS=0x... \
  -e PAYMENT_NETWORK=base-mainnet \
  -e NODE_ENV=production \
  vend
```

#### VPS (PM2)

```bash
npm i -g pm2
pm2 start src/index.js --name vend
pm2 save
pm2 startup
```

### Environment Configuration

**Development (Base Sepolia Testnet):**
```bash
PAYMENT_NETWORK=base-sepolia
NODE_ENV=development
```

**Production (Base Mainnet):**
```bash
PAYMENT_NETWORK=base-mainnet
NODE_ENV=production
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete configuration guide.

---

## 💰 Economics

### Development (Free)

- Alchemy: 300M compute units/month
- ~2M queries/month
- Cost: **$0**

### Production

| Queries/Day | Alchemy Cost | Revenue @ $0.01 | Profit |
|-------------|--------------|-----------------|--------|
| 1,000 | $49/mo | $300/mo | $251/mo |
| 10,000 | $199/mo | $3,000/mo | $2,801/mo |
| 100,000 | $499/mo | $30,000/mo | $29,501/mo |

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────┐
│                   Client                      │
│  (CLI, cURL, Browser, AI Agent)               │
└───────────────────┬──────────────────────────┘
                    │
              HTTP + x402
                    │
┌───────────────────┴──────────────────────────┐
│              Vend API Server                  │
│                                               │
│  ┌─────────────────────────────────────┐    │
│  │  x402 Payment Middleware            │    │
│  │  • Check for X-Payment-Hash header  │    │
│  │  • Verify USDC payment on-chain     │    │
│  │  • Parse Transfer events            │    │
│  │  • Validate amount & recipient      │    │
│  └─────────────────────────────────────┘    │
│                    │                          │
│  ┌─────────────────┴─────────────────┐      │
│  │  Express Routes                    │      │
│  │  • /api/transfers                  │      │
│  │  • /api/nfts                       │      │
│  │  • /api/tokens                     │      │
│  │  • /api/webhooks                   │      │
│  └────────────────────────────────────┘      │
└───────────────────┬──────────────────────────┘
                    │
           ┌────────┴─────────┐
           │                  │
    ┌──────┴──────┐    ┌──────┴──────┐
    │  Alchemy    │    │    Base     │
    │     SDK     │    │  Blockchain │
    │             │    │             │
    │  • NFTs     │    │ • Verify    │
    │  • Tokens   │    │   USDC      │
    │  • Transfers│    │   payments  │
    └─────────────┘    └─────────────┘
```

### Key Components

- **x402 Middleware** (`src/middleware/payment.js`) - Handles 402 responses and verification
- **USDC Verifier** (`packages/x402-onchain-verification`) - On-chain payment verification
- **Alchemy Service** (`src/services/alchemy.js`) - Blockchain data queries
- **Routes** (`src/routes/`) - API endpoint handlers
- **CLI** (`packages/vend-cli`) - Command-line interface

---

## 🔒 Security

- ✅ On-chain payment verification (no trust required)
- ✅ ERC20 Transfer event parsing
- ✅ Amount and recipient validation
- ✅ HTTPS support
- ✅ Rate limiting ready
- ✅ Input validation
- ✅ No private keys stored on server

---

## 📚 Documentation

- **[Getting Started](./docs/getting-started.md)** - Setup guide
- **[x402 Integration](./docs/x402-integration.md)** - Payment protocol deep dive
- **[Alchemy Guide](./docs/alchemy-guide.md)** - Advanced blockchain queries
- **[Deployment](./DEPLOYMENT.md)** - Go to production
- **[API Reference](./docs/api-reference.md)** - Complete endpoint documentation
- **[CLI Guide](./docs/cli-guide.md)** - Command-line usage
- **[Value Prop](./VALUE_PROPOSITION.md)** - Why Vend?

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

---

## 📝 License

MIT License - see [LICENSE](./LICENSE) for details.

---

## 🙏 Acknowledgments

- **Alchemy** - Blockchain infrastructure
- **Circle** - USDC stablecoin
- **Base** - L2 network for low-cost transactions
- **x402 Community** - HTTP payment protocol

---

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/yourrepo/vend/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourrepo/vend/discussions)
- **Twitter**: [@vend](https://twitter.com/vend)
- **Email**: support@vend.example.com

---

**Built with ❤️ by the Vend team**

Vend - Insert payment, get data. That's it. 🎰💰

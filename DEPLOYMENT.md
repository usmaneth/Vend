# 🚀 Vend Deployment Guide

Complete guide for deploying Vend to production with real USDC payments on Base.

---

## 📋 Prerequisites

- Node.js 18+ installed
- Alchemy API key ([get one free](https://dashboard.alchemy.com))
- Wallet address to receive USDC payments
- (Optional) Domain name with SSL certificate

---

## 🔧 Quick Start - Testnet (Base Sepolia)

### 1. Clone and Install

```bash
git clone https://github.com/yourusername/vend.git
cd vend
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and configure:

```bash
# Alchemy
ALCHEMY_API_KEY=your_alchemy_api_key_here
ALCHEMY_NETWORK=eth-mainnet  # Blockchain data source

# Payment Configuration (Base Sepolia Testnet)
PAYMENT_NETWORK=base-sepolia
PAYMENT_ADDRESS=0xYourWalletAddress
PAYMENT_PRICE_PER_QUERY=0.01

# Server
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
```

### 3. Get Test USDC

1. Get Base Sepolia ETH from [faucet](https://www.alchemy.com/faucets/base-sepolia)
2. Get test USDC from [Circle faucet](https://faucet.circle.com/)
   - USDC on Base Sepolia: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`

### 4. Start Server

```bash
npm start
```

Server runs at `http://localhost:3000`

### 5. Test with CLI

```bash
# Test with demo bypass
npm run cli query http://localhost:3000/api/transfers \
  --address 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045 \
  --tx-hash demo

# Test with real USDC payment
# 1. Send 0.01 USDC on Base Sepolia to your PAYMENT_ADDRESS
# 2. Copy the transaction hash from BaseScan
# 3. Use the real tx hash:

npm run cli query http://localhost:3000/api/transfers \
  --address 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045 \
  --tx-hash 0xYourRealTransactionHash
```

---

## 🌐 Production Deployment - Mainnet (Base)

### 1. Update Environment for Production

```bash
# .env
ALCHEMY_API_KEY=your_alchemy_api_key
ALCHEMY_NETWORK=eth-mainnet

# Switch to Base Mainnet for payments
PAYMENT_NETWORK=base-mainnet
PAYMENT_ADDRESS=0xYourProductionWalletAddress
PAYMENT_PRICE_PER_QUERY=0.01

# Production settings
PORT=3000
NODE_ENV=production
LOG_LEVEL=warn
```

**USDC Contract Addresses:**
- Base Mainnet: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- Base Sepolia: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`

### 2. Supported Networks

The payment verifier supports:

| Network | Mainnet | Testnet |
|---------|---------|---------|
| Base | `base-mainnet` | `base-sepolia` |
| Ethereum | `eth-mainnet` | `eth-sepolia` |
| Polygon | `polygon-mainnet` | `polygon-amoy` |
| Arbitrum | `arbitrum-mainnet` | `arbitrum-sepolia` |
| Optimism | `optimism-mainnet` | `optimism-sepolia` |

### 3. Deploy to Cloud

#### Option A: Railway

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

Add environment variables in Railway dashboard.

#### Option B: Render

1. Push to GitHub
2. Create new Web Service on [Render](https://render.com)
3. Connect repository
4. Set build command: `npm install`
5. Set start command: `npm start`
6. Add environment variables

#### Option C: DigitalOcean App Platform

1. Push to GitHub
2. Create new App on [DigitalOcean](https://www.digitalocean.com/products/app-platform)
3. Connect repository
4. Configure environment variables
5. Deploy

#### Option D: Docker

```dockerfile
# Dockerfile (already in project)
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

Deploy with Docker:
```bash
docker build -t vend .
docker run -p 3000:3000 --env-file .env vend
```

### 4. Setup SSL/HTTPS

#### Option 1: Use Cloudflare (Easiest)

1. Point domain to your server IP
2. Enable Cloudflare proxy (orange cloud)
3. SSL automatically enabled

#### Option 2: Let's Encrypt + Nginx

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d yourdomain.com

# Nginx config
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 5. Production Checklist

- [ ] `NODE_ENV=production` set
- [ ] `PAYMENT_NETWORK` set to mainnet (e.g., `base-mainnet`)
- [ ] `PAYMENT_ADDRESS` is your production wallet
- [ ] SSL/HTTPS enabled
- [ ] Rate limiting configured (see below)
- [ ] Monitoring setup (Sentry, Datadog, etc.)
- [ ] Database for webhooks (if using webhooks at scale)
- [ ] Backup strategy in place

---

## 🔒 Security Hardening

### 1. Add Rate Limiting

```bash
npm install express-rate-limit
```

Update `src/index.js`:
```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later.'
});

app.use('/api/', limiter);
```

### 2. Configure CORS

Update `src/index.js`:
```javascript
// Instead of: app.use(cors())
app.use(cors({
  origin: [
    'https://yourdomain.com',
    'https://www.yourdomain.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'DELETE']
}));
```

### 3. Input Validation

```bash
npm install joi
```

Example validation in routes:
```javascript
import Joi from 'joi';

const schema = Joi.object({
  address: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).required(),
  category: Joi.array().items(Joi.string().valid('external', 'internal', 'erc20', 'erc721')),
});

const { error, value } = schema.validate(req.query);
if (error) {
  return res.status(400).json({ error: error.details[0].message });
}
```

---

## 💰 Payment Flow

### How It Works

1. **Client requests data** → Server responds `402 Payment Required`
   ```json
   {
     "payment": {
       "amount": "0.01",
       "currency": "USDC",
       "network": "base-mainnet",
       "chainId": 8453,
       "recipient": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb2"
     }
   }
   ```

2. **Client sends USDC** on Base network to recipient address

3. **Client retries with tx hash** in `X-Payment-Hash` header

4. **Server verifies on-chain:**
   - Fetches transaction receipt via Alchemy
   - Verifies tx succeeded
   - Decodes USDC Transfer event
   - Checks recipient matches
   - Checks amount >= expected amount
   - Returns data if valid

### Verification Code Location

- Middleware: `src/middleware/payment.js`
- USDC Verifier: `packages/x402-onchain-verification/src/verifiers/usdc.js`
- Payment Logic: `packages/x402-onchain-verification/src/middleware.js`

### Demo Mode (Development Only)

In development (`NODE_ENV=development`), you can bypass payment with:
```bash
--tx-hash demo
```

**This is disabled in production** (`NODE_ENV=production`).

---

## 🧪 Testing Payment Verification

### Test on Base Sepolia

```bash
# 1. Set testnet config
PAYMENT_NETWORK=base-sepolia
PAYMENT_ADDRESS=0xYourAddress
NODE_ENV=development

# 2. Send 0.01 USDC on Base Sepolia
# USDC contract: 0x036CbD53842c5426634e7929541eC2318f3dCF7e
# Use MetaMask or send via ethers.js

# 3. Get tx hash from BaseScan Sepolia

# 4. Test API
curl -X GET "http://localhost:3000/api/transfers?address=0xVitalik..." \
  -H "X-Payment-Hash: 0xYourTxHash"

# 5. Check logs for verification
# Should see: "USDC payment verified successfully"
```

### Test on Base Mainnet

```bash
# 1. Update to mainnet
PAYMENT_NETWORK=base-mainnet
NODE_ENV=production

# 2. Send 0.01 USDC on Base mainnet
# USDC contract: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913

# 3. Test with real tx hash
npm run cli query https://yourapi.com/api/transfers \
  --address 0xVitalik... \
  --tx-hash 0xYourMainnetTxHash
```

---

## 📊 Monitoring

### Health Check

```bash
curl https://yourapi.com/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-30T17:30:00.000Z",
  "uptime": 12345
}
```

### Recommended Monitoring

1. **Error Tracking**: [Sentry](https://sentry.io)
2. **Uptime**: [UptimeRobot](https://uptimerobot.com)
3. **Logs**: [Datadog](https://www.datadoghq.com), [LogDNA](https://www.logdna.com)
4. **Metrics**: Track payment success rate, API latency

---

## 🐛 Troubleshooting

### Payment Not Verifying

**Issue**: `402 Payment Required` even after sending USDC

**Solutions**:
1. Check transaction succeeded on [BaseScan](https://basescan.org)
2. Verify correct network (Base Mainnet vs Sepolia)
3. Check USDC contract address matches network
4. Ensure amount >= expected (e.g., 0.01 USDC)
5. Verify recipient address matches `PAYMENT_ADDRESS`
6. Check server logs: `LOG_LEVEL=debug npm start`

### Transaction Not Found

**Issue**: `Transaction not found`

**Solutions**:
- Wait for transaction confirmation (15-30 seconds on Base)
- Check Alchemy API is configured for correct network
- Verify `ALCHEMY_API_KEY` is valid

### Wrong Network Error

**Issue**: `USDC contract not found for network`

**Solutions**:
- Check `PAYMENT_NETWORK` matches supported network
- Supported: `base-mainnet`, `base-sepolia`, `eth-mainnet`, etc.
- Verify spelling and case

---

## 💡 Advanced Configuration

### Custom USDC Contract

If using a different token:
```javascript
// src/middleware/payment.js
const verifier = createUSDCVerifier({
  alchemy: getPaymentAlchemy(),
  network: config.payment.network,
  usdcContract: '0xYourCustomTokenAddress',
  logger: x402Logger,
});
```

### Dynamic Pricing

```javascript
// src/routes/transfers.js
app.get('/api/premium',
  vendPaymentRequired({ price: '0.10' }), // Custom price
  handler
);
```

### Multiple Payment Tokens

Extend the verifier to support DAI, USDT, etc.:
```javascript
import { createERC20Verifier } from './custom-verifier.js';

const verifier = createERC20Verifier({
  tokenAddress: '0xDAIAddress',
  decimals: 18,
  // ...
});
```

---

## 📚 Additional Resources

- [Alchemy Documentation](https://docs.alchemy.com/)
- [Base Network Docs](https://docs.base.org/)
- [USDC on Base](https://www.circle.com/en/usdc-multichain/base)
- [x402 Protocol Spec](https://github.com/yourrepo/x402-spec)

---

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/yourrepo/vend/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourrepo/vend/discussions)
- **Security**: security@yourdomain.com

---

## ✅ Production Ready Checklist

Before going live:

- [ ] Real USDC tested on Base mainnet
- [ ] `NODE_ENV=production` (disables demo mode)
- [ ] SSL/HTTPS configured
- [ ] Rate limiting enabled
- [ ] CORS configured for your domain only
- [ ] Monitoring and error tracking setup
- [ ] Logs centralized (Datadog/LogDNA)
- [ ] Database for webhooks (if using)
- [ ] Backup strategy documented
- [ ] Load testing completed
- [ ] Security audit completed
- [ ] Documentation updated with your domain

**You're ready to vend! 🎰💰**

# Production Deployment Checklist

This guide shows exactly what you need to do to take Vend from development to production.

## ✅ What Already Works

- ✅ Complete API infrastructure (Express server)
- ✅ Alchemy integration (real blockchain data)
- ✅ x402 protocol implementation (402 responses, payment instructions)
- ✅ Query parameters (category, maxCount, fromBlock, etc.)
- ✅ Error handling and logging
- ✅ Tests
- ✅ Documentation
- ✅ Demo payment bypass (for development)

## ⚠️ What Needs to Be Implemented

### 1. Real Payment Verification (REQUIRED)

**Current state:** Placeholder that accepts "demo" in dev mode

**What to implement:** Query Base blockchain to verify USDC payments

**Time estimate:** 2-4 hours

**Implementation:**

```javascript
// src/middleware/payment.js

import { Alchemy, Network } from 'alchemy-sdk';
import { config } from '../config.js';
import { logger } from '../logger.js';

// Initialize Alchemy for Base network
const baseAlchemy = new Alchemy({
  apiKey: config.alchemy.apiKey,
  network: config.payment.network === 'base-mainnet'
    ? Network.BASE_MAINNET
    : Network.BASE_SEPOLIA,
});

// USDC contract address on Base
const USDC_ADDRESS = config.payment.network === 'base-mainnet'
  ? '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'  // Base mainnet
  : '0x036CbD53842c5426634e7929541eC2318f3dCF7e'; // Base Sepolia

// ERC20 Transfer event signature
const TRANSFER_EVENT = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

async function verifyPayment(paymentHash, expectedAmount) {
  try {
    logger.info({ paymentHash, expectedAmount }, 'Verifying payment');

    // Get transaction receipt
    const receipt = await baseAlchemy.core.getTransactionReceipt(paymentHash);

    if (!receipt) {
      logger.warn({ paymentHash }, 'Transaction not found');
      return false;
    }

    // Check transaction succeeded
    if (receipt.status !== 1) {
      logger.warn({ paymentHash, status: receipt.status }, 'Transaction failed');
      return false;
    }

    // Find USDC transfer event in logs
    const transferLog = receipt.logs.find(log =>
      log.address.toLowerCase() === USDC_ADDRESS.toLowerCase() &&
      log.topics[0] === TRANSFER_EVENT
    );

    if (!transferLog) {
      logger.warn({ paymentHash }, 'No USDC transfer found in transaction');
      return false;
    }

    // Decode transfer event
    // topics[1] = from address (padded)
    // topics[2] = to address (padded)
    // data = amount (uint256)
    const to = '0x' + transferLog.topics[2].slice(26);
    const amount = parseInt(transferLog.data, 16);

    // Verify recipient
    if (to.toLowerCase() !== config.payment.address.toLowerCase()) {
      logger.warn({
        paymentHash,
        expected: config.payment.address,
        received: to
      }, 'Payment sent to wrong address');
      return false;
    }

    // Verify amount (USDC has 6 decimals)
    const expectedWei = parseFloat(expectedAmount) * 1e6;
    if (amount < expectedWei) {
      logger.warn({
        paymentHash,
        expected: expectedWei,
        received: amount
      }, 'Insufficient payment amount');
      return false;
    }

    // All checks passed
    logger.info({
      paymentHash,
      to,
      amount: amount / 1e6
    }, 'Payment verified successfully');

    return true;

  } catch (error) {
    logger.error({ err: error, paymentHash }, 'Error verifying payment');
    return false;
  }
}
```

**Environment variables to add:**

```bash
# .env
# For mainnet:
PAYMENT_NETWORK=base-mainnet
USDC_CONTRACT=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913

# For testnet:
PAYMENT_NETWORK=base-sepolia
USDC_CONTRACT=0x036CbD53842c5426634e7929541eC2318f3dCF7e
```

### 2. Payment Caching (RECOMMENDED)

Avoid re-verifying the same payment:

```javascript
// src/middleware/payment.js

const paymentCache = new Map();
const CACHE_TTL = 3600000; // 1 hour

async function verifyPayment(paymentHash, expectedAmount) {
  // Check cache first
  if (paymentCache.has(paymentHash)) {
    logger.info({ paymentHash }, 'Payment found in cache');
    return paymentCache.get(paymentHash);
  }

  // Verify payment (code from above)
  const isValid = await verifyPaymentOnChain(paymentHash, expectedAmount);

  // Cache result
  if (isValid) {
    paymentCache.set(paymentHash, isValid);
    setTimeout(() => paymentCache.delete(paymentHash), CACHE_TTL);
  }

  return isValid;
}
```

### 3. Rate Limiting (RECOMMENDED)

Prevent abuse:

```bash
npm install express-rate-limit
```

```javascript
// src/index.js

import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window per IP
  message: {
    error: 'Too many requests',
    retryAfter: '15 minutes',
  },
});

app.use('/api/', limiter);
```

### 4. Production Configuration

Update `.env`:

```bash
NODE_ENV=production
ALCHEMY_API_KEY=your_production_key
ALCHEMY_NETWORK=eth-mainnet
PAYMENT_ADDRESS=your_production_wallet
PAYMENT_NETWORK=base-mainnet
PAYMENT_PRICE_PER_QUERY=0.01
LOG_LEVEL=info
```

### 5. Security Hardening

**Add Helmet for security headers:**

```bash
npm install helmet
```

```javascript
// src/index.js
import helmet from 'helmet';

app.use(helmet());
```

**Validate inputs:**

```javascript
import { ethers } from 'ethers';

function validateAddress(address) {
  if (!ethers.utils.isAddress(address)) {
    throw new Error('Invalid Ethereum address');
  }
}
```

## 🚀 Deployment Steps

### Option 1: Vercel (Easiest)

```bash
npm i -g vercel
vercel

# Set environment variables in Vercel dashboard
```

### Option 2: Docker

```bash
docker build -t vend .
docker run -p 3000:3000 \
  -e ALCHEMY_API_KEY=your_key \
  -e PAYMENT_ADDRESS=0x... \
  -e NODE_ENV=production \
  vend
```

### Option 3: VPS

```bash
# On your server
git clone https://github.com/yourusername/vend.git
cd vend
npm install --production

# Configure .env
nano .env

# Start with PM2
npm install -g pm2
pm2 start src/index.js --name vend
pm2 save
pm2 startup
```

## 🧪 Testing Production Setup

### 1. Test on Base Sepolia Testnet

```bash
# Get testnet USDC from faucet
# https://www.coinbase.com/faucets/base-ethereum-goerli-faucet

# Send 0.01 USDC to your PAYMENT_ADDRESS
# Copy transaction hash

# Test API
curl -H "X-Payment-Hash: YOUR_REAL_TX_HASH" \
  "https://your-domain.com/api/transfers?address=0xd8dA..."
```

### 2. Monitor Logs

```bash
# If using PM2
pm2 logs vend

# Look for:
# - "Payment verified successfully"
# - No errors in payment verification
```

### 3. Test Edge Cases

```bash
# Test with invalid payment hash
curl -H "X-Payment-Hash: 0xfakehash" \
  "https://your-domain.com/api/transfers?address=0x..."
# Should return 402

# Test with insufficient amount
# (send 0.005 USDC when 0.01 is required)
# Should return 402 Invalid Payment

# Test with wrong recipient
# (send to different address)
# Should return 402 Invalid Payment
```

## 📊 Monitoring

### Key Metrics to Track

1. **Payment Success Rate**
   - Goal: >99%
   - Alert if <95%

2. **Response Time**
   - Goal: <2s for queries
   - Alert if >5s

3. **Error Rate**
   - Goal: <1%
   - Alert if >5%

4. **Revenue**
   - Track USDC received
   - Monitor per day/week/month

### Logging

```javascript
// Log every successful payment
logger.info({
  paymentHash,
  amount,
  endpoint: req.path,
  timestamp: new Date().toISOString(),
}, 'Payment accepted');
```

## 💰 Cost Estimates

### Monthly Costs (1000 queries/day)

| Service | Cost |
|---------|------|
| Hosting (Vercel/Heroku) | $0-$25 |
| Alchemy API (Growth plan) | $49 |
| Domain name | $12/year |
| **Total** | **~$50-75/month** |

### Revenue Potential

- 1000 queries/day × $0.01 = $10/day
- Monthly: ~$300
- **Profit: ~$225-250/month**

Scale to 10,000 queries/day = ~$2,500/month profit

## ✅ Pre-Launch Checklist

- [ ] Payment verification implemented
- [ ] Tested on Base Sepolia testnet
- [ ] Payment caching implemented
- [ ] Rate limiting enabled
- [ ] Security headers (Helmet) added
- [ ] Input validation added
- [ ] Monitoring/logging configured
- [ ] Environment variables secured
- [ ] HTTPS/SSL configured
- [ ] Domain name configured
- [ ] Tested all query parameters
- [ ] Error handling tested
- [ ] Documentation updated
- [ ] GitHub repo public
- [ ] Demo video created
- [ ] Launch announcement ready

## 🎯 Launch Day

1. **Deploy to production**
   ```bash
   NODE_ENV=production npm start
   ```

2. **Test live**
   ```bash
   # Send real USDC payment
   # Test with real transaction hash
   ```

3. **Announce**
   - Post on X/Twitter
   - Post on r/ethereum
   - Post on Hacker News
   - Share in web3 Discord servers

4. **Monitor closely**
   - Watch logs for first 24 hours
   - Fix any issues immediately
   - Respond to user feedback

## 🐛 Common Issues

### Payment verification fails

**Check:**
- Is transaction confirmed? (wait 1-2 blocks)
- Correct USDC contract address?
- Correct network (Base mainnet vs Sepolia)?
- Amount correct? (remember 6 decimals)

### High response times

**Solutions:**
- Enable payment caching
- Upgrade Alchemy plan
- Add CDN (Cloudflare)
- Optimize database queries

### Running out of Alchemy credits

**Solutions:**
- Upgrade to higher tier
- Implement result caching
- Batch requests where possible

## 📚 Additional Resources

- [Alchemy Production Best Practices](https://docs.alchemy.com/docs/best-practices)
- [Base Network Docs](https://docs.base.org/)
- [x402 Specification](https://x402.org)
- [PM2 Documentation](https://pm2.keymetrics.io/)
- [Vercel Deployment Guide](https://vercel.com/docs)

---

**Estimated time to production:** 4-8 hours for an experienced developer

**Most time-consuming:** Implementing and testing payment verification (2-4 hours)

**After that:** You have a fully functional, monetized blockchain data API! 🚀

# Complete Setup Guide for TxPay

This guide walks you through setting up TxPay to actually work with real blockchain data.

## 🎯 What You Need

1. **Alchemy API Key** (free) - to fetch blockchain data
2. **Wallet Address** - to receive payments (can be any address for testing)
3. **Node.js v18+** - already installed if demo worked

---

## Step-by-Step Setup

### Step 1: Get Your Alchemy API Key (5 minutes)

1. **Go to Alchemy Dashboard**
   ```
   https://dashboard.alchemy.com/
   ```

2. **Sign Up / Log In**
   - Click "Sign Up" (free account)
   - Use email or GitHub

3. **Create an App**
   - Click "+ Create new app"
   - Choose:
     - **Name**: TxPay Test
     - **Chain**: Ethereum
     - **Network**: Ethereum Mainnet (or Sepolia for testnet)
   - Click "Create app"

4. **Copy Your API Key**
   - Click on your app name
   - Click "View key"
   - Copy the **API KEY** (looks like: `abc123xyz789...`)

   **Save this key - you'll need it in the next step!**

### Step 2: Configure Your Environment

Open the `.env` file and add your keys:

```bash
# Edit the .env file
nano .env
```

Or use your favorite editor (VS Code, Sublime, etc.)

**Add these values:**

```bash
# Alchemy Configuration (REQUIRED)
ALCHEMY_API_KEY=your_actual_api_key_here
ALCHEMY_NETWORK=eth-mainnet

# Payment Address (REQUIRED - can be any Ethereum address for testing)
PAYMENT_ADDRESS=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb

# Optional Settings
PORT=3000
NODE_ENV=development
PAYMENT_NETWORK=base-sepolia
PAYMENT_PRICE_PER_QUERY=0.01
LOG_LEVEL=info
```

**Example filled in:**
```bash
ALCHEMY_API_KEY=oKxs-03sij-U_dn0QwcW-jJQGY6H
ALCHEMY_NETWORK=eth-mainnet
PAYMENT_ADDRESS=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
```

Save the file!

### Step 3: Install Dependencies

```bash
npm install
```

This installs:
- `express` - web server
- `alchemy-sdk` - blockchain queries
- `pino` - logging
- All other dependencies

### Step 4: Start the Server

```bash
npm run dev
```

You should see:
```
INFO: Configuration validated successfully
INFO: Alchemy SDK initialized network=eth-mainnet
INFO: TxPay server started port=3000
```

**The server is now running!** 🎉

---

## 🧪 Testing the Live API

### Test 1: Health Check

```bash
curl http://localhost:3000/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-15T12:00:00.000Z",
  "uptime": 5.234
}
```

✅ If you see this, the server is running!

### Test 2: API Info

```bash
curl http://localhost:3000/
```

**Expected Response:**
```json
{
  "name": "TxPay API",
  "version": "1.0.0",
  "description": "Monetized Transaction History API using x402 and Alchemy",
  "endpoints": {
    "health": "GET /health",
    "transfers": "GET /api/transfers"
  }
}
```

### Test 3: Try Without Payment (Should Fail)

```bash
curl "http://localhost:3000/api/transfers?address=0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
```

**Expected Response: 402 Payment Required**
```json
{
  "error": "Payment Required",
  "status": 402,
  "protocol": "x402",
  "payment": {
    "recipient": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "amount": "0.01",
    "currency": "USDC",
    "network": "base-sepolia",
    "chainId": 84532
  },
  "instructions": {
    "message": "Send payment to access blockchain transaction data",
    "steps": [...]
  }
}
```

✅ This is correct! Payment is required.

### Test 4: Use Demo Payment Bypass (Development Only)

In development mode, you can bypass payment with a magic header:

```bash
curl -H "X-Payment-Hash: demo" \
  "http://localhost:3000/api/transfers?address=0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045&maxCount=5"
```

**Expected Response: Real Blockchain Data!**
```json
{
  "success": true,
  "data": {
    "transfers": [
      {
        "blockNum": "0x...",
        "hash": "0x...",
        "from": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
        "to": "0x...",
        "value": 1.234,
        "asset": "ETH",
        "category": "external",
        "metadata": {
          "blockTimestamp": "2025-01-15T10:30:00.000Z"
        }
      },
      // ... more transfers
    ],
    "totalCount": 5
  },
  "payment": {
    "hash": "demo",
    "verified": true
  }
}
```

✅ **This is REAL data from Alchemy!** Your API is working!

---

## 🔍 How the Flow Actually Works

### Development Flow (What You Just Did)

```
┌─────────┐                    ┌─────────┐                    ┌─────────┐
│         │  1. Request with   │         │  2. Query Alchemy  │         │
│ Client  │     demo header    │  TxPay  │ ──────────────────>│ Alchemy │
│         │ ──────────────────>│   API   │                    │   API   │
│  (curl) │                    │         │  3. Return data    │         │
│         │  4. Return data    │         │ <──────────────────│         │
│         │ <──────────────────│         │                    │         │
└─────────┘                    └─────────┘                    └─────────┘
```

**What happens:**
1. You send request with `X-Payment-Hash: demo`
2. TxPay sees "demo" and skips payment verification (dev mode only!)
3. TxPay queries Alchemy API with your key
4. Alchemy returns real blockchain data
5. TxPay returns data to you

### Production Flow (How It's Meant to Work)

```
┌─────────┐                    ┌─────────┐                    ┌─────────┐
│         │  1. Request data   │         │                    │         │
│ Client  │ ──────────────────>│  TxPay  │                    │ Alchemy │
│         │                    │   API   │                    │   API   │
│         │  2. 402 Payment    │         │                    │         │
│         │     Required       │         │                    │         │
│         │ <──────────────────│         │                    │         │
│         │                    │         │                    │         │
│         │  3. Send USDC      │         │                    │         │
│         │     on Base        │         │                    │         │
│         │     (on-chain tx)  │         │                    │         │
│         │ ───────────────────┼────────>│                    │         │
│         │                    │         │                    │         │
│         │  4. Request with   │         │                    │         │
│         │     payment hash   │         │                    │         │
│         │ ──────────────────>│         │                    │         │
│         │                    │         │  5. Verify payment │         │
│         │                    │         │     on Base        │         │
│         │                    │         │                    │         │
│         │                    │         │  6. Query data     │         │
│         │                    │         │ ──────────────────>│         │
│         │                    │         │  7. Return data    │         │
│         │                    │         │ <──────────────────│         │
│         │  8. Return data    │         │                    │         │
│         │ <──────────────────│         │                    │         │
└─────────┘                    └─────────┘                    └─────────┘
```

**What happens in production:**
1. Client requests data (no payment yet)
2. TxPay returns 402 with payment instructions
3. Client sends 0.01 USDC on Base network
4. Client retries request with transaction hash
5. TxPay verifies payment on Base blockchain
6. TxPay queries Alchemy for blockchain data
7. Alchemy returns transaction history
8. TxPay returns data to client

---

## 🧩 Understanding the Components

### Your Alchemy Key
- **What it does**: Lets TxPay query blockchain data
- **Where it's used**: Server-side only (never exposed to clients)
- **Cost**: Free tier = 300M compute units/month (~2M queries)
- **Security**: Keep it in `.env`, never commit to Git

### Payment Address
- **What it is**: Ethereum address where you receive USDC payments
- **For testing**: Can be any address (even one you don't own)
- **For production**: Use your actual wallet address

### Demo Payment Bypass
- **What**: Magic header `X-Payment-Hash: demo` skips payment
- **When**: Only works in `NODE_ENV=development`
- **Why**: Lets you test without sending real payments
- **Security**: Automatically disabled in production

---

## 📊 Example Queries You Can Try

### Get All Transfers for an Address

```bash
curl -H "X-Payment-Hash: demo" \
  "http://localhost:3000/api/transfers?address=0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
```

**Try these famous addresses:**
- Vitalik: `0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045`
- USDC Contract: `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48`
- ENS: `0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85`

### Get Only ERC20 Token Transfers

```bash
curl -H "X-Payment-Hash: demo" \
  "http://localhost:3000/api/transfers?address=0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045&category=erc20"
```

### Get Only NFT Transfers

```bash
curl -H "X-Payment-Hash: demo" \
  "http://localhost:3000/api/transfers?address=0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045&category=erc721,erc1155"
```

### Limit Results

```bash
curl -H "X-Payment-Hash: demo" \
  "http://localhost:3000/api/transfers?address=0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045&maxCount=10"
```

### Get Transfers from Specific Block Range

```bash
curl -H "X-Payment-Hash: demo" \
  "http://localhost:3000/api/transfers?address=0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045&fromBlock=0x1000000&toBlock=latest"
```

---

## 🐛 Troubleshooting

### "Configuration validation failed"

**Problem:** Missing Alchemy API key or payment address

**Solution:**
```bash
# Check your .env file
cat .env

# Make sure these are set:
# ALCHEMY_API_KEY=your_actual_key
# PAYMENT_ADDRESS=0x...
```

### "Cannot find module" errors

**Problem:** Dependencies not installed

**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### "Port 3000 already in use"

**Problem:** Another app is using port 3000

**Solution:**
```bash
# Option 1: Change port in .env
echo "PORT=3001" >> .env

# Option 2: Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### API returns empty transfers array

**Possible reasons:**
1. Address has no transactions
2. Network mismatch (check `ALCHEMY_NETWORK`)
3. Block range too narrow

**Solution:** Try Vitalik's address (known to have transactions):
```bash
curl -H "X-Payment-Hash: demo" \
  "http://localhost:3000/api/transfers?address=0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045&maxCount=5"
```

### Alchemy rate limit exceeded

**Problem:** Too many requests

**Solution:**
- Alchemy free tier: 330 CU/second
- Upgrade to paid plan
- Add caching (see docs/alchemy-guide.md)

---

## 🚀 Next Steps

### For Development
1. ✅ You're all set! Keep using demo payment bypass
2. Read `docs/alchemy-guide.md` for advanced queries
3. Add new endpoints (see `CLAUDE.md`)

### For Production
1. Implement real payment verification (see `src/middleware/payment.js`)
2. Set `NODE_ENV=production` (disables demo bypass)
3. Deploy to Vercel/Heroku (see `docs/deployment.md`)
4. Get USDC on Base for real payments

---

## 📚 Additional Resources

- **Full Documentation**: `./docs/`
- **Getting Started**: `./docs/getting-started.md`
- **x402 Protocol**: `./docs/x402-integration.md`
- **Deployment**: `./docs/deployment.md`
- **Code Reference**: `./CLAUDE.md`

---

## ✅ Quick Checklist

- [ ] Got Alchemy API key from dashboard.alchemy.com
- [ ] Added key to `.env` file
- [ ] Added payment address to `.env`
- [ ] Ran `npm install`
- [ ] Started server with `npm run dev`
- [ ] Tested with `curl http://localhost:3000/health`
- [ ] Tried demo payment: `curl -H "X-Payment-Hash: demo" "http://localhost:3000/api/transfers?address=0xd8dA..."`
- [ ] Saw real blockchain data returned!

**You're ready to build!** 🎉

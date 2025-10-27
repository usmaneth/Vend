# 🚀 START HERE

Welcome to TxPay! Here's the fastest way to get started:

## Option 1: Watch the Demo (No Setup Required!) 🎬

See TxPay in action with our visual terminal demo:

```bash
npm run demo
```

**Features:**
- 🎨 Animated payment flow walkthrough
- 📊 Sample blockchain transaction data
- 💡 Interactive x402 protocol explanation
- 🎭 Color-coded terminal graphics
- ⚡ No API keys or configuration needed!

## Option 2: Run the Live API 🔥

Get the actual API running in 3 steps:

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Get an Alchemy API Key
1. Visit https://dashboard.alchemy.com/
2. Sign up (free)
3. Create an app
4. Copy your API key

### Step 3: Configure and Run
```bash
# Edit .env file and add your keys
nano .env

# Or use this one-liner:
# ALCHEMY_API_KEY=your_key_here PAYMENT_ADDRESS=0xYourAddress npm run dev
```

Then start the server:
```bash
npm run dev
```

### Test It:
```bash
# Health check
curl http://localhost:3000/health

# Try transfers endpoint with demo payment
curl -H "X-Payment-Hash: demo" \
  "http://localhost:3000/api/transfers?address=0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045&maxCount=5"
```

## What You Can Do

### 🎯 Demo Mode
- `npm run demo` - Interactive terminal showcase
- No configuration needed
- Perfect for presentations!

### 🔨 Development Mode
- `npm run dev` - Start with auto-reload
- Uses demo payment bypass
- Hot-reload on file changes

### 🧪 Testing
- `npm test` - Run all tests
- `npm test:watch` - Watch mode

### 📚 Learn More
- [Getting Started Guide](./docs/getting-started.md)
- [x402 Payment Protocol](./docs/x402-integration.md)
- [Alchemy API Guide](./docs/alchemy-guide.md)
- [Deployment Guide](./docs/deployment.md)

## Quick Examples

### Query Transaction History
```bash
curl -H "X-Payment-Hash: demo" \
  "http://localhost:3000/api/transfers?address=0xYourAddress"
```

### Get ERC20 Transfers Only
```bash
curl -H "X-Payment-Hash: demo" \
  "http://localhost:3000/api/transfers?address=0xYourAddress&category=erc20"
```

### Paginated Results
```bash
curl -H "X-Payment-Hash: demo" \
  "http://localhost:3000/api/transfers?address=0xYourAddress&maxCount=10"
```

## Project Structure

```
txpay/
├── demo.js              # 🎬 Interactive demo (start here!)
├── src/
│   ├── index.js         # Express server
│   ├── routes/          # API endpoints
│   ├── services/        # Alchemy integration
│   └── middleware/      # Payment verification
├── docs/                # Comprehensive guides
└── tests/               # Test suite
```

## Need Help?

- 📖 Documentation: `./docs/`
- 🐛 Issues: GitHub Issues
- 💬 Questions: GitHub Discussions

---

**Ready?** Run `npm run demo` to see TxPay in action! 🚀

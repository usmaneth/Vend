# Getting Started with Vend

This guide will help you set up and run Vend locally, make your first query, and understand the payment flow.

## Prerequisites

Before you begin, ensure you have:

- **Node.js v18+** - [Download here](https://nodejs.org/)
- **Alchemy API Key** - [Sign up free](https://dashboard.alchemy.com/)
- **Wallet with USDC** (for production) - MetaMask or similar
- **Git** - For cloning the repository

## Step 1: Installation

Clone the repository and install dependencies:

```bash
# Clone Vend
git clone https://github.com/yourusername/vend.git
cd vend

# Install dependencies
npm install
```

## Step 2: Configuration

Create your environment configuration:

```bash
# Copy the example environment file
cp .env.example .env

# Edit with your favorite editor
nano .env
```

Update the following values in `.env`:

```bash
# Required: Get from https://dashboard.alchemy.com/
ALCHEMY_API_KEY=your_alchemy_api_key_here

# Required: Your wallet address to receive payments
PAYMENT_ADDRESS=0xYourWalletAddressHere

# Optional: Network to query (default: eth-mainnet)
ALCHEMY_NETWORK=eth-mainnet

# Optional: Payment network (default: base-sepolia for testing)
PAYMENT_NETWORK=base-sepolia

# Optional: Price per query in USD (default: 0.01)
PAYMENT_PRICE_PER_QUERY=0.01
```

### Getting an Alchemy API Key

1. Visit [dashboard.alchemy.com](https://dashboard.alchemy.com/)
2. Sign up or log in
3. Click "Create App"
4. Choose your network (e.g., Ethereum Mainnet)
5. Copy the API key from your app dashboard

## Step 3: Start the Server

```bash
# Production mode
npm start

# Development mode (with auto-reload)
npm run dev
```

You should see:

```
INFO: Configuration validated successfully
INFO: Alchemy SDK initialized
INFO: Vend server started on port 3000
```

## Step 4: Test the API

### Check Health Status

```bash
curl http://localhost:3000/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-15T12:00:00Z",
  "uptime": 45.2
}
```

### Get API Information

```bash
curl http://localhost:3000/
```

Response:
```json
{
  "name": "Vend API",
  "version": "1.0.0",
  "description": "Monetized Transaction History API using x402 and Alchemy",
  "endpoints": {
    "health": "GET /health",
    "transfers": "GET /api/transfers"
  }
}
```

### Test Transfers Endpoint (No Payment)

```bash
curl "http://localhost:3000/api/transfers?address=0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
```

Response (402 Payment Required):
```json
{
  "error": "Payment Required",
  "status": 402,
  "protocol": "x402",
  "payment": {
    "recipient": "0xYourAddress...",
    "amount": "0.01",
    "currency": "USDC",
    "network": "base-sepolia"
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

### Test with Demo Payment (Development Only)

In development mode, you can use a demo payment:

```bash
curl -H "X-Payment-Hash: demo" \
  "http://localhost:3000/api/transfers?address=0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045&maxCount=5"
```

Response (Success):
```json
{
  "success": true,
  "data": {
    "transfers": [
      {
        "blockNum": "0x123abc",
        "hash": "0xdef456...",
        "from": "0xabc...",
        "to": "0xdef...",
        "value": 1.5,
        "asset": "ETH",
        "category": "external"
      }
    ],
    "totalCount": 5
  },
  "payment": {
    "hash": "demo",
    "verified": true
  }
}
```

## Step 5: Understanding the Payment Flow

### x402 Protocol Overview

Vend uses the x402 protocol for HTTP-based micropayments:

1. **Client** requests protected resource
2. **Server** returns `402 Payment Required` with payment details
3. **Client** sends USDC on Base network
4. **Client** retries with `X-Payment-Hash` header
5. **Server** verifies payment and returns data

### Payment Flow Diagram

```
┌─────────────┐                    ┌─────────────┐
│   Client    │                    │   Vend     │
└──────┬──────┘                    └──────┬──────┘
       │                                   │
       │  GET /api/transfers?address=0x... │
       │──────────────────────────────────>│
       │                                   │
       │  402 Payment Required             │
       │  {recipient, amount, network}     │
       │<──────────────────────────────────│
       │                                   │
       │  [User sends USDC payment]        │
       │                                   │
       │  GET /api/transfers               │
       │  Header: X-Payment-Hash: 0xabc... │
       │──────────────────────────────────>│
       │                                   │
       │  [Server verifies payment]        │
       │  [Server queries Alchemy]         │
       │                                   │
       │  200 OK                           │
       │  {transfers: [...]}               │
       │<──────────────────────────────────│
       │                                   │
```

## Step 6: Making Real Payments (Production)

To use Vend in production with real payments:

### 1. Get USDC on Base Network

- Bridge USDC to Base using [bridge.base.org](https://bridge.base.org)
- Or buy USDC directly on Base

### 2. Send Payment

Use your wallet to send USDC to the payment address:

- **Recipient**: Address from `402` response
- **Amount**: Exact amount specified (e.g., 0.01 USDC)
- **Network**: Base (mainnet or testnet)
- **Token**: USDC

### 3. Get Transaction Hash

After sending, copy the transaction hash (e.g., `0xabc123...`)

### 4. Make Request with Payment Proof

```bash
curl -H "X-Payment-Hash: 0xYourTransactionHash" \
  "https://api.vend.xyz/api/transfers?address=0x..."
```

## Query Examples

### Get All Transfers for Address

```bash
curl -H "X-Payment-Hash: demo" \
  "http://localhost:3000/api/transfers?address=0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
```

### Get Only ERC20 Token Transfers

```bash
curl -H "X-Payment-Hash: demo" \
  "http://localhost:3000/api/transfers?address=0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045&category=erc20"
```

### Get Transfers from Specific Address

```bash
curl -H "X-Payment-Hash: demo" \
  "http://localhost:3000/api/transfers?fromAddress=0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
```

### Limit Results

```bash
curl -H "X-Payment-Hash: demo" \
  "http://localhost:3000/api/transfers?address=0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045&maxCount=10"
```

### Filter by Token Contract

```bash
curl -H "X-Payment-Hash: demo" \
  "http://localhost:3000/api/transfers?address=0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045&contractAddresses=0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
```

## Troubleshooting

### "Configuration validation failed"

- Check that `ALCHEMY_API_KEY` is set in `.env`
- Verify `PAYMENT_ADDRESS` is a valid Ethereum address

### "Cannot find module"

```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Port Already in Use

Change the port in `.env`:
```bash
PORT=3001
```

### Alchemy API Errors

- Verify your API key is correct
- Check network name matches your Alchemy app
- Ensure you haven't exceeded rate limits

## Next Steps

- [x402 Integration Guide](./x402-integration.md) - Deep dive into payments
- [Alchemy API Guide](./alchemy-guide.md) - Advanced querying
- [Deployment Guide](./deployment.md) - Deploy to production

## Resources

- [Alchemy Documentation](https://docs.alchemy.com/)
- [x402 Protocol Spec](https://x402.org)
- [Base Network Docs](https://docs.base.org/)

---

Need help? [Open an issue](https://github.com/yourusername/vend/issues) or check [Discussions](https://github.com/yourusername/vend/discussions)

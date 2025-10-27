# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Vend - Monetized Transaction History API using x402 and Alchemy**

Vend is an open-source blockchain data vending machine that enables pay-per-query access to blockchain data:
- **x402 protocol** - HTTP-based micropayments (USDC on Base) with 402 Payment Required status
- **Alchemy SDK** - Fast, reliable blockchain data across multiple chains
- **Express.js** - Payment-gated REST API backend
- **Vending machine model** - Insert payment → Get data instantly (no accounts, no API keys)

## Common Commands

### Development
```bash
npm install                  # Install dependencies
npm run dev                 # Start with auto-reload (development mode)
npm start                   # Start production server
```

### Testing
```bash
npm test                    # Run all tests
npm test:watch             # Run tests in watch mode
npm test -- --coverage     # Run tests with coverage
```

### Environment Setup
```bash
cp .env.example .env       # Copy environment template
# Edit .env with your Alchemy API key and payment address
```

### Running a Single Test
```bash
npm test -- tests/api.test.js                    # Run specific test file
npm test -- -t "health"                          # Run tests matching pattern
```

## High-Level Architecture

### Request Flow
1. Client requests `/api/transfers` → Server responds `402 Payment Required`
2. Client sends USDC payment on Base network
3. Client retries request with `X-Payment-Hash` header containing transaction hash
4. Server verifies payment → Queries Alchemy → Returns blockchain data

### Core Components

**Payment Middleware** (`src/middleware/payment.js`)
- Implements x402 protocol
- Returns 402 with payment instructions if no payment proof
- Verifies payment on-chain (currently placeholder - needs production implementation)
- Attaches payment info to `req.payment` for successful verifications

**Alchemy Service** (`src/services/alchemy.js`)
- Wraps Alchemy SDK for asset transfers, token balances, and metadata
- Handles pagination, network mapping, and error handling
- Main functions: `getAssetTransfers()`, `getTokenBalances()`, `getTokenMetadata()`

**Routes** (`src/routes/`)
- `transfers.js`: Main API endpoint for transaction history with payment gating
- Validates query parameters (address, category, fromBlock, toBlock, etc.)
- Returns paginated results with payment and pagination metadata

**Configuration** (`src/config.js`)
- Loads environment variables via dotenv
- Validates required config on startup (ALCHEMY_API_KEY, PAYMENT_ADDRESS)
- Provides typed config object for app

**Error Handling** (`src/middleware/errorHandler.js`)
- Global error handler catches all unhandled errors
- Returns structured JSON error responses
- Includes stack traces in development only

### Important Implementation Details

**Payment Verification Status**
- Current implementation includes a **placeholder** payment verification
- Development mode accepts `X-Payment-Hash: demo` for testing
- **Production requires implementing real on-chain verification** - see `src/middleware/payment.js` TODOs
- Future implementation should query Base network for USDC transfers and verify:
  - Transaction exists and succeeded
  - Recipient matches `PAYMENT_ADDRESS`
  - Amount matches or exceeds `PAYMENT_PRICE_PER_QUERY`

**Network Configuration**
- Alchemy network set via `ALCHEMY_NETWORK` env var (eth-mainnet, polygon-mainnet, base-mainnet, etc.)
- Payment network set via `PAYMENT_NETWORK` (base-sepolia for testnet, base-mainnet for production)
- Network mapping in `src/services/alchemy.js` converts config names to Alchemy SDK Network constants

**Pagination**
- Alchemy limits responses to 1000 transfers per request
- Use `pageKey` from response for subsequent requests
- Page keys expire after 10 minutes
- Vend passes through Alchemy's pagination transparently

**Transfer Categories**
- `external`: ETH transfers between EOAs
- `internal`: ETH transfers from smart contracts
- `erc20`: ERC-20 token transfers
- `erc721`: NFT transfers
- `erc1155`: Multi-token standard transfers
- `specialnft`: Special NFT collections like CryptoPunks

## Environment Variables

Required:
- `ALCHEMY_API_KEY` - Alchemy API key from dashboard.alchemy.com
- `PAYMENT_ADDRESS` - Ethereum address to receive payments

Optional:
- `PORT` - Server port (default: 3000)
- `ALCHEMY_NETWORK` - Network to query (default: eth-mainnet)
- `PAYMENT_NETWORK` - Payment network (default: base-sepolia)
- `PAYMENT_PRICE_PER_QUERY` - Price in USD (default: 0.01)
- `LOG_LEVEL` - Pino log level (default: info)
- `NODE_ENV` - Environment (development/production)

## Project Structure Logic

```
src/
├── index.js              # Express app setup, routes registration, server startup
├── config.js             # Environment configuration and validation
├── logger.js             # Pino logger configuration
├── middleware/
│   ├── payment.js        # x402 payment verification (NEEDS PRODUCTION IMPL)
│   └── errorHandler.js   # Global error handling
├── routes/
│   └── transfers.js      # Transaction history endpoint
└── services/
    └── alchemy.js        # Alchemy SDK wrapper
```

**Why this structure?**
- Middleware handles cross-cutting concerns (payments, errors)
- Services abstract external APIs (Alchemy)
- Routes contain endpoint logic and validation
- Config centralized for easy testing and environment switching

## Adding New Features

### Adding a New API Endpoint

1. Create route file in `src/routes/` (e.g., `balances.js`)
2. Implement service logic in `src/services/` if needed
3. Apply `paymentRequired()` middleware with appropriate price
4. Register route in `src/index.js`: `app.use('/api/balances', balancesRouter)`
5. Add tests in `tests/`
6. Update README.md with endpoint documentation

### Implementing Real Payment Verification

The critical TODO is in `src/middleware/payment.js`:
- Query Base network via Alchemy or ethers.js for transaction by hash
- Verify transaction receipt status is successful
- Parse USDC transfer event from logs (ERC20 Transfer event)
- Validate recipient address matches `config.payment.address`
- Validate amount is >= `expectedAmount`
- Consider using x402 facilitator API for verification instead

### Adding Multi-Chain Support

- Add network to `NETWORK_MAP` in `src/services/alchemy.js`
- Update `.env.example` with new network options
- Test with network-specific addresses
- Document in README and tutorials

## Key Dependencies

- `express` - Web framework
- `alchemy-sdk` - Blockchain data queries
- `pino` / `pino-pretty` - Structured logging
- `dotenv` - Environment configuration
- `cors` - CORS handling
- `jest` + `supertest` - Testing

## Gotchas and Common Issues

**Payment verification is not implemented for production**
- The current `verifyPayment()` function is a placeholder
- Only accepts `demo` hash in development mode
- Must implement blockchain query before production use

**x402-express package doesn't exist**
- Custom implementation provided in `src/middleware/payment.js`
- Based on x402 protocol specification
- Can be replaced with official package when available

**Demo mode bypass**
- Development mode allows `X-Payment-Hash: demo` to skip payment
- Controlled by `NODE_ENV=development` check
- Never enable in production

**Alchemy rate limits**
- Free tier: 300M compute units/month
- `getAssetTransfers` costs ~150 CU per call
- Monitor usage at dashboard.alchemy.com
- Implement caching for high-traffic scenarios

**Page key expiration**
- Alchemy pagination keys expire after 10 minutes
- If pageKey fails, restart pagination from beginning
- Consider caching full result sets for expensive queries

## Testing Notes

Tests use Jest with ES modules (note `--experimental-vm-modules` in package.json scripts).

**Test structure:**
- `tests/api.test.js` - API endpoint tests with supertest
- `tests/payment.test.js` - Payment middleware unit tests

**Running tests:**
- Requires `ALCHEMY_API_KEY` in `.env` for integration tests
- Some tests skip if API key not configured
- Use `demo` payment hash to bypass payment in tests

**Mocking:**
- Mock Alchemy SDK in tests to avoid API calls
- Mock payment verification for deterministic tests

## Documentation

Comprehensive guides in `/docs`:
- `getting-started.md` - Setup and first query
- `x402-integration.md` - Payment protocol deep dive
- `alchemy-guide.md` - Advanced blockchain queries
- `deployment.md` - Production deployment options

## Extending Vend

Common extension points:
1. **Additional endpoints** - Token balances, NFT metadata, gas estimates
2. **Caching** - Redis for payment verification and query results
3. **Database** - PostgreSQL for payment records and analytics
4. **WebSockets** - Real-time transaction notifications
5. **GraphQL** - Alternative API interface
6. **Multi-token payments** - Accept ETH, other tokens besides USDC
7. **Subscription model** - Monthly access instead of per-query

## Production Readiness Checklist

Before deploying to production:
- [ ] Implement real payment verification (blockchain query)
- [ ] Set `NODE_ENV=production`
- [ ] Use Alchemy paid plan for higher limits
- [ ] Enable HTTPS/SSL
- [ ] Add rate limiting
- [ ] Setup monitoring (Sentry, LogDNA, etc.)
- [ ] Configure CORS for specific domains
- [ ] Add request validation and sanitization
- [ ] Implement payment caching to avoid re-verification
- [ ] Setup backup and disaster recovery
- [ ] Document API for users
- [ ] Test payment flow on Base mainnet with real USDC

## Resources

- [Alchemy Documentation](https://docs.alchemy.com/)
- [x402 Protocol](https://x402.org)
- [Base Network](https://docs.base.org/)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)

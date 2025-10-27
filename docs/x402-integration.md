# x402 Payment Integration Guide

This guide explains how Vend implements the x402 protocol for HTTP-based micropayments and how to extend it.

## What is x402?

x402 is an open protocol that enables instant, fee-free payments over HTTP using the `402 Payment Required` status code. Key features:

- **No accounts required** - Direct wallet-to-wallet payments
- **Instant settlement** - 2-second payment verification
- **No protocol fees** - Only network gas fees
- **Blockchain agnostic** - Works with any EVM chain
- **Machine-friendly** - Perfect for AI agents and APIs

[Read the x402 Whitepaper](https://x402.org)

## How x402 Works

### Standard HTTP Flow

```
Client                          Server
   │                               │
   │  GET /protected/resource      │
   │─────────────────────────────> │
   │                               │
   │  200 OK                       │
   │  {data}                       │
   │ <───────────────────────────── │
```

### x402 Payment Flow

```
Client                          Server
   │                               │
   │  GET /protected/resource      │
   │─────────────────────────────> │
   │                               │
   │  402 Payment Required         │
   │  {payment_instructions}       │
   │ <───────────────────────────── │
   │                               │
   │  [Send payment on-chain]      │
   │                               │
   │  GET /protected/resource      │
   │  X-Payment-Hash: 0x...        │
   │─────────────────────────────> │
   │                               │
   │  [Verify payment]             │
   │                               │
   │  200 OK                       │
   │  {data}                       │
   │ <───────────────────────────── │
```

## Vend's x402 Implementation

### Payment Middleware

Located in `src/middleware/payment.js`:

```javascript
import { paymentRequired } from './middleware/payment.js';

// Protect endpoint with payment
router.get('/api/transfers',
  paymentRequired({ price: '0.01' }),
  async (req, res) => {
    // Handle request
  }
);
```

### Payment Instructions Format

When payment is required, Vend returns:

```json
{
  "error": "Payment Required",
  "status": 402,
  "protocol": "x402",
  "version": "1.0",
  "payment": {
    "recipient": "0xYourWalletAddress",
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
  "facilitator": {
    "url": "https://x402.coinbase.com",
    "verification": "auto"
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

## Payment Verification

### Current Implementation (Demo)

The MVP includes a placeholder verification:

```javascript
async function verifyPayment(paymentHash, expectedAmount) {
  // Demo mode for development
  if (process.env.NODE_ENV === 'development' && paymentHash === 'demo') {
    return true;
  }

  // TODO: Implement real verification
  return false;
}
```

### Production Implementation

For production, implement real blockchain verification:

```javascript
import { Alchemy, Network } from 'alchemy-sdk';

async function verifyPayment(paymentHash, expectedAmount) {
  try {
    // Initialize Alchemy for Base network
    const alchemy = new Alchemy({
      apiKey: config.alchemy.apiKey,
      network: Network.BASE_MAINNET, // or BASE_SEPOLIA
    });

    // Get transaction receipt
    const receipt = await alchemy.core.getTransactionReceipt(paymentHash);

    if (!receipt) {
      throw new Error('Transaction not found');
    }

    // Verify transaction succeeded
    if (receipt.status !== 1) {
      throw new Error('Transaction failed');
    }

    // Decode USDC transfer from logs
    const usdcTransfer = parseUSDCTransfer(receipt.logs);

    // Verify recipient
    if (usdcTransfer.to.toLowerCase() !== config.payment.address.toLowerCase()) {
      throw new Error('Incorrect recipient');
    }

    // Verify amount (USDC has 6 decimals)
    const expectedWei = parseFloat(expectedAmount) * 1e6;
    if (usdcTransfer.value < expectedWei) {
      throw new Error('Insufficient payment');
    }

    return true;
  } catch (error) {
    logger.error({ err: error }, 'Payment verification failed');
    return false;
  }
}

function parseUSDCTransfer(logs) {
  // USDC Transfer event signature
  const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

  const transferLog = logs.find(log => log.topics[0] === TRANSFER_TOPIC);

  if (!transferLog) {
    throw new Error('No transfer event found');
  }

  return {
    from: '0x' + transferLog.topics[1].slice(26),
    to: '0x' + transferLog.topics[2].slice(26),
    value: parseInt(transferLog.data, 16),
  };
}
```

### Using x402 Facilitators

Facilitators simplify payment verification:

```javascript
import fetch from 'node-fetch';

async function verifyPaymentViaFacilitator(paymentHash) {
  const facilitatorUrl = process.env.X402_FACILITATOR_URL;

  const response = await fetch(`${facilitatorUrl}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      txHash: paymentHash,
      expectedRecipient: config.payment.address,
      expectedAmount: config.payment.pricePerQuery,
      network: config.payment.network,
    }),
  });

  const result = await response.json();
  return result.verified === true;
}
```

## Client-Side Integration

### JavaScript/TypeScript Client

```typescript
class VendClient {
  constructor(private baseUrl: string) {}

  async getTransfers(address: string, paymentTx?: string) {
    const url = `${this.baseUrl}/api/transfers?address=${address}`;

    const headers: Record<string, string> = {};
    if (paymentTx) {
      headers['X-Payment-Hash'] = paymentTx;
    }

    const response = await fetch(url, { headers });

    if (response.status === 402) {
      // Payment required
      const paymentInfo = await response.json();
      throw new PaymentRequiredError(paymentInfo);
    }

    return response.json();
  }

  async payAndQuery(address: string, wallet: ethers.Wallet) {
    try {
      // First attempt - will fail with 402
      await this.getTransfers(address);
    } catch (error) {
      if (error instanceof PaymentRequiredError) {
        // Send payment
        const paymentTx = await this.sendPayment(error.paymentInfo, wallet);

        // Wait for confirmation
        await paymentTx.wait(1);

        // Retry with payment proof
        return this.getTransfers(address, paymentTx.hash);
      }
      throw error;
    }
  }

  private async sendPayment(paymentInfo: any, wallet: ethers.Wallet) {
    const usdcContract = new ethers.Contract(
      USDC_ADDRESS,
      ['function transfer(address to, uint256 amount)'],
      wallet
    );

    const amount = ethers.utils.parseUnits(paymentInfo.payment.amount, 6);

    return usdcContract.transfer(
      paymentInfo.payment.recipient,
      amount
    );
  }
}

// Usage
const client = new VendClient('https://api.vend.xyz');
const wallet = new ethers.Wallet(privateKey, provider);

const transfers = await client.payAndQuery('0xAddress...', wallet);
```

### Python Client

```python
import requests
from web3 import Web3

class VendClient:
    def __init__(self, base_url):
        self.base_url = base_url

    def get_transfers(self, address, payment_hash=None):
        url = f"{self.base_url}/api/transfers?address={address}"
        headers = {}

        if payment_hash:
            headers['X-Payment-Hash'] = payment_hash

        response = requests.get(url, headers=headers)

        if response.status_code == 402:
            raise PaymentRequiredError(response.json())

        return response.json()

    def pay_and_query(self, address, wallet):
        try:
            return self.get_transfers(address)
        except PaymentRequiredError as e:
            # Send payment
            tx_hash = self.send_payment(e.payment_info, wallet)

            # Wait for confirmation
            receipt = wallet.wait_for_transaction(tx_hash)

            # Retry with payment
            return self.get_transfers(address, tx_hash)

    def send_payment(self, payment_info, wallet):
        usdc = wallet.eth.contract(
            address=USDC_ADDRESS,
            abi=[...USDC_ABI...]
        )

        amount = Web3.toWei(payment_info['payment']['amount'], 'mwei')

        tx = usdc.functions.transfer(
            payment_info['payment']['recipient'],
            amount
        ).transact()

        return tx
```

## Advanced Features

### Dynamic Pricing

Adjust price based on query complexity:

```javascript
function calculatePrice(query) {
  let basePrice = 0.01;

  if (query.maxCount > 100) {
    basePrice += 0.01;
  }

  if (query.category.includes('internal')) {
    basePrice += 0.005;
  }

  return basePrice.toFixed(2);
}

router.get('/api/transfers', async (req, res, next) => {
  const price = calculatePrice(req.query);
  const middleware = paymentRequired({ price });
  middleware(req, res, next);
});
```

### Payment Caching

Avoid re-checking the same payment:

```javascript
const paymentCache = new Map();

async function verifyPayment(paymentHash, expectedAmount) {
  // Check cache
  if (paymentCache.has(paymentHash)) {
    return paymentCache.get(paymentHash);
  }

  // Verify payment
  const isValid = await verifyPaymentOnChain(paymentHash, expectedAmount);

  // Cache result (with TTL)
  if (isValid) {
    paymentCache.set(paymentHash, isValid);
    setTimeout(() => paymentCache.delete(paymentHash), 3600000); // 1 hour
  }

  return isValid;
}
```

### Multi-Query Payments

Allow one payment for multiple queries:

```javascript
const paymentCredits = new Map();

async function verifyPayment(paymentHash, expectedAmount) {
  const isValid = await verifyPaymentOnChain(paymentHash, expectedAmount);

  if (isValid) {
    // Grant 10 query credits
    paymentCredits.set(paymentHash, 10);
  }

  return isValid;
}

router.get('/api/transfers', paymentRequired(), async (req, res) => {
  const credits = paymentCredits.get(req.payment.hash) || 0;

  if (credits > 0) {
    paymentCredits.set(req.payment.hash, credits - 1);
  }

  // Process query...
});
```

## Testing Payment Flow

### Local Testing

```bash
# Terminal 1: Start server
npm run dev

# Terminal 2: Test without payment
curl http://localhost:3000/api/transfers?address=0x...
# Returns 402

# Test with demo payment
curl -H "X-Payment-Hash: demo" \
  http://localhost:3000/api/transfers?address=0x...
# Returns data
```

### Testnet Testing

1. Get testnet USDC from [Base Sepolia faucet](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet)
2. Send USDC to payment address
3. Use transaction hash in request

```bash
curl -H "X-Payment-Hash: 0xYourTestnetTxHash" \
  https://testnet.vend.xyz/api/transfers?address=0x...
```

## Resources

- [x402 Protocol Spec](https://x402.org)
- [Coinbase x402 Docs](https://docs.cdp.coinbase.com/x402)
- [x402 GitHub](https://github.com/coinbase/x402)
- [Base Network Docs](https://docs.base.org/)
- [USDC on Base](https://www.circle.com/en/usdc)

## Next Steps

- [Alchemy API Guide](./alchemy-guide.md) - Advanced blockchain queries
- [Deployment Guide](./deployment.md) - Production deployment

---

Questions? [Open an issue](https://github.com/yourusername/vend/issues)

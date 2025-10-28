/**
 * Standalone test script for payment verification
 *
 * This script tests the payment verification logic with real blockchain data
 * without requiring the full server to be running.
 *
 * Usage:
 *   ALCHEMY_API_KEY=your_key PAYMENT_ADDRESS=0x... node test-payment-verification.js
 */

import { Alchemy, Network } from 'alchemy-sdk';
import dotenv from 'dotenv';

dotenv.config();

// USDC contract on Base Sepolia
const USDC_CONTRACT = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';
const TRANSFER_EVENT_SIGNATURE = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

async function testPaymentVerification(txHash, expectedRecipient, expectedAmount) {
  console.log('\n=== Testing Payment Verification ===');
  console.log('Transaction Hash:', txHash);
  console.log('Expected Recipient:', expectedRecipient);
  console.log('Expected Amount:', expectedAmount, 'USDC');
  console.log('');

  const alchemy = new Alchemy({
    apiKey: process.env.ALCHEMY_API_KEY,
    network: Network.BASE_SEPOLIA,
  });

  try {
    // Fetch transaction receipt
    console.log('Fetching transaction receipt...');
    const receipt = await alchemy.core.getTransactionReceipt(txHash);

    if (!receipt) {
      console.error('❌ Transaction not found');
      return false;
    }

    console.log('✓ Transaction found');
    console.log('  Status:', receipt.status === 1 ? 'Success' : 'Failed');
    console.log('  Block:', receipt.blockNumber);

    // Check transaction succeeded
    if (receipt.status !== 1) {
      console.error('❌ Transaction failed');
      return false;
    }

    // Find USDC Transfer event
    console.log('\nSearching for USDC transfer event...');
    const transferLog = receipt.logs.find(log => {
      return log.address.toLowerCase() === USDC_CONTRACT.toLowerCase() &&
             log.topics[0] === TRANSFER_EVENT_SIGNATURE;
    });

    if (!transferLog) {
      console.error('❌ No USDC transfer found in transaction');
      console.log('Available logs:', receipt.logs.length);
      return false;
    }

    console.log('✓ USDC transfer event found');

    // Decode Transfer event
    const fromAddress = '0x' + transferLog.topics[1].slice(26);
    const toAddress = '0x' + transferLog.topics[2].slice(26);
    const amountHex = transferLog.data;
    const amountInSmallestUnit = BigInt(amountHex);
    const amountInUSDC = Number(amountInSmallestUnit) / 1e6;

    console.log('\nTransfer Details:');
    console.log('  From:', fromAddress);
    console.log('  To:', toAddress);
    console.log('  Amount:', amountInUSDC, 'USDC');

    // Verify recipient
    if (toAddress.toLowerCase() !== expectedRecipient.toLowerCase()) {
      console.error('\n❌ Recipient mismatch!');
      console.error('  Expected:', expectedRecipient);
      console.error('  Actual:', toAddress);
      return false;
    }

    console.log('✓ Recipient matches');

    // Verify amount
    const expectedAmountNum = parseFloat(expectedAmount);
    const tolerance = 0.000001;

    if (amountInUSDC < expectedAmountNum - tolerance) {
      console.error('\n❌ Amount insufficient!');
      console.error('  Expected:', expectedAmountNum, 'USDC');
      console.error('  Actual:', amountInUSDC, 'USDC');
      return false;
    }

    console.log('✓ Amount sufficient');

    console.log('\n✅ Payment verification PASSED\n');
    return true;

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    return false;
  }
}

// Main execution
async function main() {
  if (!process.env.ALCHEMY_API_KEY) {
    console.error('Error: ALCHEMY_API_KEY environment variable is required');
    console.error('Usage: ALCHEMY_API_KEY=your_key PAYMENT_ADDRESS=0x... node test-payment-verification.js');
    process.exit(1);
  }

  // Test with a known Base Sepolia USDC transfer transaction
  // You'll need to replace this with an actual transaction hash for testing
  const testTxHash = process.argv[2] || '0x_YOUR_TEST_TX_HASH_HERE';
  const testRecipient = process.env.PAYMENT_ADDRESS || '0x_YOUR_RECIPIENT_ADDRESS';
  const testAmount = process.argv[3] || '0.01';

  if (testTxHash === '0x_YOUR_TEST_TX_HASH_HERE') {
    console.log('ℹ️  To test with a real transaction:');
    console.log('   node test-payment-verification.js <tx-hash> [amount]');
    console.log('');
    console.log('Example:');
    console.log('   ALCHEMY_API_KEY=abc123 PAYMENT_ADDRESS=0x123... \\');
    console.log('     node test-payment-verification.js 0xabc123... 0.01');
    console.log('');
    process.exit(0);
  }

  await testPaymentVerification(testTxHash, testRecipient, testAmount);
}

main().catch(console.error);

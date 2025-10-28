/**
 * Send USDC payment on Base Sepolia
 *
 * This script sends a USDC payment to test x402 payment verification
 */

import { Alchemy, Network, Wallet, Utils } from 'alchemy-sdk';
import dotenv from 'dotenv';

dotenv.config();

// USDC contract on Base Sepolia
const USDC_CONTRACT = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';

// ERC20 transfer function signature
const TRANSFER_FUNCTION_SIGNATURE = '0xa9059cbb'; // transfer(address,uint256)

async function sendUSDCPayment(privateKey, recipient, amountInUSDC) {
  console.log('\n🎰 Sending USDC Payment on Base Sepolia\n');

  // Initialize Alchemy
  const alchemy = new Alchemy({
    apiKey: process.env.ALCHEMY_API_KEY,
    network: Network.BASE_SEPOLIA,
  });

  // Create wallet
  const wallet = new Wallet(privateKey, alchemy);
  const senderAddress = wallet.address;

  console.log('From:', senderAddress);
  console.log('To:', recipient);
  console.log('Amount:', amountInUSDC, 'USDC');
  console.log('Network: Base Sepolia');
  console.log('USDC Contract:', USDC_CONTRACT);
  console.log('');

  // Check USDC balance
  console.log('Checking USDC balance...');
  const balanceData = await alchemy.core.getTokenBalances(senderAddress, [USDC_CONTRACT]);
  const balance = balanceData.tokenBalances[0];

  if (balance.tokenBalance === '0x' || balance.tokenBalance === '0x0') {
    console.error('❌ Error: No USDC balance found!');
    console.error('Make sure you have USDC on Base Sepolia at:', senderAddress);
    process.exit(1);
  }

  const balanceInSmallestUnit = BigInt(balance.tokenBalance);
  const balanceInUSDC = Number(balanceInSmallestUnit) / 1e6;
  console.log('✓ USDC Balance:', balanceInUSDC, 'USDC');
  console.log('');

  // Convert amount to smallest unit (USDC has 6 decimals)
  const amountInSmallestUnit = BigInt(Math.floor(amountInUSDC * 1e6));

  // Check sufficient balance
  if (amountInSmallestUnit > balanceInSmallestUnit) {
    console.error('❌ Error: Insufficient balance!');
    console.error('   Need:', amountInUSDC, 'USDC');
    console.error('   Have:', balanceInUSDC, 'USDC');
    process.exit(1);
  }

  // Encode transfer function call
  // transfer(address recipient, uint256 amount)
  const recipientPadded = recipient.slice(2).padStart(64, '0');
  const amountHex = amountInSmallestUnit.toString(16).padStart(64, '0');
  const data = TRANSFER_FUNCTION_SIGNATURE + recipientPadded + amountHex;

  // Build transaction
  console.log('Building transaction...');
  const tx = {
    to: USDC_CONTRACT,
    data: data,
    gasLimit: 100000n, // ERC20 transfers typically need ~65k gas
  };

  console.log('');
  console.log('Transaction details:');
  console.log('  Contract:', tx.to);
  console.log('  Data:', tx.data);
  console.log('  Gas Limit:', tx.gasLimit.toString());
  console.log('');

  // Send transaction
  console.log('Sending transaction...');
  console.log('(This may take a few seconds)');
  console.log('');

  try {
    const response = await wallet.sendTransaction(tx);

    console.log('✓ Transaction sent!');
    console.log('  Hash:', response.hash);
    console.log('  Block:', response.blockNumber || 'Pending');
    console.log('');
    console.log('Waiting for confirmation...');
    console.log('');

    // Wait for transaction to be mined
    const receipt = await response.wait();

    console.log('✅ Transaction confirmed!');
    console.log('');
    console.log('Receipt:');
    console.log('  Hash:', receipt.hash);
    console.log('  Block:', receipt.blockNumber);
    console.log('  Gas Used:', receipt.gasUsed.toString());
    console.log('  Status:', receipt.status === 1 ? 'Success' : 'Failed');
    console.log('');

    if (receipt.status === 1) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🎉 Payment successful!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('');
      console.log('Now test with Vend:');
      console.log('');
      console.log(`curl -H "X-Payment-Hash: ${receipt.hash}" \\`);
      console.log(`  "http://localhost:3000/api/transfers?address=0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"`);
      console.log('');
      console.log('Or with jq for pretty output:');
      console.log('');
      console.log(`curl -s -H "X-Payment-Hash: ${receipt.hash}" \\`);
      console.log(`  "http://localhost:3000/api/transfers?address=0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045&maxCount=3" | jq .`);
      console.log('');

      return receipt.hash;
    } else {
      console.error('❌ Transaction failed!');
      process.exit(1);
    }

  } catch (error) {
    console.error('');
    console.error('❌ Error sending transaction:');
    console.error('  ', error.message);
    console.error('');
    if (error.code === 'INSUFFICIENT_FUNDS') {
      console.error('💡 You need ETH for gas fees on Base Sepolia');
      console.error('   Get some from: https://www.alchemy.com/faucets/base-sepolia');
    }
    process.exit(1);
  }
}

// Main execution
async function main() {
  const privateKey = process.argv[2];
  const recipient = process.argv[3] || process.env.PAYMENT_ADDRESS;
  const amount = parseFloat(process.argv[4] || '0.01');

  if (!privateKey) {
    console.error('Usage: node send-payment.js <private-key> [recipient] [amount]');
    console.error('');
    console.error('Example:');
    console.error('  node send-payment.js 0xYourPrivateKey');
    console.error('  node send-payment.js 0xYourPrivateKey 0xRecipient 0.01');
    console.error('');
    console.error('Recipient defaults to PAYMENT_ADDRESS from .env');
    console.error('Amount defaults to 0.01 USDC');
    process.exit(1);
  }

  if (!process.env.ALCHEMY_API_KEY) {
    console.error('Error: ALCHEMY_API_KEY not found in environment');
    console.error('Make sure .env file is configured');
    process.exit(1);
  }

  if (!recipient) {
    console.error('Error: No recipient address provided');
    console.error('Either provide as argument or set PAYMENT_ADDRESS in .env');
    process.exit(1);
  }

  await sendUSDCPayment(privateKey, recipient, amount);
}

main().catch(console.error);

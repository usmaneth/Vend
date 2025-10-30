import { ethers } from 'ethers';
import chalk from 'chalk';
import ora from 'ora';

// USDC contract ABI (only the transfer function we need)
const USDC_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function decimals() view returns (uint8)',
  'function balanceOf(address account) view returns (uint256)'
];

// Network configurations
const NETWORK_CONFIGS = {
  'base-sepolia': {
    chainId: 84532,
    rpcUrl: 'https://sepolia.base.org',
    usdcAddress: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // Base Sepolia USDC
    name: 'Base Sepolia'
  },
  'base-mainnet': {
    chainId: 8453,
    rpcUrl: 'https://mainnet.base.org',
    usdcAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Base Mainnet USDC
    name: 'Base Mainnet'
  }
};

export class PaymentService {
  constructor(privateKey, rpcUrl = null) {
    this.privateKey = privateKey;
    this.customRpcUrl = rpcUrl;
  }

  /**
   * Send USDC payment to specified recipient
   * @param {string} recipient - Ethereum address to send USDC to
   * @param {string} amount - Amount in USDC (e.g., "0.01")
   * @param {string} network - Network name (e.g., "base-sepolia")
   * @returns {Promise<string>} Transaction hash
   */
  async sendPayment(recipient, amount, network) {
    const networkConfig = NETWORK_CONFIGS[network];

    if (!networkConfig) {
      throw new Error(`Unsupported network: ${network}. Supported: ${Object.keys(NETWORK_CONFIGS).join(', ')}`);
    }

    const rpcUrl = this.customRpcUrl || networkConfig.rpcUrl;

    console.log(chalk.cyan.bold(`\n💸 Automatic Payment\n`));
    console.log(chalk.gray(`Network: ${networkConfig.name}`));
    console.log(chalk.gray(`Amount: ${amount} USDC`));
    console.log(chalk.gray(`Recipient: ${recipient}\n`));

    // Ensure recipient address is properly checksummed (prevents ENS resolution errors)
    const recipientAddress = ethers.getAddress(recipient);

    // Create provider and wallet
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(this.privateKey, provider);

    console.log(chalk.gray(`Paying from: ${wallet.address}\n`));

    // Connect to USDC contract
    const usdcContract = new ethers.Contract(
      networkConfig.usdcAddress,
      USDC_ABI,
      wallet
    );

    // Check balance first
    const spinner = ora({
      text: 'Checking USDC balance...',
      color: 'cyan'
    }).start();

    try {
      const decimals = await usdcContract.decimals();
      const balance = await usdcContract.balanceOf(wallet.address);
      const balanceFormatted = ethers.formatUnits(balance, decimals);

      spinner.succeed(chalk.green(`Balance: ${balanceFormatted} USDC`));

      const amountInUnits = ethers.parseUnits(amount, decimals);

      if (balance < amountInUnits) {
        console.error(chalk.red(`\n❌ Insufficient USDC balance!`));
        console.error(chalk.yellow(`Required: ${amount} USDC`));
        console.error(chalk.yellow(`Available: ${balanceFormatted} USDC\n`));
        process.exit(1);
      }

      // Send transaction
      const sendSpinner = ora({
        text: 'Sending USDC payment...',
        color: 'cyan'
      }).start();

      const tx = await usdcContract.transfer(recipientAddress, amountInUnits);

      sendSpinner.text = `Transaction sent: ${tx.hash}`;
      sendSpinner.succeed();

      // Wait for confirmation
      const confirmSpinner = ora({
        text: 'Waiting for confirmation...',
        color: 'cyan'
      }).start();

      const receipt = await tx.wait();

      if (receipt.status === 1) {
        confirmSpinner.succeed(chalk.green('Payment confirmed!'));
        console.log(chalk.gray(`Block: ${receipt.blockNumber}`));
        console.log(chalk.gray(`Gas used: ${receipt.gasUsed.toString()}\n`));
        return tx.hash;
      } else {
        confirmSpinner.fail(chalk.red('Transaction failed'));
        throw new Error('Transaction reverted');
      }

    } catch (error) {
      spinner.stop();

      if (error.code === 'INSUFFICIENT_FUNDS') {
        console.error(chalk.red('\n❌ Insufficient ETH for gas!'));
        console.error(chalk.yellow('You need ETH on Base Sepolia to pay for gas fees.\n'));
      } else if (error.code === 'NONCE_EXPIRED') {
        console.error(chalk.red('\n❌ Transaction nonce expired. Please retry.\n'));
      } else {
        console.error(chalk.red('\n❌ Payment failed:'), error.message);
      }

      throw error;
    }
  }

  /**
   * Get wallet address from private key
   * @returns {string} Ethereum address
   */
  getAddress() {
    const wallet = new ethers.Wallet(this.privateKey);
    return wallet.address;
  }
}

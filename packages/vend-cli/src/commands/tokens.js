import chalk from 'chalk';
import ora from 'ora';
import { X402Client } from '../x402-client.js';
import { PaymentService } from '../services/payment.js';
import { outputData } from '../utils/formatters.js';

export async function tokensCommand(url, options) {
  const client = new X402Client();

  console.log(chalk.gray('\n────────────────────────────────────────\n'));
  console.log(chalk.cyan.bold('🪙  Querying Tokens\n'));

  // Validate required parameters
  if (!options.address) {
    console.error(chalk.red('Error: --address parameter is required'));
    console.error(chalk.yellow('Example: vend tokens <url> --address 0x...\n'));
    process.exit(1);
  }

  // Build query parameters
  const params = { address: options.address };

  if (options.contracts) {
    params.contractAddresses = options.contracts;
  }

  // Validate wallet if provided
  let paymentService = null;
  if (options.wallet) {
    try {
      paymentService = new PaymentService(options.wallet, options.rpc);
      console.log(chalk.gray(`Wallet configured: ${paymentService.getAddress()}\n`));
    } catch (error) {
      console.error(chalk.red('Error: Invalid private key\n'));
      process.exit(1);
    }
  }

  // Make request
  const spinner = ora({
    text: 'Fetching token balances...',
    color: 'cyan'
  }).start();

  try {
    const initialResponse = await client.request(url, params, options.txHash);
    spinner.stop();

    // Check if payment required
    if (initialResponse.status === 402) {
      await handlePaymentRequired(client, url, params, initialResponse.data, paymentService, options);
    } else {
      // Success! Display data
      displaySuccessResponse(initialResponse, options.format);
    }

  } catch (error) {
    spinner.stop();
    console.error(chalk.red('\n❌ Error:'), error.message);
    process.exit(1);
  }
}

async function handlePaymentRequired(client, url, params, paymentInfo, paymentService, options) {
  const payment = paymentInfo.payment || paymentInfo.expected;

  if (!payment) {
    console.error(chalk.red('Error: Invalid payment response'));
    process.exit(1);
  }

  // If wallet configured, automatically send payment
  if (paymentService) {
    try {
      const txHash = await paymentService.sendPayment(
        payment.recipient,
        payment.amount,
        payment.network
      );

      // Retry with payment proof
      console.log(chalk.gray('────────────────────────────────────────\n'));
      const spinner = ora({
        text: 'Verifying payment on-chain...',
        color: 'cyan'
      }).start();

      const response = await client.request(url, params, txHash);
      spinner.succeed(chalk.green('Payment verified!'));

      displaySuccessResponse(response, options.format);
      return;

    } catch (error) {
      console.error(chalk.red('\n❌ Automatic payment failed:'), error.message);
      process.exit(1);
    }
  }

  // Manual payment required
  console.log(chalk.yellow.bold('\n💰 Payment Required\n'));
  console.log(chalk.gray(`Price: ${payment.amount} ${payment.currency}`));
  console.log(chalk.gray(`Recipient: ${payment.recipient}`));
  console.log(chalk.gray(`\nUse --wallet to enable automatic payments\n`));
  process.exit(1);
}

function displaySuccessResponse(response, format = 'table') {
  console.log(chalk.green.bold('\n✅ Success!\n'));

  // Display payment info
  if (response.data.payment) {
    console.log(chalk.gray(`Payment: ${response.data.payment.hash?.substring(0, 20)}...`));
    console.log(chalk.gray(`Amount: ${response.data.payment.amount} ${response.data.payment.currency}\n`));
  }

  // Output data in requested format
  console.log(chalk.cyan.bold('🪙  Token Balances:\n'));
  outputData(response.data.data, format, 'tokens');

  console.log(chalk.gray('\n────────────────────────────────────────\n'));
}

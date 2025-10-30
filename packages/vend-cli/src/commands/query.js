import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import boxen from 'boxen';
import Table from 'cli-table3';
import { X402Client } from '../x402-client.js';
import { PaymentService } from '../services/payment.js';

export async function queryCommand(url, options) {
  const client = new X402Client();

  console.log(chalk.gray('\n────────────────────────────────────────\n'));
  console.log(chalk.cyan.bold('📡 Querying x402 API\n'));

  // Build query parameters
  const params = {};
  if (options.address) {
    params.address = options.address;
  }
  if (options.params) {
    try {
      Object.assign(params, JSON.parse(options.params));
    } catch (e) {
      console.error(chalk.red('Error: Invalid JSON in --params'));
      process.exit(1);
    }
  }

  // Validate wallet if provided
  let paymentService = null;
  if (options.wallet) {
    try {
      paymentService = new PaymentService(options.wallet, options.rpc);
      console.log(chalk.gray(`Wallet configured: ${paymentService.getAddress()}\n`));
    } catch (error) {
      console.error(chalk.red('Error: Invalid private key'));
      console.error(chalk.yellow('Private key must be in format: 0x...\n'));
      process.exit(1);
    }
  }

  // Initial request
  const spinner = ora({
    text: 'Making request...',
    color: 'cyan'
  }).start();

  try {
    const initialResponse = await client.request(url, params, options.txHash);
    spinner.stop();

    // Check if payment required
    if (initialResponse.status === 402) {
      await handlePaymentRequired(client, url, params, initialResponse.data, paymentService);
    } else {
      // Success! Display data
      displaySuccessResponse(initialResponse);
    }

  } catch (error) {
    spinner.stop();
    console.error(chalk.red('\n❌ Error:'), error.message);
    process.exit(1);
  }
}

async function handlePaymentRequired(client, url, params, paymentInfo, paymentService = null) {
  // Check if this is an invalid payment response
  if (paymentInfo.message && paymentInfo.message.includes('could not be verified')) {
    console.log(chalk.red.bold('\n❌ Invalid Payment\n'));
    console.log(chalk.yellow(paymentInfo.message));

    if (paymentInfo.expected) {
      const expectedBox = `
${chalk.cyan.bold('Expected Payment')}

${chalk.gray('Amount:')}     ${chalk.green.bold(paymentInfo.expected.amount + ' ' + paymentInfo.expected.currency)}
${chalk.gray('Network:')}    ${chalk.blue(paymentInfo.expected.network)}
${chalk.gray('Recipient:')}  ${chalk.white(paymentInfo.expected.recipient)}
`;
      console.log(
        boxen(expectedBox, {
          padding: 1,
          margin: 1,
          borderStyle: 'double',
          borderColor: 'red',
        })
      );
    }

    if (paymentInfo.received) {
      console.log(chalk.gray('\nReceived:'));
      console.log(chalk.white('  Hash: ' + paymentInfo.received.hash));
    }

    console.log(chalk.yellow('\n⚠️  Please check:'));
    console.log(chalk.gray('  • Transaction has been confirmed'));
    console.log(chalk.gray('  • Sent correct amount to correct address'));
    console.log(chalk.gray('  • Using correct network\n'));

    process.exit(1);
  }

  // Normal payment required flow
  const payment = paymentInfo.payment || paymentInfo.expected;

  if (!payment) {
    console.error(chalk.red('Error: Invalid payment response structure'));
    console.log(paymentInfo);
    process.exit(1);
  }

  // If wallet is configured, automatically send payment
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

      displaySuccessResponse(response);
      return;

    } catch (error) {
      console.error(chalk.red('\n❌ Automatic payment failed:'), error.message);
      console.log(chalk.yellow('\nFalling back to manual payment flow...\n'));
      // Fall through to manual payment flow
    }
  }

  // Manual payment flow
  console.log(chalk.yellow.bold('\n💰 Payment Required\n'));

  // Display payment details (for manual flow)
  const paymentBox = `
${chalk.cyan.bold('Payment Details')}

${chalk.gray('Amount:')}     ${chalk.green.bold(payment.amount + ' ' + payment.currency)}
${chalk.gray('Network:')}    ${chalk.blue(payment.network)}
${chalk.gray('Chain ID:')}   ${chalk.blue(payment.chainId || 'N/A')}
${chalk.gray('Recipient:')}  ${chalk.white(payment.recipient)}
`;

  console.log(
    boxen(paymentBox, {
      padding: 1,
      margin: 1,
      borderStyle: 'double',
      borderColor: 'yellow',
    })
  );

  // Display instructions
  if (paymentInfo.instructions) {
    console.log(chalk.cyan.bold('📋 Instructions:\n'));
    paymentInfo.instructions.steps.forEach((step, index) => {
      console.log(chalk.gray(`  ${step}`));
    });
    console.log('');
  }

  // Prompt user
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        { name: '💸 I sent the payment - enter tx hash', value: 'continue' },
        { name: '📋 Copy payment details to clipboard', value: 'copy' },
        { name: '❌ Cancel', value: 'cancel' },
      ],
    },
  ]);

  if (action === 'cancel') {
    console.log(chalk.gray('\nCancelled.'));
    process.exit(0);
  }

  if (action === 'copy') {
    console.log(
      boxen(
        chalk.yellow('Manual Copy Required:\n\n') +
        chalk.white(`Amount: ${payment.amount} ${payment.currency}\n`) +
        chalk.white(`Network: ${payment.network}\n`) +
        chalk.white(`Recipient: ${payment.recipient}`),
        {
          padding: 1,
          borderStyle: 'round',
          borderColor: 'yellow',
        }
      )
    );

    // Ask again
    const { retry } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'retry',
        message: 'Ready to enter transaction hash?',
        default: true,
      },
    ]);

    if (!retry) {
      console.log(chalk.gray('\nCancelled.'));
      process.exit(0);
    }
  }

  // Get transaction hash
  const { txHash } = await inquirer.prompt([
    {
      type: 'input',
      name: 'txHash',
      message: 'Enter transaction hash:',
      validate: (input) => {
        if (!input) return 'Transaction hash is required';
        if (!input.startsWith('0x')) return 'Transaction hash must start with 0x';
        if (input.length !== 66) return 'Invalid transaction hash length';
        return true;
      },
    },
  ]);

  // Retry with payment proof
  console.log(chalk.gray('\n────────────────────────────────────────\n'));
  const spinner = ora({
    text: 'Verifying payment on-chain...',
    color: 'cyan'
  }).start();

  try {
    const response = await client.request(url, params, txHash);
    spinner.succeed(chalk.green('Payment verified!'));

    displaySuccessResponse(response);

  } catch (error) {
    spinner.fail(chalk.red('Payment verification failed'));
    console.error(chalk.red('\n❌ Error:'), error.message);

    if (error.response?.status === 402) {
      console.log(chalk.yellow('\n⚠️  Payment not verified. Please check:'));
      console.log(chalk.gray('  • Transaction has been confirmed'));
      console.log(chalk.gray('  • Sent correct amount to correct address'));
      console.log(chalk.gray('  • Using correct network'));
    }

    process.exit(1);
  }
}

function displaySuccessResponse(response) {
  console.log(chalk.green.bold('\n✅ Success!\n'));

  // Display payment info if present
  if (response.data.payment) {
    const paymentTable = new Table({
      head: [chalk.cyan('Payment Info'), chalk.cyan('Value')],
      colWidths: [20, 50],
    });

    const paymentAmount = response.data.payment.amount || '0.01';
    const paymentCurrency = response.data.payment.currency || 'USDC';
    const paymentHash = response.data.payment.hash || 'N/A';

    paymentTable.push(
      ['Hash', chalk.gray(paymentHash.length > 20 ? paymentHash.substring(0, 20) + '...' : paymentHash)],
      ['Amount', chalk.green(paymentAmount + ' ' + paymentCurrency)],
      ['Verified', response.data.payment.verified ? chalk.green('✓ Yes') : chalk.red('✗ No')]
    );

    console.log(paymentTable.toString());
    console.log('');
  }

  // Display data
  console.log(chalk.cyan.bold('📊 Response Data:\n'));

  if (response.data.data) {
    const data = response.data.data;

    // If it's transfers data, display in table
    if (data.transfers && Array.isArray(data.transfers)) {
      displayTransfersTable(data.transfers);

      if (data.totalCount) {
        console.log(chalk.gray(`\nTotal: ${data.totalCount} transfers`));
      }
    } else {
      // Display as JSON
      console.log(chalk.white(JSON.stringify(data, null, 2)));
    }
  } else {
    console.log(chalk.white(JSON.stringify(response.data, null, 2)));
  }

  console.log(chalk.gray('\n────────────────────────────────────────\n'));
}

function displayTransfersTable(transfers) {
  const table = new Table({
    head: [
      chalk.cyan('Type'),
      chalk.cyan('Asset'),
      chalk.cyan('Value'),
      chalk.cyan('From'),
      chalk.cyan('To'),
    ],
    colWidths: [12, 10, 15, 12, 12],
  });

  const displayTransfers = transfers.slice(0, 10); // Show first 10

  displayTransfers.forEach(transfer => {
    table.push([
      chalk.gray(transfer.category),
      chalk.white(transfer.asset || 'ETH'),
      chalk.green(transfer.value?.toString().substring(0, 10) || '0'),
      chalk.gray(transfer.from?.substring(0, 10) + '...'),
      chalk.gray(transfer.to?.substring(0, 10) + '...'),
    ]);
  });

  console.log(table.toString());

  if (transfers.length > 10) {
    console.log(chalk.gray(`\n... and ${transfers.length - 10} more transfers`));
  }
}

import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import boxen from 'boxen';
import Table from 'cli-table3';
import { X402Client } from '../x402-client.js';

export async function balanceCommand(url, address, options) {
  const client = new X402Client();

  console.log(chalk.gray('\n────────────────────────────────────────\n'));
  console.log(chalk.cyan.bold('💰 Checking Token Balances\n'));
  console.log(chalk.gray(`Address: ${address}\n`));

  const spinner = ora({
    text: 'Making request...',
    color: 'cyan'
  }).start();

  try {
    // Note: This assumes there's a balance endpoint
    // Adjust the endpoint construction based on actual API
    const balanceUrl = url.includes('?') ? `${url}&address=${address}` : `${url}?address=${address}`;
    const response = await client.request(balanceUrl, {}, options.txHash);

    spinner.stop();

    if (response.status === 402) {
      await handlePaymentRequired(client, balanceUrl, response.data);
    } else {
      displayBalanceResponse(response, address);
    }

  } catch (error) {
    spinner.stop();
    console.error(chalk.red('\n❌ Error:'), error.message);
    process.exit(1);
  }
}

async function handlePaymentRequired(client, url, paymentInfo) {
  console.log(chalk.yellow.bold('\n💰 Payment Required\n'));

  const payment = paymentInfo.payment;

  const paymentBox = `
${chalk.cyan.bold('Payment Details')}

${chalk.gray('Amount:')}     ${chalk.green.bold(payment.amount + ' ' + payment.currency)}
${chalk.gray('Network:')}    ${chalk.blue(payment.network)}
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

  const { txHash } = await inquirer.prompt([
    {
      type: 'input',
      name: 'txHash',
      message: 'Enter transaction hash:',
      validate: (input) => {
        if (!input) return 'Transaction hash is required';
        if (!input.startsWith('0x')) return 'Transaction hash must start with 0x';
        return true;
      },
    },
  ]);

  const spinner = ora({
    text: 'Verifying payment...',
    color: 'cyan'
  }).start();

  try {
    const response = await client.request(url, {}, txHash);
    spinner.succeed(chalk.green('Payment verified!'));
    displayBalanceResponse(response);
  } catch (error) {
    spinner.fail(chalk.red('Payment verification failed'));
    console.error(chalk.red('\n❌ Error:'), error.message);
    process.exit(1);
  }
}

function displayBalanceResponse(response, address) {
  console.log(chalk.green.bold('\n✅ Token Balances\n'));

  if (response.data.data && response.data.data.balances) {
    const balances = response.data.data.balances;

    const table = new Table({
      head: [chalk.cyan('Token'), chalk.cyan('Balance'), chalk.cyan('Symbol')],
      colWidths: [42, 25, 15],
    });

    balances.forEach(balance => {
      table.push([
        chalk.gray(balance.contractAddress || 'Native'),
        chalk.white(balance.tokenBalance || '0'),
        chalk.green(balance.symbol || 'N/A'),
      ]);
    });

    console.log(table.toString());
  } else {
    console.log(chalk.white(JSON.stringify(response.data, null, 2)));
  }

  console.log(chalk.gray('\n────────────────────────────────────────\n'));
}

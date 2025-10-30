import chalk from 'chalk';
import ora from 'ora';
import Table from 'cli-table3';
import { X402Client } from '../x402-client.js';

export async function infoCommand(url) {
  const client = new X402Client();

  console.log(chalk.gray('\n────────────────────────────────────────\n'));
  console.log(chalk.cyan.bold('ℹ️  Endpoint Information\n'));

  const spinner = ora({
    text: 'Fetching endpoint info...',
    color: 'cyan'
  }).start();

  try {
    // Try to hit the info endpoint (typically /info or /api/info)
    const infoUrl = url.endsWith('/') ? url + 'info' : url + '/info';
    const response = await client.request(infoUrl);

    spinner.stop();

    if (response.status === 404) {
      // If no info endpoint, try a regular request to get 402 info
      console.log(chalk.yellow('No dedicated info endpoint, checking payment requirements...\n'));
      const mainResponse = await client.request(url);

      if (mainResponse.status === 402) {
        displayPaymentInfo(mainResponse.data);
      } else {
        console.log(chalk.yellow('This endpoint does not require payment'));
      }
    } else {
      displayEndpointInfo(response.data);
    }

  } catch (error) {
    spinner.stop();
    console.error(chalk.red('\n❌ Error:'), error.message);
    process.exit(1);
  }
}

function displayEndpointInfo(data) {
  console.log(chalk.green.bold('✅ Endpoint Information\n'));

  if (data.endpoint) {
    const table = new Table({
      head: [chalk.cyan('Property'), chalk.cyan('Value')],
      colWidths: [20, 60],
    });

    table.push(
      ['Endpoint', chalk.white(data.endpoint)],
      ['Method', chalk.gray(data.method || 'GET')],
      ['Description', chalk.gray(data.description || 'N/A')]
    );

    if (data.payment) {
      table.push(
        ['', ''],
        [chalk.yellow('Payment Required'), chalk.yellow('Yes')],
        ['Price', chalk.green(data.payment.price + ' ' + data.payment.currency)],
        ['Network', chalk.blue(data.payment.network)]
      );
    }

    console.log(table.toString());
  } else {
    console.log(chalk.white(JSON.stringify(data, null, 2)));
  }

  console.log(chalk.gray('\n────────────────────────────────────────\n'));
}

function displayPaymentInfo(data) {
  console.log(chalk.yellow.bold('💰 Payment Required\n'));

  if (data.payment) {
    const table = new Table({
      head: [chalk.cyan('Payment Info'), chalk.cyan('Value')],
      colWidths: [20, 60],
    });

    table.push(
      ['Price', chalk.green(data.payment.amount + ' ' + data.payment.currency)],
      ['Network', chalk.blue(data.payment.network)],
      ['Chain ID', chalk.gray(data.payment.chainId)],
      ['Recipient', chalk.white(data.payment.recipient)]
    );

    console.log(table.toString());
  }

  console.log(chalk.gray('\n────────────────────────────────────────\n'));
}

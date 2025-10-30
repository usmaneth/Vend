#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import boxen from 'boxen';
import { queryCommand } from './commands/query.js';
import { balanceCommand } from './commands/balance.js';
import { configCommand } from './commands/config.js';
import { infoCommand } from './commands/info.js';

const program = new Command();

// ASCII art banner with x402
const banner = `
╦  ╦┌─┐┌┐┌┌┬┐  ┌─┐┬  ┬
╚╗╔╝├┤ │││ ││  │  │  │
 ╚╝ └─┘┘└┘─┴┘  └─┘┴─┘┴
`;

console.log(
  boxen(
    chalk.cyan.bold(banner) + '\n' +
    chalk.white('Vending Onchain Data via x402') + '\n' +
    chalk.gray('Pay • Query • Verify'),
    {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'cyan',
    }
  )
);

program
  .name('vend')
  .description('CLI tool for consuming x402 payment-gated APIs')
  .version('0.1.0');

// Query command - main functionality
program
  .command('query')
  .description('Query an x402 API endpoint')
  .argument('<url>', 'API endpoint URL')
  .option('-a, --address <address>', 'Wallet address parameter')
  .option('-p, --params <json>', 'Additional query parameters as JSON')
  .option('-tx, --tx-hash <hash>', 'Payment transaction hash (skip payment prompt)')
  .option('-w, --wallet <privateKey>', 'Private key for automatic payments (0x...)')
  .option('-r, --rpc <url>', 'Custom RPC URL for payment network')
  .action(queryCommand);

// Balance command - check token balances
program
  .command('balance')
  .description('Get token balances for an address')
  .argument('<url>', 'API endpoint URL')
  .argument('<address>', 'Wallet address')
  .option('-tx, --tx-hash <hash>', 'Payment transaction hash')
  .action(balanceCommand);

// Info command - get endpoint info without payment
program
  .command('info')
  .description('Get information about an x402 endpoint (no payment required)')
  .argument('<url>', 'API endpoint URL')
  .action(infoCommand);

// Config command - manage configuration
program
  .command('config')
  .description('View or set configuration')
  .option('-s, --set <key=value>', 'Set configuration value')
  .option('-g, --get <key>', 'Get configuration value')
  .option('-l, --list', 'List all configuration')
  .action(configCommand);

program.parse();

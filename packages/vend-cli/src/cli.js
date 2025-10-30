#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import boxen from 'boxen';
import { queryCommand } from './commands/query.js';
import { balanceCommand } from './commands/balance.js';
import { configCommand } from './commands/config.js';
import { infoCommand } from './commands/info.js';
import { nftsCommand } from './commands/nfts.js';
import { tokensCommand } from './commands/tokens.js';
import { savedCommand } from './commands/saved.js';
import { webhookCommand } from './commands/webhook.js';

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
    chalk.white('Vending Onchain Data via x402 and Alchemy') + '\n' +
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
  .description('CLI for x402 payment-gated blockchain data (NFTs, Tokens, Transfers)')
  .version('1.0.0');

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
  .option('-f, --format <type>', 'Output format: table, json, csv (default: table)')
  .action(queryCommand);

// NFTs command - query NFT ownership
program
  .command('nfts')
  .description('Get NFTs owned by an address')
  .argument('<url>', 'API endpoint URL')
  .option('-o, --owner <address>', 'Wallet address (required)')
  .option('-c, --contracts <addresses>', 'Filter by contract addresses (comma-separated)')
  .option('--omit-metadata', 'Skip metadata for faster response')
  .option('--page-key <key>', 'Pagination key from previous response')
  .option('-tx, --tx-hash <hash>', 'Payment transaction hash')
  .option('-w, --wallet <privateKey>', 'Private key for automatic payments')
  .option('-r, --rpc <url>', 'Custom RPC URL')
  .option('-f, --format <type>', 'Output format: table, json, csv (default: table)')
  .action(nftsCommand);

// Tokens command - query token balances
program
  .command('tokens')
  .description('Get token balances for an address')
  .argument('<url>', 'API endpoint URL')
  .option('-a, --address <address>', 'Wallet address (required)')
  .option('-c, --contracts <addresses>', 'Filter by token contracts (comma-separated)')
  .option('-tx, --tx-hash <hash>', 'Payment transaction hash')
  .option('-w, --wallet <privateKey>', 'Private key for automatic payments')
  .option('-r, --rpc <url>', 'Custom RPC URL')
  .option('-f, --format <type>', 'Output format: table, json, csv (default: table)')
  .action(tokensCommand);

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

// Saved queries command - manage saved queries
program
  .command('saved <subcommand> [name]')
  .description('Manage saved queries (create, run, list, show, delete)')
  .option('-a, --address <address>', 'Override saved address')
  .option('-o, --owner <address>', 'Override saved owner')
  .option('-f, --format <type>', 'Override saved format')
  .option('-tx, --tx-hash <hash>', 'Payment transaction hash')
  .option('-w, --wallet <privateKey>', 'Override saved wallet')
  .action(savedCommand);

// Webhook command - manage webhooks
program
  .command('webhook <subcommand> [url]')
  .description('Manage webhooks (create, list, delete)')
  .option('-a, --address <address>', 'Wallet address to watch')
  .option('-n, --notify <url>', 'Webhook notification URL')
  .option('-c, --categories <list>', 'Transfer categories (comma-separated)')
  .option('-i, --id <id>', 'Webhook ID (for delete)')
  .action(webhookCommand);

// Config command - manage configuration
program
  .command('config')
  .description('View or set configuration')
  .option('-s, --set <key=value>', 'Set configuration value')
  .option('-g, --get <key>', 'Get configuration value')
  .option('-l, --list', 'List all configuration')
  .action(configCommand);

program.parse();

import chalk from 'chalk';
import inquirer from 'inquirer';
import Table from 'cli-table3';
import {
  saveQuery,
  getQuery,
  deleteQuery,
  listQueries,
  getAllQueries,
} from '../services/saved-queries.js';
import { queryCommand } from './query.js';
import { nftsCommand } from './nfts.js';
import { tokensCommand } from './tokens.js';

/**
 * Create a new saved query
 */
export async function createSavedQuery(name) {
  console.log(chalk.cyan.bold('\n📝 Create Saved Query\n'));

  // Ask for query details
  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'command',
      message: 'Which command do you want to save?',
      choices: [
        { name: '📊 Query Transfers', value: 'query' },
        { name: '📦 Query NFTs', value: 'nfts' },
        { name: '🪙  Query Tokens', value: 'tokens' },
      ],
    },
    {
      type: 'input',
      name: 'url',
      message: 'API endpoint URL:',
      validate: (input) => {
        if (!input) return 'URL is required';
        try {
          new URL(input);
          return true;
        } catch {
          return 'Please enter a valid URL';
        }
      },
    },
    {
      type: 'input',
      name: 'address',
      message: 'Wallet address (leave empty to prompt each time):',
      when: (answers) => answers.command === 'query' || answers.command === 'tokens',
    },
    {
      type: 'input',
      name: 'owner',
      message: 'NFT owner address (leave empty to prompt each time):',
      when: (answers) => answers.command === 'nfts',
    },
    {
      type: 'list',
      name: 'format',
      message: 'Output format:',
      choices: ['table', 'json', 'csv'],
      default: 'table',
    },
    {
      type: 'input',
      name: 'wallet',
      message: 'Private key for automatic payments (optional, leave empty for manual):',
    },
    {
      type: 'input',
      name: 'rpc',
      message: 'Custom RPC URL (optional):',
    },
  ]);

  // Build options object
  const options = {
    format: answers.format,
  };

  if (answers.address) options.address = answers.address;
  if (answers.owner) options.owner = answers.owner;
  if (answers.wallet) options.wallet = answers.wallet;
  if (answers.rpc) options.rpc = answers.rpc;

  // Save the query
  const queryConfig = {
    command: answers.command,
    url: answers.url,
    options,
  };

  if (saveQuery(name, queryConfig)) {
    console.log(chalk.green(`\n✅ Saved query "${name}" successfully!\n`));
    console.log(chalk.gray(`Run it with: ${chalk.white(`vend saved run ${name}`)}\n`));
  } else {
    console.error(chalk.red('\n❌ Failed to save query\n'));
    process.exit(1);
  }
}

/**
 * Run a saved query
 */
export async function runSavedQuery(name, overrideOptions = {}) {
  const query = getQuery(name);

  if (!query) {
    console.error(chalk.red(`\n❌ Saved query "${name}" not found\n`));
    console.log(chalk.gray('List saved queries with: ') + chalk.white('vend saved list\n'));
    process.exit(1);
  }

  console.log(chalk.cyan.bold(`\n🚀 Running saved query: ${name}\n`));

  // Merge saved options with override options
  const options = { ...query.options, ...overrideOptions };

  // If address/owner is not saved, prompt for it
  if (query.command === 'query' && !options.address) {
    const answer = await inquirer.prompt([
      {
        type: 'input',
        name: 'address',
        message: 'Wallet address:',
        validate: (input) => (input ? true : 'Address is required'),
      },
    ]);
    options.address = answer.address;
  }

  if (query.command === 'nfts' && !options.owner) {
    const answer = await inquirer.prompt([
      {
        type: 'input',
        name: 'owner',
        message: 'NFT owner address:',
        validate: (input) => (input ? true : 'Owner address is required'),
      },
    ]);
    options.owner = answer.owner;
  }

  if (query.command === 'tokens' && !options.address) {
    const answer = await inquirer.prompt([
      {
        type: 'input',
        name: 'address',
        message: 'Wallet address:',
        validate: (input) => (input ? true : 'Address is required'),
      },
    ]);
    options.address = answer.address;
  }

  // Execute the appropriate command
  try {
    switch (query.command) {
      case 'query':
        await queryCommand(query.url, options);
        break;
      case 'nfts':
        await nftsCommand(query.url, options);
        break;
      case 'tokens':
        await tokensCommand(query.url, options);
        break;
      default:
        console.error(chalk.red(`Unknown command: ${query.command}`));
        process.exit(1);
    }
  } catch (error) {
    console.error(chalk.red('\n❌ Error running query:'), error.message);
    process.exit(1);
  }
}

/**
 * List all saved queries
 */
export function listSavedQueries() {
  const queries = getAllQueries();
  const names = Object.keys(queries);

  if (names.length === 0) {
    console.log(chalk.yellow('\n📋 No saved queries found\n'));
    console.log(chalk.gray('Create one with: ') + chalk.white('vend saved create <name>\n'));
    return;
  }

  console.log(chalk.cyan.bold('\n📋 Saved Queries\n'));

  const table = new Table({
    head: [
      chalk.cyan('Name'),
      chalk.cyan('Command'),
      chalk.cyan('URL'),
      chalk.cyan('Format'),
    ],
    colWidths: [20, 12, 40, 10],
  });

  names.forEach((name) => {
    const query = queries[name];
    table.push([
      chalk.white(name),
      chalk.blue(query.command),
      chalk.gray(query.url.substring(0, 37) + (query.url.length > 37 ? '...' : '')),
      chalk.green(query.options.format || 'table'),
    ]);
  });

  console.log(table.toString());
  console.log(chalk.gray(`\nRun with: ${chalk.white('vend saved run <name>')}\n`));
}

/**
 * Show details of a saved query
 */
export function showSavedQuery(name) {
  const query = getQuery(name);

  if (!query) {
    console.error(chalk.red(`\n❌ Saved query "${name}" not found\n`));
    process.exit(1);
  }

  console.log(chalk.cyan.bold(`\n📄 Saved Query: ${name}\n`));
  console.log(chalk.gray('Command:   ') + chalk.white(query.command));
  console.log(chalk.gray('URL:       ') + chalk.white(query.url));
  console.log(chalk.gray('Format:    ') + chalk.white(query.options.format || 'table'));

  if (query.options.address) {
    console.log(chalk.gray('Address:   ') + chalk.white(query.options.address));
  }

  if (query.options.owner) {
    console.log(chalk.gray('Owner:     ') + chalk.white(query.options.owner));
  }

  if (query.options.wallet) {
    console.log(chalk.gray('Wallet:    ') + chalk.yellow('Configured (automatic payments)'));
  }

  if (query.options.rpc) {
    console.log(chalk.gray('RPC:       ') + chalk.white(query.options.rpc));
  }

  console.log(chalk.gray('\nCreated:   ') + chalk.white(new Date(query.created).toLocaleString()));
  console.log(chalk.gray('Updated:   ') + chalk.white(new Date(query.updated).toLocaleString()));

  console.log(chalk.gray(`\nRun with:  ${chalk.white(`vend saved run ${name}`)}\n`));
}

/**
 * Delete a saved query
 */
export async function deleteSavedQuery(name) {
  const query = getQuery(name);

  if (!query) {
    console.error(chalk.red(`\n❌ Saved query "${name}" not found\n`));
    process.exit(1);
  }

  // Confirm deletion
  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: `Delete saved query "${name}"?`,
      default: false,
    },
  ]);

  if (!confirm) {
    console.log(chalk.gray('\nCancelled.\n'));
    return;
  }

  if (deleteQuery(name)) {
    console.log(chalk.green(`\n✅ Deleted saved query "${name}"\n`));
  } else {
    console.error(chalk.red('\n❌ Failed to delete query\n'));
    process.exit(1);
  }
}

/**
 * Main saved command handler
 */
export async function savedCommand(subcommand, name, options) {
  switch (subcommand) {
    case 'create':
      if (!name) {
        console.error(chalk.red('\n❌ Query name is required\n'));
        console.log(chalk.gray('Usage: ') + chalk.white('vend saved create <name>\n'));
        process.exit(1);
      }
      await createSavedQuery(name);
      break;

    case 'run':
      if (!name) {
        console.error(chalk.red('\n❌ Query name is required\n'));
        console.log(chalk.gray('Usage: ') + chalk.white('vend saved run <name>\n'));
        process.exit(1);
      }
      await runSavedQuery(name, options);
      break;

    case 'list':
      listSavedQueries();
      break;

    case 'show':
      if (!name) {
        console.error(chalk.red('\n❌ Query name is required\n'));
        console.log(chalk.gray('Usage: ') + chalk.white('vend saved show <name>\n'));
        process.exit(1);
      }
      showSavedQuery(name);
      break;

    case 'delete':
      if (!name) {
        console.error(chalk.red('\n❌ Query name is required\n'));
        console.log(chalk.gray('Usage: ') + chalk.white('vend saved delete <name>\n'));
        process.exit(1);
      }
      await deleteSavedQuery(name);
      break;

    default:
      console.error(chalk.red(`\n❌ Unknown subcommand: ${subcommand}\n`));
      console.log(chalk.gray('Available subcommands:\n'));
      console.log(chalk.white('  create <name>  ') + chalk.gray('- Create a saved query'));
      console.log(chalk.white('  run <name>     ') + chalk.gray('- Run a saved query'));
      console.log(chalk.white('  list           ') + chalk.gray('- List all saved queries'));
      console.log(chalk.white('  show <name>    ') + chalk.gray('- Show query details'));
      console.log(chalk.white('  delete <name>  ') + chalk.gray('- Delete a saved query\n'));
      process.exit(1);
  }
}

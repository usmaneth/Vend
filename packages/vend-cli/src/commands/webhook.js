import chalk from 'chalk';
import ora from 'ora';
import Table from 'cli-table3';
import axios from 'axios';

/**
 * Create a new webhook
 */
export async function createWebhook(url, options) {
  if (!options.address) {
    console.error(chalk.red('\n❌ Error: --address is required\n'));
    console.log(chalk.gray('Example: vend webhook create <api-url> --address 0x... --notify https://webhook.site/...\n'));
    process.exit(1);
  }

  if (!options.notify) {
    console.error(chalk.red('\n❌ Error: --notify is required\n'));
    console.log(chalk.gray('Example: vend webhook create <api-url> --address 0x... --notify https://webhook.site/...\n'));
    process.exit(1);
  }

  console.log(chalk.cyan.bold('\n🔔 Creating Webhook\n'));

  const spinner = ora({
    text: 'Creating webhook subscription...',
    color: 'cyan'
  }).start();

  try {
    const payload = {
      address: options.address,
      webhookUrl: options.notify,
    };

    if (options.categories) {
      payload.categories = options.categories.split(',');
    }

    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    spinner.succeed(chalk.green('Webhook created successfully!'));

    const webhook = response.data.webhook;

    console.log(chalk.cyan.bold('\n📋 Webhook Details:\n'));
    console.log(chalk.gray('ID:       ') + chalk.white(webhook.id));
    console.log(chalk.gray('Address:  ') + chalk.white(webhook.address));
    console.log(chalk.gray('Notify:   ') + chalk.white(webhook.webhookUrl));
    console.log(chalk.gray('Status:   ') + chalk.green('Active'));

    if (webhook.categories) {
      console.log(chalk.gray('Events:   ') + chalk.white(webhook.categories.join(', ')));
    }

    console.log(chalk.gray('\nCreated:  ') + chalk.white(new Date(webhook.created).toLocaleString()));

    console.log(chalk.yellow('\n⚠️  Note: Webhooks are checked every 5 minutes for new transactions\n'));

  } catch (error) {
    spinner.fail(chalk.red('Failed to create webhook'));

    if (error.response) {
      console.error(chalk.red('\n❌ Server Error:'), error.response.data.error || error.message);
    } else {
      console.error(chalk.red('\n❌ Error:'), error.message);
    }

    process.exit(1);
  }
}

/**
 * List all webhooks
 */
export async function listWebhooks(url) {
  console.log(chalk.cyan.bold('\n🔔 Webhooks\n'));

  const spinner = ora({
    text: 'Fetching webhooks...',
    color: 'cyan'
  }).start();

  try {
    const response = await axios.get(url);
    spinner.stop();

    const webhooks = response.data.webhooks || [];

    if (webhooks.length === 0) {
      console.log(chalk.yellow('📋 No webhooks found\n'));
      console.log(chalk.gray('Create one with: ') + chalk.white('vend webhook create <url> --address 0x... --notify https://...\n'));
      return;
    }

    const table = new Table({
      head: [
        chalk.cyan('ID'),
        chalk.cyan('Address'),
        chalk.cyan('Notify URL'),
        chalk.cyan('Status'),
      ],
      colWidths: [18, 18, 35, 10],
    });

    webhooks.forEach(webhook => {
      table.push([
        chalk.white(webhook.id),
        chalk.gray(webhook.address.substring(0, 10) + '...'),
        chalk.gray(webhook.webhookUrl.substring(0, 32) + '...'),
        webhook.active ? chalk.green('Active') : chalk.red('Inactive'),
      ]);
    });

    console.log(table.toString());
    console.log(chalk.gray(`\nTotal: ${webhooks.length} webhook${webhooks.length !== 1 ? 's' : ''}\n`));

  } catch (error) {
    spinner.fail(chalk.red('Failed to fetch webhooks'));

    if (error.response) {
      console.error(chalk.red('\n❌ Server Error:'), error.response.data.error || error.message);
    } else {
      console.error(chalk.red('\n❌ Error:'), error.message);
    }

    process.exit(1);
  }
}

/**
 * Delete a webhook
 */
export async function deleteWebhook(url, webhookId) {
  if (!webhookId) {
    console.error(chalk.red('\n❌ Error: webhook ID is required\n'));
    console.log(chalk.gray('Usage: vend webhook delete <api-url> <webhook-id>\n'));
    process.exit(1);
  }

  console.log(chalk.yellow.bold(`\n⚠️  Delete Webhook: ${webhookId}\n`));

  const spinner = ora({
    text: 'Deleting webhook...',
    color: 'cyan'
  }).start();

  try {
    const deleteUrl = `${url}/${webhookId}`;
    await axios.delete(deleteUrl);

    spinner.succeed(chalk.green('Webhook deleted successfully!'));
    console.log('');

  } catch (error) {
    spinner.fail(chalk.red('Failed to delete webhook'));

    if (error.response?.status === 404) {
      console.error(chalk.red('\n❌ Webhook not found\n'));
    } else if (error.response) {
      console.error(chalk.red('\n❌ Server Error:'), error.response.data.error || error.message);
    } else {
      console.error(chalk.red('\n❌ Error:'), error.message);
    }

    process.exit(1);
  }
}

/**
 * Main webhook command handler
 */
export async function webhookCommand(subcommand, url, options) {
  switch (subcommand) {
    case 'create':
      if (!url) {
        console.error(chalk.red('\n❌ API URL is required\n'));
        console.log(chalk.gray('Usage: ') + chalk.white('vend webhook create <api-url> --address 0x... --notify https://...\n'));
        process.exit(1);
      }
      await createWebhook(url, options);
      break;

    case 'list':
      if (!url) {
        console.error(chalk.red('\n❌ API URL is required\n'));
        console.log(chalk.gray('Usage: ') + chalk.white('vend webhook list <api-url>\n'));
        process.exit(1);
      }
      await listWebhooks(url);
      break;

    case 'delete':
      if (!url) {
        console.error(chalk.red('\n❌ API URL is required\n'));
        console.log(chalk.gray('Usage: ') + chalk.white('vend webhook delete <api-url> <webhook-id>\n'));
        process.exit(1);
      }
      await deleteWebhook(url, options.id);
      break;

    default:
      console.error(chalk.red(`\n❌ Unknown subcommand: ${subcommand}\n`));
      console.log(chalk.gray('Available subcommands:\n'));
      console.log(chalk.white('  create <url>        ') + chalk.gray('- Create a webhook (requires --address and --notify)'));
      console.log(chalk.white('  list <url>          ') + chalk.gray('- List all webhooks'));
      console.log(chalk.white('  delete <url> <id>   ') + chalk.gray('- Delete a webhook\n'));
      process.exit(1);
  }
}

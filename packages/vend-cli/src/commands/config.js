import chalk from 'chalk';
import Table from 'cli-table3';
import fs from 'fs';
import path from 'path';
import os from 'os';

const CONFIG_DIR = path.join(os.homedir(), '.vend');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error(chalk.red('Error loading config:'), error.message);
  }
  return {};
}

function saveConfig(config) {
  try {
    // Create directory if it doesn't exist
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }

    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    return true;
  } catch (error) {
    console.error(chalk.red('Error saving config:'), error.message);
    return false;
  }
}

export async function configCommand(options) {
  console.log(chalk.gray('\n────────────────────────────────────────\n'));

  if (options.set) {
    // Set config value
    const [key, value] = options.set.split('=');
    if (!key || !value) {
      console.error(chalk.red('Invalid format. Use: --set key=value'));
      process.exit(1);
    }

    const config = loadConfig();
    config[key] = value;

    if (saveConfig(config)) {
      console.log(chalk.green(`✅ Set ${chalk.cyan(key)} = ${chalk.white(value)}\n`));
    }

  } else if (options.get) {
    // Get config value
    const config = loadConfig();
    const value = config[options.get];

    if (value !== undefined) {
      console.log(chalk.cyan(options.get) + ': ' + chalk.white(value) + '\n');
    } else {
      console.log(chalk.yellow(`No value set for ${options.get}\n`));
    }

  } else {
    // List all config
    const config = loadConfig();

    if (Object.keys(config).length === 0) {
      console.log(chalk.yellow('No configuration found\n'));
      console.log(chalk.gray('Common configuration options:\n'));
      console.log(chalk.white('  defaultUrl     - Default API URL'));
      console.log(chalk.white('  defaultNetwork - Default network (e.g., base-sepolia)'));
      console.log(chalk.white('  paymentAddress - Default payment address\n'));
      console.log(chalk.gray('Example:\n'));
      console.log(chalk.cyan('  vend config --set defaultUrl=http://localhost:3000\n'));
    } else {
      console.log(chalk.cyan.bold('📋 Configuration\n'));

      const table = new Table({
        head: [chalk.cyan('Key'), chalk.cyan('Value')],
        colWidths: [20, 60],
      });

      Object.entries(config).forEach(([key, value]) => {
        table.push([chalk.gray(key), chalk.white(value)]);
      });

      console.log(table.toString());
      console.log(chalk.gray(`\nConfig file: ${CONFIG_FILE}\n`));
    }
  }

  console.log(chalk.gray('────────────────────────────────────────\n'));
}

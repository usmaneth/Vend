import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import { getAssetTransfers } from './alchemy.js';
import { logger } from '../logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Store webhooks in a JSON file (in production, use a database)
const WEBHOOKS_FILE = path.join(__dirname, '../../data/webhooks.json');
const LAST_BLOCKS_FILE = path.join(__dirname, '../../data/last-blocks.json');

// Ensure data directory exists
const DATA_DIR = path.join(__dirname, '../../data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

/**
 * Load webhooks from file
 */
function loadWebhooks() {
  if (!fs.existsSync(WEBHOOKS_FILE)) {
    return [];
  }

  try {
    const data = fs.readFileSync(WEBHOOKS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    logger.error('Error loading webhooks:', error);
    return [];
  }
}

/**
 * Save webhooks to file
 */
function saveWebhooks(webhooks) {
  try {
    fs.writeFileSync(WEBHOOKS_FILE, JSON.stringify(webhooks, null, 2), 'utf8');
    return true;
  } catch (error) {
    logger.error('Error saving webhooks:', error);
    return false;
  }
}

/**
 * Load last checked blocks for each address
 */
function loadLastBlocks() {
  if (!fs.existsSync(LAST_BLOCKS_FILE)) {
    return {};
  }

  try {
    const data = fs.readFileSync(LAST_BLOCKS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    logger.error('Error loading last blocks:', error);
    return {};
  }
}

/**
 * Save last checked blocks
 */
function saveLastBlocks(lastBlocks) {
  try {
    fs.writeFileSync(LAST_BLOCKS_FILE, JSON.stringify(lastBlocks, null, 2), 'utf8');
    return true;
  } catch (error) {
    logger.error('Error saving last blocks:', error);
    return false;
  }
}

/**
 * Create a new webhook subscription
 */
export function createWebhook(address, webhookUrl, options = {}) {
  const webhooks = loadWebhooks();

  const webhook = {
    id: generateWebhookId(),
    address: address.toLowerCase(),
    webhookUrl,
    categories: options.categories || ['external', 'internal', 'erc20', 'erc721', 'erc1155'],
    active: true,
    created: new Date().toISOString(),
  };

  webhooks.push(webhook);
  saveWebhooks(webhooks);

  logger.info(`Created webhook ${webhook.id} for address ${address}`);
  return webhook;
}

/**
 * Get all webhooks
 */
export function listWebhooks() {
  return loadWebhooks();
}

/**
 * Get webhooks for a specific address
 */
export function getWebhooksForAddress(address) {
  const webhooks = loadWebhooks();
  return webhooks.filter(w => w.address === address.toLowerCase() && w.active);
}

/**
 * Delete a webhook
 */
export function deleteWebhook(id) {
  const webhooks = loadWebhooks();
  const filtered = webhooks.filter(w => w.id !== id);

  if (filtered.length === webhooks.length) {
    return false; // Webhook not found
  }

  saveWebhooks(filtered);
  logger.info(`Deleted webhook ${id}`);
  return true;
}

/**
 * Send webhook notification
 */
async function sendWebhookNotification(webhook, transfers) {
  try {
    await axios.post(webhook.webhookUrl, {
      webhook_id: webhook.id,
      address: webhook.address,
      timestamp: new Date().toISOString(),
      transfers,
    }, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Vend-Webhook/1.0',
      },
    });

    logger.info(`Sent webhook notification to ${webhook.webhookUrl} for ${webhook.address}`);
    return true;
  } catch (error) {
    logger.error(`Failed to send webhook to ${webhook.webhookUrl}:`, error.message);
    return false;
  }
}

/**
 * Check for new transfers and trigger webhooks
 */
export async function checkWebhooks() {
  const webhooks = loadWebhooks().filter(w => w.active);
  const lastBlocks = loadLastBlocks();

  if (webhooks.length === 0) {
    return;
  }

  logger.info(`Checking ${webhooks.length} active webhooks...`);

  // Group webhooks by address to avoid duplicate queries
  const addressWebhooks = {};
  for (const webhook of webhooks) {
    if (!addressWebhooks[webhook.address]) {
      addressWebhooks[webhook.address] = [];
    }
    addressWebhooks[webhook.address].push(webhook);
  }

  // Check each address
  for (const [address, hooks] of Object.entries(addressWebhooks)) {
    try {
      const lastBlock = lastBlocks[address] || null;

      // Query for new transfers
      const result = await getAssetTransfers({
        fromAddress: address,
        toAddress: address,
        fromBlock: lastBlock ? `0x${(parseInt(lastBlock, 16) + 1).toString(16)}` : undefined,
        category: hooks[0].categories, // Use first webhook's categories
        maxCount: 100,
      });

      if (result.transfers && result.transfers.length > 0) {
        logger.info(`Found ${result.transfers.length} new transfers for ${address}`);

        // Update last block
        const latestBlock = result.transfers[0].blockNum;
        lastBlocks[address] = latestBlock;
        saveLastBlocks(lastBlocks);

        // Notify all webhooks for this address
        for (const webhook of hooks) {
          await sendWebhookNotification(webhook, result.transfers);
        }
      }
    } catch (error) {
      logger.error(`Error checking webhooks for ${address}:`, error.message);
    }
  }
}

/**
 * Generate a unique webhook ID
 */
function generateWebhookId() {
  return 'wh_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

/**
 * Start webhook polling service
 */
export function startWebhookPolling(intervalMs = 60000) {
  logger.info(`Starting webhook polling service (interval: ${intervalMs}ms)`);

  // Initial check
  checkWebhooks();

  // Schedule periodic checks
  const intervalId = setInterval(() => {
    checkWebhooks();
  }, intervalMs);

  return intervalId;
}

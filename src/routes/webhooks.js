import express from 'express';
import { createWebhook, listWebhooks, deleteWebhook } from '../services/webhooks.js';

const router = express.Router();

/**
 * POST /api/webhooks
 * Create a new webhook subscription
 */
router.post('/', async (req, res, next) => {
  try {
    const { address, webhookUrl, categories } = req.body;

    // Validate inputs
    if (!address) {
      return res.status(400).json({ error: 'Address is required' });
    }

    if (!webhookUrl) {
      return res.status(400).json({ error: 'Webhook URL is required' });
    }

    // Validate URL format
    try {
      new URL(webhookUrl);
    } catch {
      return res.status(400).json({ error: 'Invalid webhook URL' });
    }

    // Create webhook
    const webhook = createWebhook(address, webhookUrl, { categories });

    res.status(201).json({
      success: true,
      webhook,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/webhooks
 * List all webhooks
 */
router.get('/', async (req, res, next) => {
  try {
    const webhooks = listWebhooks();

    res.json({
      success: true,
      webhooks,
      count: webhooks.length,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/webhooks/:id
 * Delete a webhook
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const deleted = deleteWebhook(id);

    if (!deleted) {
      return res.status(404).json({
        error: 'Webhook not found',
      });
    }

    res.json({
      success: true,
      message: `Webhook ${id} deleted`,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

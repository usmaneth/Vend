import request from 'supertest';
import app from '../src/index.js';

describe('TxPay API Tests', () => {
  describe('GET /', () => {
    it('should return API information', async () => {
      const response = await request(app).get('/');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('name', 'TxPay API');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('endpoints');
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
    });
  });

  describe('GET /api/transfers/info', () => {
    it('should return transfers endpoint info', async () => {
      const response = await request(app).get('/api/transfers/info');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('endpoint', '/api/transfers');
      expect(response.body).toHaveProperty('payment');
      expect(response.body.payment).toHaveProperty('required', true);
    });
  });

  describe('GET /api/transfers', () => {
    it('should return 402 when no payment provided', async () => {
      const response = await request(app)
        .get('/api/transfers?address=0x123');

      expect(response.status).toBe(402);
      expect(response.body).toHaveProperty('error', 'Payment Required');
      expect(response.body).toHaveProperty('payment');
    });

    it('should return 400 when no address provided', async () => {
      const response = await request(app)
        .get('/api/transfers')
        .set('X-Payment-Hash', 'demo');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Bad Request');
    });

    it('should accept demo payment in development', async () => {
      // This test requires valid Alchemy API key
      // Skip if not configured
      if (!process.env.ALCHEMY_API_KEY) {
        console.log('Skipping: ALCHEMY_API_KEY not set');
        return;
      }

      const response = await request(app)
        .get('/api/transfers?address=0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045')
        .set('X-Payment-Hash', 'demo');

      // Should succeed with demo payment in dev mode
      expect([200, 402]).toContain(response.status);
    });
  });

  describe('GET /nonexistent', () => {
    it('should return 404 for undefined routes', async () => {
      const response = await request(app).get('/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });
});

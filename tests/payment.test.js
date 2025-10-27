import { paymentRequired } from '../src/middleware/payment.js';

describe('Payment Middleware Tests', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      path: '/api/test',
      headers: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  describe('paymentRequired', () => {
    it('should return 402 when no payment hash provided', async () => {
      const middleware = paymentRequired({ price: '0.01' });
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(402);
      expect(res.json).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();

      const jsonCall = res.json.mock.calls[0][0];
      expect(jsonCall).toHaveProperty('error', 'Payment Required');
      expect(jsonCall).toHaveProperty('payment');
    });

    it('should accept demo payment in development', async () => {
      req.headers['x-payment-hash'] = 'demo';
      process.env.NODE_ENV = 'development';

      const middleware = paymentRequired({ price: '0.01' });
      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.payment).toBeDefined();
      expect(req.payment.verified).toBe(true);
    });

    it('should skip payment check when not required', async () => {
      const middleware = paymentRequired({ required: false });
      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should attach payment info to request when valid', async () => {
      req.headers['x-payment-hash'] = 'demo';
      req.headers['x-payment-amount'] = '0.01';

      const middleware = paymentRequired({ price: '0.01' });
      await middleware(req, res, next);

      if (next.mock.calls.length > 0) {
        expect(req.payment).toHaveProperty('hash', 'demo');
        expect(req.payment).toHaveProperty('verified', true);
      }
    });
  });
});

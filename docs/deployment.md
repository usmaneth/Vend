# Deployment Guide

This guide covers deploying Vend to production environments.

## Pre-Deployment Checklist

- [ ] Alchemy API key configured (paid plan recommended)
- [ ] Payment wallet address set
- [ ] Environment variables secured
- [ ] Payment verification implemented
- [ ] Tests passing
- [ ] HTTPS/SSL configured
- [ ] Domain name registered (optional)
- [ ] Monitoring setup

## Deployment Options

### Option 1: Vercel (Recommended for Serverless)

Vercel offers:
- Free tier for personal projects
- Automatic HTTPS
- Global CDN
- Zero configuration

#### Setup

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Create `vercel.json`**
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "src/index.js",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "src/index.js"
       }
     ],
     "env": {
       "NODE_ENV": "production"
     }
   }
   ```

3. **Deploy**
   ```bash
   vercel
   ```

4. **Set Environment Variables**
   ```bash
   vercel env add ALCHEMY_API_KEY
   vercel env add PAYMENT_ADDRESS
   vercel env add ALCHEMY_NETWORK
   vercel env add PAYMENT_NETWORK
   ```

   Or via dashboard: [vercel.com/dashboard](https://vercel.com/dashboard)

5. **Deploy to Production**
   ```bash
   vercel --prod
   ```

#### Custom Domain

```bash
vercel domains add vend.yourdomain.com
```

### Option 2: Heroku

Heroku provides:
- Simple git-based deployment
- Free tier (with limitations)
- Add-ons ecosystem
- Easy scaling

#### Setup

1. **Install Heroku CLI**
   ```bash
   curl https://cli-assets.heroku.com/install.sh | sh
   ```

2. **Login**
   ```bash
   heroku login
   ```

3. **Create App**
   ```bash
   heroku create vend-api
   ```

4. **Set Environment Variables**
   ```bash
   heroku config:set ALCHEMY_API_KEY=your_key
   heroku config:set PAYMENT_ADDRESS=0x...
   heroku config:set ALCHEMY_NETWORK=eth-mainnet
   heroku config:set PAYMENT_NETWORK=base-mainnet
   heroku config:set NODE_ENV=production
   ```

5. **Create `Procfile`**
   ```
   web: npm start
   ```

6. **Deploy**
   ```bash
   git push heroku main
   ```

7. **View Logs**
   ```bash
   heroku logs --tail
   ```

### Option 3: Docker + Cloud

Deploy anywhere with Docker support (AWS, GCP, Azure, DigitalOcean).

#### Create Dockerfile

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --production

# Copy source code
COPY src ./src

# Expose port
EXPOSE 3000

# Set environment
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Start server
CMD ["npm", "start"]
```

#### Create `.dockerignore`

```
node_modules
npm-debug.log
.env
.git
.gitignore
README.md
tests
docs
.DS_Store
```

#### Build and Run

```bash
# Build image
docker build -t vend .

# Run locally
docker run -p 3000:3000 \
  -e ALCHEMY_API_KEY=your_key \
  -e PAYMENT_ADDRESS=0x... \
  vend

# Test
curl http://localhost:3000/health
```

#### Deploy to Cloud

**AWS ECR + ECS:**
```bash
# Authenticate
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account>.dkr.ecr.us-east-1.amazonaws.com

# Tag
docker tag vend:latest <account>.dkr.ecr.us-east-1.amazonaws.com/vend:latest

# Push
docker push <account>.dkr.ecr.us-east-1.amazonaws.com/vend:latest

# Deploy via ECS console or CLI
```

**Google Cloud Run:**
```bash
# Build and deploy
gcloud run deploy vend \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars ALCHEMY_API_KEY=your_key,PAYMENT_ADDRESS=0x...
```

### Option 4: VPS (DigitalOcean, Linode, etc.)

For full control with a virtual private server.

#### Setup

1. **Provision Server**
   - Ubuntu 22.04 LTS
   - 1GB RAM minimum
   - SSH access

2. **Install Node.js**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

3. **Clone Repository**
   ```bash
   git clone https://github.com/yourusername/vend.git
   cd vend
   npm install --production
   ```

4. **Setup Environment**
   ```bash
   cp .env.example .env
   nano .env
   # Fill in values
   ```

5. **Install PM2**
   ```bash
   sudo npm install -g pm2
   ```

6. **Start with PM2**
   ```bash
   pm2 start src/index.js --name vend
   pm2 save
   pm2 startup  # Follow instructions
   ```

7. **Setup Nginx Reverse Proxy**
   ```bash
   sudo apt install nginx
   ```

   Create `/etc/nginx/sites-available/vend`:
   ```nginx
   server {
       listen 80;
       server_name vend.yourdomain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

   Enable site:
   ```bash
   sudo ln -s /etc/nginx/sites-available/vend /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

8. **Setup SSL with Let's Encrypt**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d vend.yourdomain.com
   ```

## Production Configuration

### Environment Variables

```bash
# Required
ALCHEMY_API_KEY=your_production_key
PAYMENT_ADDRESS=0xYourProductionWallet

# Network settings
ALCHEMY_NETWORK=eth-mainnet
PAYMENT_NETWORK=base-mainnet

# Server
NODE_ENV=production
PORT=3000

# Logging
LOG_LEVEL=info

# Payment
PAYMENT_PRICE_PER_QUERY=0.01
X402_FACILITATOR_URL=https://x402.coinbase.com
```

### Security Hardening

1. **Enable HTTPS Only**
   ```javascript
   // src/index.js
   if (config.nodeEnv === 'production') {
     app.use((req, res, next) => {
       if (req.header('x-forwarded-proto') !== 'https') {
         res.redirect(`https://${req.header('host')}${req.url}`);
       } else {
         next();
       }
     });
   }
   ```

2. **Add Security Headers**
   ```bash
   npm install helmet
   ```

   ```javascript
   import helmet from 'helmet';
   app.use(helmet());
   ```

3. **Rate Limiting**
   ```bash
   npm install express-rate-limit
   ```

   ```javascript
   import rateLimit from 'express-rate-limit';

   const limiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 100, // 100 requests per window
   });

   app.use('/api/', limiter);
   ```

4. **Validate Inputs**
   ```javascript
   import { ethers } from 'ethers';

   function validateAddress(address) {
     if (!ethers.utils.isAddress(address)) {
       throw new Error('Invalid Ethereum address');
     }
   }
   ```

## Monitoring

### Uptime Monitoring

Use services like:
- [UptimeRobot](https://uptimerobot.com)
- [Pingdom](https://www.pingdom.com)
- [Better Uptime](https://betteruptime.com)

Monitor:
- `GET /health` endpoint
- Response time < 2s
- 99.9% uptime target

### Application Monitoring

**Sentry for Error Tracking:**

```bash
npm install @sentry/node
```

```javascript
// src/index.js
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: config.nodeEnv,
});

app.use(Sentry.Handlers.errorHandler());
```

**LogDNA/Datadog for Logs:**

Configure log shipping from Pino:

```javascript
// src/logger.js
export const logger = pino({
  level: config.logLevel,
  formatters: {
    level: (label) => ({ level: label }),
  },
});
```

### Metrics

Track:
- Request count
- Response time
- Error rate
- Payment success rate
- Alchemy API usage

Example with Prometheus:

```bash
npm install prom-client
```

```javascript
import client from 'prom-client';

const register = new client.Registry();
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  registers: [register],
});

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

## Scaling

### Horizontal Scaling

Run multiple instances:

**PM2:**
```bash
pm2 start src/index.js -i max  # Use all CPU cores
```

**Docker Compose:**
```yaml
version: '3'
services:
  vend:
    image: vend:latest
    deploy:
      replicas: 4
    environment:
      - ALCHEMY_API_KEY
      - PAYMENT_ADDRESS
```

**Load Balancer:**
- Nginx
- HAProxy
- Cloud load balancers (ALB, GCP LB, etc.)

### Caching

Add Redis for payment verification cache:

```bash
npm install redis
```

```javascript
import { createClient } from 'redis';

const redis = createClient({ url: process.env.REDIS_URL });

async function verifyPayment(paymentHash) {
  // Check cache
  const cached = await redis.get(`payment:${paymentHash}`);
  if (cached) return JSON.parse(cached);

  // Verify
  const isValid = await verifyPaymentOnChain(paymentHash);

  // Cache result
  await redis.setEx(`payment:${paymentHash}`, 3600, JSON.stringify(isValid));

  return isValid;
}
```

## Database (Optional)

For storing payment records:

```bash
npm install pg  # PostgreSQL
```

```javascript
import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

async function recordPayment(payment) {
  await pool.query(
    'INSERT INTO payments (hash, amount, address, timestamp) VALUES ($1, $2, $3, $4)',
    [payment.hash, payment.amount, payment.address, new Date()]
  );
}
```

## Backups

### Database Backups

```bash
# PostgreSQL
pg_dump $DATABASE_URL > backup.sql

# Automated daily backups
0 2 * * * pg_dump $DATABASE_URL | gzip > /backups/vend-$(date +\%Y\%m\%d).sql.gz
```

### Configuration Backups

Store in version control (GitHub private repo):
- Environment variable templates
- Nginx configs
- PM2 configs
- Docker compose files

## Cost Estimates

### Hosting

| Service | Tier | Cost/Month |
|---------|------|------------|
| Vercel | Hobby | $0 |
| Heroku | Eco Dyno | $5 |
| DigitalOcean | Droplet 1GB | $6 |
| AWS EC2 | t3.micro | ~$8 |
| Google Cloud Run | Pay-as-you-go | ~$5-20 |

### Dependencies

| Service | Plan | Cost/Month |
|---------|------|------------|
| Alchemy | Free | $0 (limited) |
| Alchemy | Growth | $49+ |
| Redis | Upstash free | $0 |
| Monitoring | Free tier | $0 |

## Troubleshooting

### 502 Bad Gateway

- Check if app is running: `pm2 status`
- Check logs: `pm2 logs vend`
- Verify port: `netstat -tlnp | grep 3000`

### High Memory Usage

- Enable Node.js memory limits:
  ```bash
  node --max-old-space-size=512 src/index.js
  ```

### Alchemy Rate Limits

- Upgrade plan
- Implement caching
- Add retry logic with backoff

## Maintenance

### Updates

```bash
# Pull latest code
git pull origin main

# Install dependencies
npm install

# Run tests
npm test

# Restart
pm2 restart vend
```

### Monitoring Checklist

Daily:
- [ ] Check error logs
- [ ] Verify uptime
- [ ] Monitor response times

Weekly:
- [ ] Review Alchemy usage
- [ ] Check payment success rate
- [ ] Update dependencies

Monthly:
- [ ] Security updates
- [ ] Cost review
- [ ] Performance optimization

## Resources

- [Node.js Production Best Practices](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
- [PM2 Documentation](https://pm2.keymetrics.io/)
- [Nginx Configuration](https://nginx.org/en/docs/)
- [Let's Encrypt](https://letsencrypt.org/)

---

Questions? [Open an issue](https://github.com/yourusername/vend/issues)

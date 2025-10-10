# 🚀 Deployment Guide - Organizational Climate Platform

## Complete Step-by-Step Deployment Instructions

**Last Updated:** October 8, 2025  
**Version:** 1.0

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Production Deployment Options](#production-deployment-options)
4. [Docker Deployment](#docker-deployment)
5. [Vercel Deployment](#vercel-deployment)
6. [Manual Server Deployment](#manual-server-deployment)
7. [Database Setup](#database-setup)
8. [Post-Deployment](#post-deployment)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

- **Node.js**: Version 22.x or higher
- **npm**: Version 10.x or higher
- **MongoDB**: Version 7.0 or higher
- **Git**: Latest version

### Required Accounts

- **MongoDB Atlas** (recommended) or self-hosted MongoDB
- **Brevo** (formerly Sendinblue) for email services
- **Domain name** with DNS access
- **SSL Certificate** (Let's Encrypt recommended)

---

## 🏠 Local Development Setup

### Step 1: Clone Repository

```bash
git clone https://github.com/your-org/organizational-climate-platform.git
cd organizational-climate-platform
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Environment Configuration

```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local with your values
nano .env.local
```

**Minimum required variables:**

```bash
MONGODB_URI=mongodb://localhost:27017/organizational_climate
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=$(openssl rand -base64 32)
```

### Step 4: Start MongoDB (if running locally)

```bash
# Using Docker
docker run -d \
  --name mongodb \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=password \
  mongo:7.0

# OR install MongoDB locally
# Follow instructions at: https://www.mongodb.com/docs/manual/installation/
```

### Step 5: Seed Database

```bash
# Seed comprehensive test data
npm run seed:comprehensive

# Create test super admin user
npm run setup:test-user
```

### Step 6: Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` and login with:

- **Email:** 77kanish@gmail.com
- **Password:** kanish@7.7

---

## 🌐 Production Deployment Options

### Option 1: Docker Deployment (Recommended)

Best for: Full control, scalability, consistency across environments

### Option 2: Vercel Deployment

Best for: Quick deployment, automatic scaling, zero-config

### Option 3: Manual Server Deployment

Best for: Custom infrastructure, maximum control

---

## 🐳 Docker Deployment

### Step 1: Prepare Environment

```bash
# Create production .env file
cp .env.example .env.local

# Edit with production values
nano .env.local
```

**Production environment variables:**

```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/organizational_climate
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>
EMAIL_SERVER_HOST=smtp-relay.brevo.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-email@example.com
EMAIL_SERVER_PASSWORD=your-brevo-password
EMAIL_FROM=noreply@your-domain.com
BREVO_API_KEY=your-api-key
NODE_ENV=production
```

### Step 2: Build and Deploy

```bash
# Build Docker images
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f app
```

### Step 3: Verify Deployment

```bash
# Check container status
docker-compose ps

# Test health endpoint
curl http://localhost:3000/api/health
```

### Step 4: Setup Reverse Proxy (Nginx)

```nginx
# /etc/nginx/sites-available/climate-platform

server {
    listen 80;
    server_name your-domain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # Security Headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Proxy to Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/climate-platform /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Step 5: SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com
```

---

## ☁️ Vercel Deployment

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Login to Vercel

```bash
vercel login
```

### Step 3: Configure Project

Create `vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"],
  "env": {
    "MONGODB_URI": "@mongodb-uri",
    "NEXTAUTH_SECRET": "@nextauth-secret",
    "NEXTAUTH_URL": "@nextauth-url"
  }
}
```

### Step 4: Set Environment Variables

```bash
# Add environment variables
vercel env add MONGODB_URI production
vercel env add NEXTAUTH_SECRET production
vercel env add NEXTAUTH_URL production
vercel env add EMAIL_SERVER_HOST production
vercel env add EMAIL_SERVER_USER production
vercel env add EMAIL_SERVER_PASSWORD production
vercel env add BREVO_API_KEY production
```

### Step 5: Deploy

```bash
# Deploy to production
vercel --prod
```

### Note about MongoDB on Vercel

Vercel requires **MongoDB Atlas** (not local MongoDB). Set up:

1. Create MongoDB Atlas account
2. Create cluster
3. Whitelist Vercel IPs (or use 0.0.0.0/0 for all)
4. Get connection string
5. Add to Vercel environment variables

---

## 🖥️ Manual Server Deployment (Ubuntu/Debian)

### Step 1: Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 (process manager)
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx

# Install MongoDB (optional, if self-hosting)
# Follow: https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-ubuntu/
```

### Step 2: Clone and Setup Application

```bash
# Create application directory
sudo mkdir -p /var/www/climate-platform
sudo chown $USER:$USER /var/www/climate-platform

# Clone repository
cd /var/www/climate-platform
git clone https://github.com/your-org/organizational-climate-platform.git .

# Install dependencies
npm ci --production

# Create .env.local file
cp .env.example .env.local
nano .env.local  # Fill in production values
```

### Step 3: Build Application

```bash
# Build for production
npm run build

# Seed database (first time only)
npm run seed:comprehensive
npm run setup:test-user
```

### Step 4: Start with PM2

```bash
# Start application
pm2 start npm --name "climate-platform" -- start

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Run the command it outputs

# Monitor
pm2 status
pm2 logs climate-platform
```

### Step 5: Configure Nginx

Follow the Nginx configuration from Docker deployment section above.

---

## 🗄️ Database Setup

### MongoDB Atlas (Recommended for Production)

#### Step 1: Create Cluster

1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up or login
3. Create new project
4. Build a database (Free M0 or paid tier)

#### Step 2: Configure Network Access

1. Go to Network Access
2. Add IP Address
   - For development: Your IP
   - For production: Server IP or 0.0.0.0/0 (less secure)

#### Step 3: Create Database User

1. Go to Database Access
2. Add new database user
3. Use strong password
4. Grant `readWrite` permissions

#### Step 4: Get Connection String

1. Click "Connect" on your cluster
2. Choose "Connect your application"
3. Copy connection string
4. Replace `<password>` and `<dbname>`

```
mongodb+srv://username:<password>@cluster.mongodb.net/organizational_climate?retryWrites=true&w=majority
```

#### Step 5: Test Connection

```bash
# Install MongoDB Shell (optional)
brew install mongosh  # macOS
# OR
wget https://downloads.mongodb.com/compass/mongosh-1.10.0-linux-x64.tgz  # Linux

# Test connection
mongosh "mongodb+srv://cluster.mongodb.net/" --username your-username
```

### Self-Hosted MongoDB

```bash
# Install MongoDB 7.0
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update
sudo apt install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Secure MongoDB
sudo mongosh
> use admin
> db.createUser({user: "admin", pwd: "strong_password", roles: ["root"]})
> exit

# Enable authentication
sudo nano /etc/mongod.conf
# Add:
# security:
#   authorization: enabled

sudo systemctl restart mongod
```

---

## ✅ Post-Deployment

### Step 1: Verification

```bash
# Health check
curl https://your-domain.com/api/health

# Should return: {"status":"ok"}
```

### Step 2: Create First Super Admin

```bash
# If not already created
npm run setup:test-user
```

### Step 3: Test Core Functionality

1. Login at https://your-domain.com
2. Create a company
3. Create departments
4. Invite users
5. Create survey
6. Verify emails sent

### Step 4: Monitoring Setup

```bash
# Setup uptime monitoring (UptimeRobot, Pingdom, etc.)
# Setup error tracking (Sentry)
# Setup performance monitoring (New Relic, Datadog)
```

### Step 5: Backup Configuration

```bash
# MongoDB Atlas: Enable automatic backups
# Self-hosted: Setup cron job

# Backup script
0 2 * * * mongodump --uri="mongodb://localhost:27017/organizational_climate" --out=/backups/$(date +\%Y\%m\%d)
```

---

## 🐛 Troubleshooting

### Application Won't Start

```bash
# Check logs
pm2 logs climate-platform
# OR
docker-compose logs app

# Common issues:
# 1. Missing environment variables
# 2. MongoDB connection failed
# 3. Port already in use
```

### Database Connection Errors

```bash
# Test MongoDB connection
mongosh "$MONGODB_URI"

# Check:
# - URI format correct
# - Credentials valid
# - Network access configured (Atlas)
# - MongoDB service running (self-hosted)
```

### Email Not Sending

```bash
# Test Brevo credentials
curl -X POST https://api.brevo.com/v3/smtp/email \
  -H "api-key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"sender":{"email":"test@example.com"},"to":[{"email":"test@example.com"}],"subject":"Test","htmlContent":"<p>Test</p>"}'

# Check:
# - API key valid
# - Sender email verified
# - SMTP credentials correct
```

### NextAuth Errors

```bash
# Common issues:
# 1. NEXTAUTH_URL doesn't match domain
# 2. NEXTAUTH_SECRET not set or too short
# 3. Cookies being blocked

# Check browser console for errors
# Check Network tab for auth requests
```

---

## 📊 Performance Optimization

### Enable Redis Caching (Optional)

```bash
# Install Redis
sudo apt install redis-server

# Or with Docker
docker run -d --name redis -p 6379:6379 redis:7-alpine

# Add to .env.local
REDIS_URL=redis://localhost:6379
```

### CDN Configuration

Use Vercel, Cloudflare, or similar CDN for:

- Static assets
- Image optimization
- DDoS protection
- Global distribution

---

## 🔒 Security Checklist

- [ ] HTTPS enabled with valid SSL certificate
- [ ] Strong passwords for all accounts
- [ ] Database access restricted by IP
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] Security headers configured
- [ ] Regular backups automated
- [ ] Monitoring and alerting active

---

## 📞 Support

For deployment issues:

1. Check troubleshooting section
2. Review application logs
3. Check GitHub issues
4. Contact development team

---

**Next Steps:** Review [PRODUCTION_READINESS_CHECKLIST.md](./PRODUCTION_READINESS_CHECKLIST.md)


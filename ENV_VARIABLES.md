# 🔐 Environment Variables Documentation

## Organizational Climate Platform - Configuration Guide

---

## 📋 Quick Setup

Copy this template to `.env.local` in your project root:

```bash
# =================================================================
# ORGANIZATIONAL CLIMATE PLATFORM - Environment Variables
# =================================================================

# -----------------------------------------------------------------
# DATABASE (Required)
# -----------------------------------------------------------------
MONGODB_URI=mongodb://localhost:27017/organizational_climate

# For Docker MongoDB setup
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=change_this_password
MONGO_INITDB_DATABASE=organizational_climate

# -----------------------------------------------------------------
# NEXTAUTH (Required)
# -----------------------------------------------------------------
NEXTAUTH_URL=http://localhost:3000
# Generate with: openssl rand -base64 32
NEXTAUTH_SECRET=your_super_secret_key_min_32_chars

# -----------------------------------------------------------------
# EMAIL (Required for invitations)
# -----------------------------------------------------------------
EMAIL_SERVER_HOST=smtp-relay.brevo.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your_email@example.com
EMAIL_SERVER_PASSWORD=your_brevo_smtp_password
EMAIL_FROM=noreply@your-domain.com
BREVO_API_KEY=your_brevo_api_key

# -----------------------------------------------------------------
# OPTIONAL SERVICES
# -----------------------------------------------------------------
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# OpenAI for AI features
OPENAI_API_KEY=sk-your_openai_api_key

# Internal API for cron jobs
INTERNAL_API_KEY=generate_random_key

# Node Environment
NODE_ENV=development
PORT=3000

# -----------------------------------------------------------------
# TESTING
# -----------------------------------------------------------------
TEST_USER_EMAIL=77kanish@gmail.com
TEST_USER_PASSWORD=kanish@7.7
```

---

## 📖 Variable Details

### Database Configuration

#### `MONGODB_URI` (Required)

MongoDB connection string.

**Development:**

```bash
MONGODB_URI=mongodb://localhost:27017/organizational_climate
```

**Production (MongoDB Atlas):**

```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/organizational_climate?retryWrites=true&w=majority
```

**Docker:**

```bash
MONGODB_URI=mongodb://admin:password@mongodb:27017/organizational_climate?authSource=admin
```

---

### NextAuth Configuration

#### `NEXTAUTH_URL` (Required)

Your application's public URL. Must match exactly (no trailing slash).

**Development:**

```bash
NEXTAUTH_URL=http://localhost:3000
```

**Production:**

```bash
NEXTAUTH_URL=https://your-domain.com
```

#### `NEXTAUTH_SECRET` (Required)

Cryptographically secure random string (minimum 32 characters).

**Generate:**

```bash
openssl rand -base64 32
```

**Example:**

```bash
NEXTAUTH_SECRET=8xK9mP2vL5nQ7wR4tY1uI6oP3aS8dF2gH5jK9lM3nB7cV4x
```

**⚠️ CRITICAL:** Change this for production! Never share or commit this value.

---

### Email Configuration (Brevo)

#### Setting up Brevo

1. Create account at https://www.brevo.com/
2. Verify your email address
3. Get SMTP credentials from Settings → SMTP & API
4. Get API key from Settings → API Keys

#### `EMAIL_SERVER_HOST` (Required for email)

```bash
EMAIL_SERVER_HOST=smtp-relay.brevo.com
```

#### `EMAIL_SERVER_PORT` (Required for email)

```bash
EMAIL_SERVER_PORT=587
```

#### `EMAIL_SERVER_USER` (Required for email)

Your Brevo account email.

```bash
EMAIL_SERVER_USER=your-email@example.com
```

#### `EMAIL_SERVER_PASSWORD` (Required for email)

Your Brevo SMTP password (not your account password).

```bash
EMAIL_SERVER_PASSWORD=xsmtpsib-a1b2c3d4...
```

#### `EMAIL_FROM` (Required for email)

Sender email address (must be verified in Brevo).

```bash
EMAIL_FROM=noreply@your-domain.com
```

#### `BREVO_API_KEY` (Required for transactional emails)

Brevo API v3 key.

```bash
BREVO_API_KEY=xkeysib-a1b2c3d4e5f6...
```

---

### OAuth Providers (Optional)

#### Google OAuth

1. Go to https://console.cloud.google.com/
2. Create project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `https://your-domain.com/api/auth/callback/google`

```bash
GOOGLE_CLIENT_ID=123456789-abc123.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abc123def456
```

---

### AI Features (Optional)

#### OpenAI API

For AI-powered analytics, sentiment analysis, and insights.

1. Create account at https://platform.openai.com/
2. Generate API key
3. Add billing information

```bash
OPENAI_API_KEY=sk-proj-abc123def456...
```

**Cost Management:**

- Set usage limits in OpenAI dashboard
- Monitor usage regularly
- Consider using GPT-3.5-turbo for cost savings

---

### Security & Internal APIs

#### `INTERNAL_API_KEY` (Recommended)

For authenticating cron jobs and internal services.

**Generate:**

```bash
openssl rand -hex 32
```

```bash
INTERNAL_API_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

---

### Application Settings

#### `NODE_ENV`

Environment mode.

**Options:**

- `development` - Local development
- `production` - Production deployment
- `test` - Automated testing

```bash
NODE_ENV=production
```

#### `PORT` (Optional)

Application port. Defaults to 3000.

```bash
PORT=3000
```

---

## 🔒 Security Best Practices

### Do's ✅

- ✅ Use `.env.local` for local development
- ✅ Use environment-specific configs
- ✅ Rotate secrets regularly (quarterly)
- ✅ Use strong, random passwords
- ✅ Keep `.env.local` in `.gitignore`
- ✅ Use environment variables in CI/CD
- ✅ Encrypt sensitive data at rest
- ✅ Restrict database access by IP

### Don'ts ❌

- ❌ Never commit `.env.local` to git
- ❌ Never share secrets in plain text
- ❌ Never use production secrets in development
- ❌ Never expose `NEXTAUTH_SECRET` to client
- ❌ Never use weak passwords
- ❌ Never share API keys publicly
- ❌ Never log sensitive environment variables

---

## 🌍 Environment-Specific Configurations

### Development

```bash
MONGODB_URI=mongodb://localhost:27017/organizational_climate
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=dev-secret-min-32-chars-change-in-prod
NODE_ENV=development
```

### Staging

```bash
MONGODB_URI=mongodb+srv://user:pass@staging-cluster.mongodb.net/climate_staging
NEXTAUTH_URL=https://staging.your-domain.com
NEXTAUTH_SECRET=<strong-random-secret>
NODE_ENV=production
```

### Production

```bash
MONGODB_URI=mongodb+srv://user:pass@prod-cluster.mongodb.net/organizational_climate
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=<strong-random-secret>
NODE_ENV=production
EMAIL_SERVER_HOST=smtp-relay.brevo.com
EMAIL_SERVER_USER=production@your-domain.com
BREVO_API_KEY=<production-api-key>
GOOGLE_CLIENT_ID=<production-oauth-id>
SENTRY_DSN=<production-sentry-dsn>
```

---

## 🧪 Testing Configuration

### Test User Credentials

For automated testing with TestSprite:

```bash
TEST_USER_EMAIL=77kanish@gmail.com
TEST_USER_PASSWORD=kanish@7.7
```

**Setup test user:**

```bash
npm run setup:test-user
```

---

## 📦 Deployment Platforms

### Vercel

Add environment variables in dashboard:

1. Go to Settings → Environment Variables
2. Add each variable for Production/Preview/Development
3. Redeploy for changes to take effect

**Note:** Vercel requires MongoDB Atlas (cannot use local MongoDB)

### Docker

Use `.env.local` file or docker-compose environment section:

```yaml
services:
  app:
    environment:
      - MONGODB_URI=${MONGODB_URI}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - NEXTAUTH_URL=${NEXTAUTH_URL}
    env_file:
      - .env.local
```

### PM2

PM2 automatically loads `.env.local`:

```bash
pm2 start npm --name "climate-platform" -- start
```

Or specify env file:

```bash
pm2 start npm --name "climate-platform" -- start --env production
```

---

## ✅ Validation Checklist

Before deploying, verify:

- [ ] All required variables set
- [ ] No placeholder values (e.g., "your_password")
- [ ] Secrets are strong and random
- [ ] URLs match deployment environment
- [ ] Database connection tested
- [ ] Email sending tested
- [ ] OAuth providers configured (if used)
- [ ] `.env.local` not committed to git
- [ ] Production secrets different from development

---

## 🔍 Debugging

### Test Database Connection

```bash
# Install MongoDB Shell
npm install -g mongosh

# Test connection
mongosh "$MONGODB_URI"
```

### Test Email Configuration

```bash
# Run Brevo test
npm run test:brevo-email
```

### Verify Environment Variables

```javascript
// Add temporary debugging (remove after testing)
console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');
console.log('EMAIL_FROM:', process.env.EMAIL_FROM);
```

---

## 📞 Support

For environment configuration issues:

1. Check this documentation
2. Review [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
3. Contact development team

---

**Last Updated:** October 8, 2025


# Docker Deployment Guide

This guide covers how to deploy the Organizational Climate Platform using Docker and Docker Compose.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- At least 2GB RAM available
- 10GB disk space

## Quick Start

### 1. Clone and Setup

```bash
git clone <repository-url>
cd organizational-climate-platform
```

### 2. Environment Configuration

```bash
# Copy the environment template
cp .env.production.template .env.local

# Edit the environment file with your values
nano .env.local
```

**Required Environment Variables:**

```env
# Database
MONGODB_URI=mongodb://admin:password@mongodb:27017/organizational_climate?authSource=admin

# Authentication
NEXTAUTH_SECRET=your_secure_secret_minimum_32_characters
NEXTAUTH_URL=https://your-domain.com

# MongoDB Docker
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=your_secure_password
```

### 3. Build and Deploy

```bash
# Build and start all services
docker-compose up -d

# Check logs
docker-compose logs -f app

# Check status
docker-compose ps
```

### 4. Access the Application

- Application: http://localhost:3000
- MongoDB: localhost:27017
- Redis: localhost:6379

## Production Deployment

### Using Coolify

1. **Create New Project** in Coolify
2. **Connect Repository** to your Git repository
3. **Set Environment Variables** in Coolify dashboard:
   ```
   MONGODB_URI=mongodb://your-mongodb-connection
   NEXTAUTH_SECRET=your-secret
   NEXTAUTH_URL=https://your-domain.com
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   OPENAI_API_KEY=your-openai-key
   ```
4. **Configure Build Settings**:
   - Build Command: `npm run build`
   - Start Command: `npm start`
   - Port: `3000`
5. **Deploy** the application

### Manual Docker Deployment

```bash
# Build the image
docker build -t organizational-climate-platform .

# Run with environment variables
docker run -d \
  --name climate-app \
  -p 3000:3000 \
  -e MONGODB_URI="your-mongodb-uri" \
  -e NEXTAUTH_SECRET="your-secret" \
  -e NEXTAUTH_URL="https://your-domain.com" \
  organizational-climate-platform
```

## Database Setup

### MongoDB Configuration

The application requires MongoDB 5.0+. The docker-compose includes a MongoDB service with:

- **Port**: 27017
- **Database**: organizational_climate
- **Authentication**: Enabled
- **Indexes**: Automatically created via init script

### External MongoDB

To use an external MongoDB (recommended for production):

1. Update `MONGODB_URI` in your environment
2. Remove the `mongodb` service from docker-compose.yml
3. Ensure your MongoDB has the required indexes (run mongo-init.js manually)

## Monitoring and Maintenance

### Health Checks

```bash
# Check application health
curl http://localhost:3000/api/health

# Check container status
docker-compose ps

# View logs
docker-compose logs -f app
```

### Backup

```bash
# Backup MongoDB data
docker-compose exec mongodb mongodump --out /backup

# Copy backup from container
docker cp $(docker-compose ps -q mongodb):/backup ./mongodb-backup
```

### Updates

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## Troubleshooting

### Common Issues

1. **Build Failures**

   ```bash
   # Clear Docker cache
   docker system prune -a

   # Rebuild without cache
   docker-compose build --no-cache
   ```

2. **Database Connection Issues**

   ```bash
   # Check MongoDB logs
   docker-compose logs mongodb

   # Test connection
   docker-compose exec mongodb mongo -u admin -p password
   ```

3. **Memory Issues**

   ```bash
   # Increase Docker memory limit
   # Check Docker Desktop settings

   # Monitor memory usage
   docker stats
   ```

4. **Port Conflicts**

   ```bash
   # Check what's using the port
   netstat -ano | findstr :3000

   # Use different ports in docker-compose.yml
   ports:
     - "3001:3000"
   ```

### Logs and Debugging

```bash
# Application logs
docker-compose logs -f app

# Database logs
docker-compose logs -f mongodb

# All services logs
docker-compose logs -f

# Enter container for debugging
docker-compose exec app sh
```

## Security Considerations

1. **Environment Variables**: Never commit real secrets to version control
2. **Database Security**: Use strong passwords and enable authentication
3. **Network Security**: Use Docker networks to isolate services
4. **SSL/TLS**: Always use HTTPS in production
5. **Updates**: Keep Docker images and dependencies updated

## Performance Optimization

1. **Multi-stage Build**: The Dockerfile uses multi-stage builds to reduce image size
2. **Node.js Optimization**: Uses Alpine Linux for smaller images
3. **Caching**: Leverage Docker layer caching for faster builds
4. **Resource Limits**: Set appropriate CPU and memory limits

```yaml
# Add to docker-compose.yml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

## Support

For deployment issues:

1. Check the logs first
2. Verify environment variables
3. Ensure all required services are running
4. Check network connectivity
5. Review Docker and system resources

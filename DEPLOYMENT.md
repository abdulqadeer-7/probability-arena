# Production Deployment Guide

This guide covers deploying AeroArcade to a production environment using Docker Compose, Nginx, and Let's Encrypt SSL certificates.

---

## Prerequisites

- **Linux server** (Ubuntu 22.04 LTS recommended) with:
  - Docker Engine 24+ and Docker Compose plugin
  - Git
  - Domain name (e.g., `aeroarcade.com`) pointed to the server's public IP
  - Ports 80 and 443 open in the firewall
- **PostgreSQL 16** (Docker image)
- **Redis 7** (Docker image)
- **Node.js 20+** (only needed if building outside Docker)

---

## Environment Configuration

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/probability-arena.git
cd probability-arena
```

### 2. Configure Production Environment

Create `.env` from the template:

```bash
cp .env.example .env
```

Edit `.env` with production values:

```env
# Database
DATABASE_URL=postgresql://aeroarcade:strong-password@postgres:5432/aeroarcade
POSTGRES_USER=aeroarcade
POSTGRES_PASSWORD=strong-password
POSTGRES_DB=aeroarcade

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=strong-redis-password

# JWT — Generate strong secrets (use `openssl rand -hex 64`)
JWT_SECRET=replace-with-openssl-rand-hex-64-output
JWT_REFRESH_SECRET=replace-with-different-openssl-rand-hex-64-output

# App
NODE_ENV=production
PORT=4000
CORS_ORIGIN=https://aeroarcade.com

# Frontend (Next.js)
NEXT_PUBLIC_API_URL=https://aeroarcade.com/api
NEXT_PUBLIC_WS_URL=https://aeroarcade.com
```

Generate JWT secrets:

```bash
openssl rand -hex 64
```

---

## SSL Certificate Setup (Let's Encrypt)

### Option A: Certbot (standalone)

```bash
# Install Certbot
sudo apt update
sudo apt install certbot -y

# Obtain certificate (stop any process on port 80 first)
sudo certbot certonly --standalone -d aeroarcade.com -d www.aeroarcade.com

# Certificates are stored at:
# /etc/letsencrypt/live/aeroarcade.com/fullchain.pem
# /etc/letsencrypt/live/aeroarcade.com/privkey.pem
```

### Option B: Certbot with Docker

```bash
docker run -it --rm -p 80:80 -v certs:/etc/letsencrypt certbot/certbot certonly --standalone -d aeroarcade.com
```

### Auto-Renewal

```bash
# Add crontab for auto-renewal
echo "0 3 * * * docker run --rm -v certs:/etc/letsencrypt -v certs-lib:/var/lib/letsencrypt certbot/certbot renew && docker compose -f /path/to/docker-compose.yml exec nginx nginx -s reload" | crontab -
```

### Copy Certificates for Nginx

```bash
sudo mkdir -p /etc/ssl/certs /etc/ssl/private
sudo cp /etc/letsencrypt/live/aeroarcade.com/fullchain.pem /etc/ssl/certs/aeroarcade.crt
sudo cp /etc/letsencrypt/live/aeroarcade.com/privkey.pem /etc/ssl/private/aeroarcade.key
```

---

## Docker Compose Production Deployment

### 1. Update docker-compose.yml

Ensure the compose file uses production builds. The existing `docker/docker-compose.yml` already has the correct configuration with health checks, networks, and volume mounts.

### 2. Add Nginx Service

Add an Nginx service to `docker/docker-compose.yml`:

```yaml
nginx:
  image: nginx:1.25-alpine
  container_name: aeroarcade-nginx
  restart: unless-stopped
  ports:
    - "80:80"
    - "443:443"
  volumes:
    - ./docker/nginx.conf:/etc/nginx/conf.d/default.conf:ro
    - /etc/ssl/certs/aeroarcade.crt:/etc/ssl/certs/aeroarcade.crt:ro
    - /etc/ssl/private/aeroarcade.key:/etc/ssl/private/aeroarcade.key:ro
    - certbot-www:/var/www/certbot
  networks:
    - aero-arcade
  depends_on:
    - backend
    - frontend
```

### 3. Build and Deploy

```powershell
# Build images and start all services
docker compose -f docker\docker-compose.yml --env-file .env up -d --build

# Verify all containers are running
docker compose -f docker\docker-compose.yml ps

# View logs
docker compose -f docker\docker-compose.yml logs -f
```

### 4. Run Database Migrations

```bash
docker exec aeroarcade-backend npx prisma migrate deploy
```

### 5. Seed the Database (First Deployment Only)

```bash
docker exec aeroarcade-backend npx prisma db seed
```

---

## Database Migration Strategy

### Development

```bash
npx prisma migrate dev --name <migration-name>
```

### Production

```bash
# Generate the migration client
npx prisma generate

# Apply pending migrations
npx prisma migrate deploy
```

### Rollback a Migration

```bash
# Check migration history
npx prisma migrate status

# Rollback the last migration (if still possible)
npx prisma migrate resolve --rolled-back "<migration-name>"
```

> **Warning**: Prisma does not natively support rollbacks. Always back up the database before deploying migrations.

---

## Backup Procedures

### Database Backup (PostgreSQL)

```bash
# Manual backup
docker exec aeroarcade-postgres pg_dump -U aeroarcade aeroarcade > backup-$(date +%Y%m%d-%H%M%S).sql

# Automated backup script
# Add to crontab: 0 2 * * * /path/to/backup.sh
```

**`scripts/backup.sh`**:
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/aeroarcade"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
mkdir -p $BACKUP_DIR
docker exec aeroarcade-postgres pg_dump -U aeroarcade aeroarcade | gzip > $BACKUP_DIR/db-$TIMESTAMP.sql.gz
find $BACKUP_DIR -name "db-*.sql.gz" -mtime +30 -delete
```

### Restore from Backup

```bash
gunzip < backup-20240101-020000.sql.gz | docker exec -i aeroarcade-postgres psql -U aeroarcade aeroarcade
```

### Redis Backup

Redis AOF persistence is enabled (`--appendonly yes`). The AOF file is stored in the Redis container volume. For manual backup:

```bash
docker exec aeroarcade-redis redis-cli -a $REDIS_PASSWORD SAVE
docker cp aeroarcade-redis:/data/dump.rdb ./redis-backup.rdb
```

---

## Monitoring and Logging

### Container Health

```bash
docker ps --filter "name=aeroarcade-*"
docker compose -f docker\docker-compose.yml ps
```

### View Logs

```bash
# All services
docker compose -f docker\docker-compose.yml logs -f

# Specific service
docker compose -f docker\docker-compose.yml logs -f backend
docker compose -f docker\docker-compose.yml logs -f frontend

# Last 100 lines
docker compose -f docker\docker-compose.yml logs --tail=100 backend
```

### Health Check Endpoint

The Nginx config exposes `/health`:

```bash
curl https://aeroarcade.com/health
# Response: healthy
```

### Prometheus & Grafana (Optional)

Add to `docker-compose.yml`:

```yaml
prometheus:
  image: prom/prometheus:latest
  volumes:
    - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
  ports:
    - "9090:9090"

grafana:
  image: grafana/grafana:latest
  ports:
    - "3001:3000"
  depends_on:
    - prometheus
```

---

## Scaling Considerations

### Horizontal Scaling (Multiple Backend Instances)

1. Add more backend containers in `docker-compose.yml`:
```yaml
backend:
  deploy:
    replicas: 3
```

2. Use a Redis-backed session store (already configured).
3. Update Nginx upstream to include all backend instances:
```nginx
upstream backend {
    server backend:4000;
    # Add more servers if using multiple nodes
}
```

### Database Scaling

- Add read replicas for leaderboard queries.
- Use connection pooling (e.g., PgBouncer) for high concurrent connections.
- Index key columns (already indexed: user IDs, game IDs, timestamps, etc.).

---

## Performance Optimization

### 1. Image Compression

- Use Next.js built-in image optimization (already configured).
- Serve WebP format with fallback to PNG/JPEG.
- Compress game asset SVGs with SVGO.

### 2. Lazy Loading

- Next.js dynamic imports for page components.
- Intersection Observer for infinite scroll on leaderboard/history.
- React.lazy() for heavy chart components (Recharts).

```tsx
const GameHistoryChart = dynamic(() => import('@/components/GameHistoryChart'), {
  loading: () => <Skeleton className="h-64" />,
});
```

### 3. Code Splitting

- Next.js automatically splits code by pages.
- Game components are separate bundles loaded on demand.
- Library splitting: `framer-motion`, `recharts`, `react-hook-form` are separate vendor chunks.

### 4. Database Indexing

All indexes are defined in `schema.prisma`:
- `GameRound`: `[gameId]`, `[userId]`, `[createdAt]`
- `LeaderboardEntry`: `[gameId, period, score]`
- `Session`: `[userId]`, `[refreshToken]`, `[expiresAt]`
- `Notification`: `[userId, isRead]`, `[createdAt]`
- Full list in `backend/prisma/schema.prisma`

### 5. Redis Caching

- Session storage (JWT refresh tokens).
- Rate limiting counters.
- Leaderboard caching (invalidation on new game rounds).
- Feature flag caching.

### 6. CDN for Static Assets

- In production, serve Next.js static assets through a CDN (Cloudflare, CloudFront, etc.).
- Configure CDN origin to point to `https://aeroarcade.com`.
- Set cache headers for immutable assets (`_next/static/*`).

---

## Security Hardening

### Nginx Security Headers

Already configured in `docker/nginx.conf:32-37`:
- `Strict-Transport-Security` (HSTS) — 2-year max-age, include subdomains
- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` — blocks camera, microphone, geolocation

### Docker Security

- Run containers as non-root user (Dockerfiles use `tini` entrypoint).
- Use read-only root filesystem where possible.
- Scan images for vulnerabilities:
  ```bash
  docker scout quickstart
  docker scout analysis aeroarcade-backend:latest
  ```

### Network Security

- All services run on an isolated Docker bridge network (`aero-arcade`).
- Only Nginx exposes ports 80/443 to the host.
- PostgreSQL and Redis are not exposed externally.
- Enable UFW:
  ```bash
  sudo ufw default deny incoming
  sudo ufw allow 22/tcp
  sudo ufw allow 80/tcp
  sudo ufw allow 443/tcp
  sudo ufw enable
  ```

---

## Regular Maintenance Tasks

| Frequency | Task | Command |
|-----------|------|---------|
| Daily | Check container health | `docker ps --filter "name=aeroarcade-*"` |
| Daily | Database backup | See backup script above |
| Weekly | Apply OS security patches | `sudo apt update && sudo apt upgrade -y` |
| Weekly | Check logs for errors | `docker compose logs --tail=50 backend` |
| Monthly | Renew SSL certificate | `certbot renew` (automatic with cron) |
| Monthly | Review and prune Docker images | `docker image prune -a` |
| Monthly | npm audit on dependencies | `npm audit --production` |
| Quarterly | Full deployment test | Restore backup to staging environment |
| Quarterly | Review access logs | `docker compose logs nginx \| grep -E " 401|403|500"` |

---

## Rollback Procedures

### Application Rollback

```bash
# Revert to previous Docker image
docker compose -f docker\docker-compose.yml down
git checkout <previous-stable-tag>
docker compose -f docker\docker-compose.yml up -d --build
```

### Database Rollback

```bash
# 1. Stop the application
docker compose -f docker\docker-compose.yml stop backend frontend

# 2. Restore database from backup
gunzip < backup-20240101-020000.sql.gz | docker exec -i aeroarcade-postgres psql -U aeroarcade aeroarcade

# 3. Reset Prisma migrations to match backup state
docker exec aeroarcade-backend npx prisma migrate resolve --rolled-back "<last-migration>"

# 4. Start the application
docker compose -f docker\docker-compose.yml start backend frontend
```

### Full Server Rollback

If the deployment is completely broken:

```bash
# 1. SSH into server
# 2. Stop all containers
docker compose -f docker\docker-compose.yml down

# 3. Restore entire stack from the previous stable tag
git stash
git checkout tags/v1.0.0

# 4. Restore database from backup
# 5. Rebuild and deploy
docker compose -f docker\docker-compose.yml up -d --build
```

---

## Deployment Checklist

- [ ] Domain DNS records point to server IP
- [ ] SSL certificates obtained and mounted
- [ ] `.env` configured with production secrets
- [ ] `CORS_ORIGIN` set to the production domain
- [ ] `NODE_ENV=production`
- [ ] `JWT_SECRET` and `JWT_REFRESH_SECRET` are strong random values
- [ ] Database password is strong and unique
- [ ] Redis password is set (not empty)
- [ ] Firewall configured (ports 22, 80, 443)
- [ ] Docker images built and pushed to registry
- [ ] Database migrations applied
- [ ] Seed data loaded (first deployment)
- [ ] SSL certificate auto-renewal configured
- [ ] Database backup cron job configured
- [ ] Health check endpoint verified
- [ ] Monitoring alerts configured
- [ ] Load testing completed

# CloudForge Deployment Guide

Complete step-by-step instructions to deploy CloudForge using Docker.

---

## Prerequisites

Before you begin, ensure you have:

1. **Docker** (v20.10 or later) - [Install Docker](https://docs.docker.com/get-docker/)
2. **Docker Compose** (v2.0 or later) - Usually included with Docker Desktop
3. **Git** - To clone the repository

Verify installation:
```bash
docker --version
docker compose version
```

---

## Quick Start (Development)

### Step 1: Clone the Repository
```bash
git clone <your-repo-url>
cd cloudforge
```

### Step 2: Create Environment File
```bash
cp .env.docker.example .env.docker
```

Edit `.env.docker` and add your API keys (optional for basic testing).

### Step 3: Start All Services
```bash
docker compose -f docker-compose.dev.yml up --build
```

### Step 4: Run Database Migrations
In a new terminal:
```bash
docker compose -f docker-compose.dev.yml exec app npm run db:push
```

### Step 5: Access the Application
- **App**: http://localhost:5000
- **Database Admin**: http://localhost:8080 (Adminer)
  - System: PostgreSQL
  - Server: db
  - Username: cloudforge
  - Password: cloudforge123
  - Database: cloudforge

---

## Production Deployment

### Step 1: Prepare Environment

Create production environment file:
```bash
cp .env.docker.example .env.docker
```

Edit `.env.docker` with production values:
```bash
# Generate a secure session secret
openssl rand -base64 32
```

**Required variables:**
- `SESSION_SECRET` - Strong random string (required)
- `RAZORPAY_KEY_ID` - For payments (required if using payments)
- `RAZORPAY_KEY_SECRET` - For payments (required if using payments)
- `GOOGLE_API_KEY` - For AI features (required if using AI)

### Step 2: Build Production Image
```bash
docker compose build
```

### Step 3: Start Services
```bash
docker compose up -d
```

### Step 4: Run Database Migrations
```bash
docker compose exec app npm run db:push
```

### Step 5: Verify Deployment
```bash
# Check running containers
docker compose ps

# Check application logs
docker compose logs -f app

# Test health endpoint
curl http://localhost:5000/api/health
```

---

## Deploying to Cloud Providers

### Option A: AWS EC2 / DigitalOcean Droplet

1. **Create a server** (Ubuntu 22.04 recommended, minimum 2GB RAM)

2. **SSH into the server**
```bash
ssh root@your-server-ip
```

3. **Install Docker**
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

4. **Clone and deploy**
```bash
git clone <your-repo-url>
cd cloudforge
cp .env.docker.example .env.docker
nano .env.docker  # Add your production values
docker compose up -d --build
docker compose exec app npm run db:push
```

5. **Configure firewall**
```bash
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

6. **Set up reverse proxy** (Nginx)
```bash
sudo apt install nginx -y

# Create config
sudo nano /etc/nginx/sites-available/cloudforge
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
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

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/cloudforge /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

7. **Add SSL with Let's Encrypt**
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com
```

---

### Option B: Railway / Render

These platforms support Docker deployments directly.

**Railway:**
1. Connect your GitHub repository
2. Railway auto-detects the Dockerfile
3. Add environment variables in Railway dashboard
4. Deploy

**Render:**
1. Create a new Web Service
2. Connect your repository
3. Set build command: `docker build -t app .`
4. Set start command: `docker run -p 5000:5000 app`
5. Add environment variables

---

### Option C: Kubernetes (Advanced)

For enterprise deployments, use Kubernetes:

```yaml
# kubernetes/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cloudforge
spec:
  replicas: 3
  selector:
    matchLabels:
      app: cloudforge
  template:
    metadata:
      labels:
        app: cloudforge
    spec:
      containers:
      - name: cloudforge
        image: your-registry/cloudforge:latest
        ports:
        - containerPort: 5000
        envFrom:
        - secretRef:
            name: cloudforge-secrets
        resources:
          limits:
            memory: "512Mi"
            cpu: "500m"
```

---

## Managing the Deployment

### View Logs
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f app
docker compose logs -f db
```

### Restart Services
```bash
docker compose restart

# Restart specific service
docker compose restart app
```

### Update Application
```bash
git pull
docker compose build app
docker compose up -d app
docker compose exec app npm run db:push
```

### Backup Database
```bash
docker compose exec db pg_dump -U cloudforge cloudforge > backup_$(date +%Y%m%d).sql
```

### Restore Database
```bash
cat backup.sql | docker compose exec -T db psql -U cloudforge cloudforge
```

### Stop All Services
```bash
docker compose down

# Remove volumes too (WARNING: deletes data)
docker compose down -v
```

---

## Troubleshooting

### Container won't start
```bash
# Check logs
docker compose logs app

# Rebuild from scratch
docker compose down
docker compose build --no-cache
docker compose up -d
```

### Database connection issues
```bash
# Verify database is healthy
docker compose exec db pg_isready -U cloudforge

# Check database logs
docker compose logs db
```

### Permission issues
```bash
# Fix file permissions
sudo chown -R $USER:$USER .
```

### Out of disk space
```bash
# Clean up Docker resources
docker system prune -a
docker volume prune
```

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes* | PostgreSQL connection string (*auto-set by compose) |
| `REDIS_URL` | No | Redis connection string (optional caching) |
| `SESSION_SECRET` | Yes | Secret for session encryption |
| `GOOGLE_CLIENT_ID` | No | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth secret |
| `RAZORPAY_KEY_ID` | No | Razorpay payment key |
| `RAZORPAY_KEY_SECRET` | No | Razorpay payment secret |
| `GOOGLE_API_KEY` | No | Google Gemini AI API key |
| `OPENAI_API_KEY` | No | OpenAI API key |

---

## Security Checklist

Before going to production:

- [ ] Change default database password in docker-compose.yml
- [ ] Generate strong SESSION_SECRET
- [ ] Never commit .env.docker to version control
- [ ] Set up SSL/HTTPS
- [ ] Configure firewall rules
- [ ] Set up automated backups
- [ ] Enable rate limiting
- [ ] Review and restrict CORS settings
- [ ] Set up monitoring and alerting

---

## Support

For issues or questions:
1. Check the logs: `docker compose logs -f`
2. Verify environment variables are set correctly
3. Ensure all required ports are available
4. Check Docker and system resources

---

Happy Deploying! 🚀

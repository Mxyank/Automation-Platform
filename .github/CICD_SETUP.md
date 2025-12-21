# CI/CD Pipeline Setup Guide

Complete guide to setting up the CI/CD pipelines for CloudForge.

---

## Pipeline Overview

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `ci.yml` | Push/PR to main, develop | Lint, build, test, security scan |
| `cd.yml` | Push to main, version tags | Build Docker image, deploy to staging/production |
| `release.yml` | Manual trigger | Create new version release |

---

## Step 1: Push Code to GitHub

```bash
# Initialize git (if not already)
git init

# Add remote
git remote add origin https://github.com/YOUR_USERNAME/cloudforge.git

# Push code
git add .
git commit -m "Initial commit with CI/CD"
git push -u origin main
```

---

## Step 2: Configure GitHub Secrets

Go to your repository → **Settings** → **Secrets and variables** → **Actions**

### Required Secrets for Staging

| Secret Name | Description |
|-------------|-------------|
| `STAGING_HOST` | Staging server IP/hostname |
| `STAGING_USER` | SSH username for staging |
| `STAGING_SSH_KEY` | Private SSH key for staging server |

### Required Secrets for Production

| Secret Name | Description |
|-------------|-------------|
| `PRODUCTION_HOST` | Production server IP/hostname |
| `PRODUCTION_USER` | SSH username for production |
| `PRODUCTION_SSH_KEY` | Private SSH key for production server |

### Application Secrets (Both Environments)

| Secret Name | Description |
|-------------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `SESSION_SECRET` | Session encryption key |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret |
| `RAZORPAY_KEY_ID` | Razorpay payment key |
| `RAZORPAY_KEY_SECRET` | Razorpay payment secret |
| `GOOGLE_API_KEY` | Google Gemini AI key |
| `OPENAI_API_KEY` | OpenAI API key |

---

## Step 3: Configure GitHub Environments

Go to repository → **Settings** → **Environments**

### Create "staging" environment
1. Click "New environment"
2. Name: `staging`
3. Add deployment branch rule: `main`
4. Add the staging secrets

### Create "production" environment
1. Click "New environment"
2. Name: `production`
3. Enable "Required reviewers" (recommended)
4. Add deployment branch rule: `v*` (version tags)
5. Add the production secrets

---

## Step 4: Prepare Your Servers

### On Staging/Production Server

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Create app directory
sudo mkdir -p /opt/cloudforge
sudo chown $USER:$USER /opt/cloudforge
cd /opt/cloudforge

# Copy docker-compose.yml to server
# (This can be done via SCP or included in deployment)
```

### Generate SSH Keys

```bash
# On your local machine
ssh-keygen -t ed25519 -C "github-actions-deploy"

# Copy public key to server
ssh-copy-id -i ~/.ssh/id_ed25519.pub user@your-server

# Add private key to GitHub secrets as STAGING_SSH_KEY or PRODUCTION_SSH_KEY
cat ~/.ssh/id_ed25519
```

---

## Step 5: Enable GitHub Container Registry

The pipeline uses GitHub Container Registry (ghcr.io) to store Docker images.

1. Go to your profile → **Settings** → **Developer settings** → **Personal access tokens**
2. Generate a token with `write:packages` permission (optional, GITHUB_TOKEN usually works)

---

## How the Pipelines Work

### CI Pipeline (on every push/PR)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────────┐
│    Lint     │────▶│    Build    │────▶│  Docker Build   │
│ Type Check  │     │ Application │     │     (Test)      │
└─────────────┘     └─────────────┘     └─────────────────┘
       │                   │
       ▼                   ▼
┌─────────────┐     ┌─────────────────┐
│  Security   │     │  Integration    │
│    Scan     │     │     Test        │
└─────────────┘     └─────────────────┘
```

### CD Pipeline (on main branch / version tags)

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Build & Push   │────▶│    Deploy to    │────▶│    Deploy to    │
│  Docker Image   │     │    Staging      │     │   Production    │
│   to GHCR       │     │ (auto on main)  │     │ (on v* tags)    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

---

## Creating a Release

### Option 1: Manual Workflow

1. Go to **Actions** → **Release** workflow
2. Click "Run workflow"
3. Select version type (patch, minor, major)
4. Click "Run workflow"

### Option 2: Git Tag

```bash
# Create and push a version tag
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

This automatically:
- Builds and pushes Docker image with version tag
- Deploys to staging
- Deploys to production (after approval if required)
- Creates GitHub Release

---

## Monitoring & Troubleshooting

### View Pipeline Status

Go to repository → **Actions** tab

### Common Issues

**Build fails on type check:**
```bash
npm run check  # Run locally to see errors
```

**Docker build fails:**
```bash
docker build -t test .  # Build locally to debug
```

**Deployment fails:**
- Check server SSH connectivity
- Verify secrets are set correctly
- Check server logs: `docker compose logs -f`

**Image push fails:**
- Verify `GITHUB_TOKEN` has `write:packages` permission
- Check if GitHub Container Registry is enabled

---

## Security Best Practices

1. **Never commit secrets** - Use GitHub Secrets
2. **Use environment protection** - Require approvals for production
3. **Rotate SSH keys** regularly
4. **Review SBOM** - Check generated security report
5. **Enable branch protection** - Require PR reviews for main branch

---

## Cost Considerations

- GitHub Actions: Free for public repos, 2000 mins/month for private
- GitHub Container Registry: 500MB free storage
- Consider self-hosted runners for heavy usage

---

## Quick Reference

| Action | Command |
|--------|---------|
| Trigger CI | Push to main/develop or create PR |
| Deploy to staging | Push to main |
| Deploy to production | Create version tag `v*` |
| Manual deploy | Actions → CD Pipeline → Run workflow |
| Create release | Actions → Release → Run workflow |
| View Docker images | `ghcr.io/YOUR_USERNAME/cloudforge` |

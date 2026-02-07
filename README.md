# Prometix - DevOps Platform

A comprehensive SaaS platform for DevOps, Data Engineering, and Cybersecurity professionals. Features AI-powered tools, code generators, and subscription management.

## Features

- **API Generator** - Generate CRUD APIs for Express, FastAPI, NestJS
- **Docker Generator** - Create Dockerfiles and docker-compose configurations
- **CI/CD Pipeline Builder** - Generate GitHub Actions, Jenkins, GitLab CI
- **Ansible Playbook Generator** - Server automation playbooks
- **AI Assistant** - Log analysis, YAML generation, optimization
- **Snowflake Setup** - Data warehouse configuration
- **Airflow DAG Generator** - Apache Airflow workflow creation
- **Security Tools** - Secret scanning, vulnerability detection
- **Admin Dashboard** - User management, analytics, notifications

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Shadcn/ui
- **Backend**: Express.js, Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Passport.js (Local + Google OAuth)
- **Payments**: Razorpay (INR)
- **AI**: Google Gemini / OpenAI

## Quick Start

### Development (with Docker)

```bash
# Clone and setup
git clone <repo-url>
cd prometix
cp .env.docker.example .env.docker

# Start services
docker compose -f docker-compose.dev.yml up --build

# Run migrations (in new terminal)
docker compose -f docker-compose.dev.yml exec app npm run db:push
```

Access: http://localhost:5000

### Development (without Docker)

```bash
# Install dependencies
npm install

# Setup environment
cp .env.docker.example .env
# Edit .env with your database URL

# Run migrations
npm run db:push

# Start development server
npm run dev
```

## Production Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete instructions.

```bash
# Build and run
docker compose up -d --build
docker compose exec app npm run db:push
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `SESSION_SECRET` | Yes | Session encryption key |
| `GOOGLE_CLIENT_ID` | No | Google OAuth |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth |
| `RAZORPAY_KEY_ID` | No | Payment processing |
| `RAZORPAY_KEY_SECRET` | No | Payment processing |
| `OPENAI_API_KEY` | No | AI features |

## Project Structure

```
prometix/
├── client/                 # React frontend
│   └── src/
│       ├── components/     # UI components
│       ├── pages/          # Route pages
│       ├── hooks/          # Custom hooks
│       └── lib/            # Utilities
├── server/                 # Express backend
│   ├── middleware/         # Auth, security, caching
│   ├── routes/             # API route handlers
│   ├── services/           # Business logic
│   └── routes.ts           # Main routes file
├── shared/                 # Shared types and schemas
├── .github/workflows/      # CI/CD pipelines
├── Dockerfile              # Production Docker image
├── docker-compose.yml      # Production setup
└── docker-compose.dev.yml  # Development setup
```

## CI/CD

- **CI Pipeline**: Lint, type check, build, security scan
- **CD Pipeline**: Docker build/push to GHCR, optional deployment

## License

MIT

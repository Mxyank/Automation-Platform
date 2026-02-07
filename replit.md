# DevOps Cloud Platform

## Overview

This is a SaaS platform combining features of Supabase, CosmoCloud, and KodeKloud, targeting DevOps and backend developers. The platform provides Backend-as-a-Service capabilities, DevOps tooling, and AI-powered assistance with a pay-per-use model integrated with payment processing.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Full-Stack Architecture
- **Frontend**: React with TypeScript using Vite for build tooling
- **Backend**: Express.js server with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Passport.js with local strategy and session management
- **Payment Processing**: Razorpay integration for credit-based billing (INR payments)
- **AI Integration**: Google Gemini for DevOps assistance

### UI Framework
- **Design System**: Shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS with dark theme and neon color scheme
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for client-side routing
- **Forms**: React Hook Form with Zod validation

## Key Components

### Domain-Based Dashboard System
The platform uses a domain-based feature filtering system to show users only relevant tools for their selected specialty:

- **DevOps Domain**: API generators, Docker, CI/CD, Kubernetes, Jenkins, Ansible, monitoring tools
- **Data Engineering Domain**: Snowflake setup, Airflow DAGs, dbt models, data pipelines
- **Cybersecurity Domain**: Secret scanning, vulnerability detection, compliance checking, security analysis

Key files:
- `shared/feature-registry.ts`: Centralized registry of 50+ platform features with domain categorization
- `client/src/components/domain-switcher.tsx`: UI component for switching between specialties
- Dashboard filters features dynamically using `getQuickActionsByDomain()`, `getAdvancedFeaturesByDomain()`, `getMonitoringToolsByDomain()` functions

### Database Schema
- **Users**: Authentication, credits, Razorpay customer tracking, Google OAuth integration, admin roles, primaryDomain preference
- **Projects**: User-generated API projects, Docker configs, CI/CD workflows  
- **Usage**: Feature usage tracking for billing limits
- **Payments**: Payment history and credit purchases
- **Subscriptions**: Premium subscription management
- **Security Logs**: Login attempts, admin actions, API access tracking
- **Push Subscriptions**: Browser push notification subscriptions
- **Admin Activity Log**: Admin action audit trail
- **System Metrics**: Prometheus metrics storage

### Core Services

#### Code Generation Service
- **API Generator**: Creates CRUD APIs for Express, FastAPI, or NestJS
- **Docker Generator**: Generates Dockerfiles and docker-compose.yml files
- **CI/CD Generator**: Creates GitHub Actions workflows

#### DevOps Script Generation Service
- **Jenkins Pipeline Generator**: Creates comprehensive Jenkinsfiles with multi-stage pipelines supporting Node.js, Java, Python, and other project types
- **Ansible Playbook Generator**: Generates automation playbooks for server setup, web servers, databases, Docker, security hardening, and monitoring
- **SonarQube Setup Generator**: Creates installation scripts for Docker, Kubernetes, manual, ZIP, and RPM deployments with database integration

#### Data Engineering Tools
- **Snowflake Setup Generator** (/snowflake-setup): Generates complete Snowflake data warehouse setup scripts including:
  - Multi-cloud configuration (AWS, Azure, GCP)
  - Warehouse sizing and auto-suspend settings
  - Multi-cluster warehouses for scaling
  - Database, schema, and role creation
  - Network security policies
  - Secure data sharing configuration
  - Resource monitors for cost control
  - File formats and staging areas
  - Sample dimensional model (star schema)

- **Airflow DAG Generator** (/airflow-generator): Creates Apache Airflow DAG Python files with:
  - Multiple operator types (Python, Bash, Postgres, Snowflake, BigQuery, Spark, etc.)
  - Task dependency management
  - Email notifications on failure/retry
  - Template DAGs for common patterns (ETL, Data Warehouse, ML Pipeline, Reports, Data Quality, API Ingestion)
  - Catchup and backfill configuration
  - Custom scheduling with cron expressions

#### AI Service
- **Log Analysis**: Uses Google Gemini to analyze error logs and provide solutions
- **YAML Generation**: Natural language to DevOps YAML conversion
- **Dockerfile Optimization**: AI-powered Docker optimization suggestions

#### Advanced AI Features (8 New AI-Powered Tools)
- **Deployment Simulator** (/deployment-simulator): AI predicts deployment failures, cost impact, scaling needs, and security issues before deploying
- **IaC Autofix** (/iac-autofix): Analyzes Terraform, Pulumi, CloudFormation code for drift, syntax errors, security vulnerabilities with auto-fix suggestions
- **Release Notes Generator** (/release-notes): Auto-generates changelogs from commits with semantic versioning suggestions
- **Secret Scanner** (/secret-scanner): Detects exposed secrets (AWS keys, API tokens, passwords) with auto-remediation recommendations
- **Cloud Cost Optimizer** (/cloud-optimizer): Multi-cloud cost analysis for AWS, GCP, Azure with specific saving recommendations
- **Infrastructure Chat** (/infra-chat): Natural language interface to interact with Kubernetes and cloud infrastructure
- **Blueprint Generator** (/blueprint-generator): Generates complete architecture blueprints from requirements including Terraform code, CI/CD pipelines, and security configs
- **Post-Mortem Generator** (/postmortem): Creates comprehensive incident reports with timeline, root cause analysis, and preventive measures

#### Payment Service
- **Credit System**: Pay-per-use model with credit packages
- **Usage Limits**: Free tier with 1 use per feature, then paid credits
- **Razorpay Integration**: Indian payment gateway for INR transactions

#### Jobs & Interview Questions Portal (/jobs)
- **Job Listings**: 20+ curated Cloud/DevOps job opportunities from top tech companies
- **Smart Filtering**: Filter by location, experience level (Fresher to Principal), job type, and posting date
- **Experience Levels**: Fresher (0-1 yrs), Junior (1-3 yrs), Mid (3-5 yrs), Senior (5-8 yrs), Lead (8-12 yrs), Principal (12+ yrs)
- **Job Details**: Company info, salary ranges, required skills, working links to apply directly
- **Statistics Dashboard**: Total jobs, remote/hybrid positions, entry-level opportunities, company count
- **Interview Prep Section**: Comprehensive interview questions across 11 technology categories
- **Question Categories**: DevOps, Kubernetes, Docker, SonarQube, AWS, Azure, Prometheus, Grafana, Testing, Troubleshooting, Shell Scripting
- **Difficulty Levels**: Questions tagged as beginner, intermediate, or advanced
- **Accordion UI**: Expandable question/answer format for easy navigation

### Admin Dashboard (/admin) - 9 Tabs
- **Overview Tab**: Platform statistics (users, projects, payments, premium users, admin count)
- **Users Tab**: View all platform users with search and filtering
- **Admins Tab**: Admin role management - grant/revoke admin access to team members by email
- **Notifications Tab**: Manual push notification system with templates for common scenarios (premium upgrades, inactive users, new features, maintenance, low credits, security updates)
- **Security Tab**: Real-time security event monitoring with severity levels
- **Queues Tab**: Message queue performance metrics for Kafka, RabbitMQ, and Redis (throughput, latency, queue depth, consumers)
- **API Docs Tab**: Complete API documentation with endpoint details, request/response examples, and Postman collection export
- **Database Tab**: View all database tables and their schemas
- **Documentation Tab**: Downloadable technical documentation (architecture, database diagrams, setup instructions)
- **Monitoring Tab**: Prometheus & Grafana integration with system health status
- **Access Control**: Primary admin (agrawalmayank200228@gmail.com) + team members with granted access

### Message Queue Integration
- **Apache Kafka**: Event streaming for notifications, audit logs, user events, billing events, system alerts
- **RabbitMQ**: Task queue processing for push notifications, email queue, webhook delivery, background tasks
- **Simulated Mode**: Development mode with simulated metrics (switches to real connections in production via env vars)
- **Real-time Metrics**: Queue depth, latency, throughput, consumer count, partition info

### Push Notifications Service
- **Web Push API**: Browser push notifications using VAPID keys
- **Subscription Management**: Save/remove push subscriptions per user
- **Broadcast Notifications**: Send notifications to all subscribers
- **Auto-cleanup**: Removes expired/invalid subscriptions automatically

### Monitoring & Observability
- **Prometheus Metrics**: Custom metrics for HTTP requests, API usage, security events
- **Grafana Integration**: Configuration for external Grafana dashboards
- **System Health**: Database, Redis, Auth, and Metrics status monitoring
- **Admin Activity Logging**: All admin actions are logged for audit trail

### Authentication & Authorization
- **Session-based Auth**: Using Redis session store with PostgreSQL fallback
- **Password Hashing**: Secure crypto-based password hashing  
- **Google OAuth**: Social login with passport-google-oauth20
- **Protected Routes**: Frontend route protection with auth context
- **Multi-provider Support**: Local email/password and Google OAuth login
- **Admin Access Control**: Restricted admin features to agrawalmayank200228@gmail.com only
- **Role-based Admin Access**: Grant admin access to team members via database query or admin UI
- **Enterprise Security**: Multi-layer security middleware with comprehensive monitoring

### Performance Optimization
- **Redis Caching**: High-performance caching for user data, projects, and API responses
- **Cache Strategy**: TTL-based caching with automatic invalidation on data changes
- **Session Storage**: Redis-first session storage with PostgreSQL fallback
- **Cache Middleware**: Request-level caching for frequently accessed endpoints

## Data Flow

1. **User Registration/Login**: Passport.js handles authentication, sessions stored in PostgreSQL
2. **Feature Usage**: Each feature checks usage limits before execution
3. **Code Generation**: User submits configuration → Service generates code → Project stored in database
4. **AI Assistance**: User submits query → Google Gemini API processes → Response returned with analysis
5. **Payment Flow**: Usage exceeds limit → Redirect to checkout → Razorpay payment → Credits added to account

## External Dependencies

### Core Dependencies
- **pg**: PostgreSQL database client (node-postgres)
- **drizzle-orm**: Type-safe database ORM
- **passport**: Authentication middleware with local and Google OAuth strategies
- **passport-google-oauth20**: Google OAuth integration
- **bcryptjs**: Password hashing
- **@google/generative-ai**: Google Gemini AI service integration
- **razorpay**: Payment processing
- **redis**: High-performance caching and session storage
- **connect-redis**: Redis session store integration

### Frontend Dependencies
- **@radix-ui/\***: Accessible UI component primitives
- **@tanstack/react-query**: Server state management
- **react-hook-form**: Form handling and validation
- **wouter**: Lightweight client-side routing
- **tailwindcss**: Utility-first CSS framework

### Development Tools
- **vite**: Build tool and dev server
- **typescript**: Type safety
- **drizzle-kit**: Database migrations
- **tsx**: TypeScript execution for development

## Deployment Strategy

### Build Process
- **Frontend**: Vite builds React app to `dist/public`
- **Backend**: ESBuild bundles server code to `dist/index.js`
- **Database**: Drizzle migrations run via `db:push` script

### Environment Configuration
- **DATABASE_URL**: PostgreSQL connection string (required)
- **SESSION_SECRET**: Session encryption key
- **GOOGLE_API_KEY**: Google Gemini API authentication
- **RAZORPAY_KEY_ID/SECRET**: Payment gateway credentials
- **GOOGLE_CLIENT_ID/SECRET**: Google OAuth credentials (optional)

### Production Considerations
- Uses Neon PostgreSQL for serverless database
- Session store configured for production scaling
- Environment-based configuration for different deployment stages
- CORS and security middleware configured for production
- Redis optional: Falls back to PostgreSQL sessions when Redis unavailable

## API Security

### Input Validation
All AI endpoints enforce:
- Type checking for string inputs
- Minimum length requirements (10-20 chars depending on endpoint)
- Enum whitelisting for select fields (environment, provider, type, format, severity, scale)
- Safe fallback values for optional parameters
- URL validation for applicable fields
- Query length limits to prevent abuse

### AI Response Handling
- JSON parsing with try/catch blocks
- Structured fallback responses on parse failures
- Proper error messages returned to clients
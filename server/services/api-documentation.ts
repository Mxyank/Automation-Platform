export interface ApiEndpointDoc {
  name: string;
  method: string;
  path: string;
  description: string;
  category: string;
  auth: 'none' | 'required' | 'admin';
  requestBody?: {
    contentType: string;
    schema: Record<string, any>;
    example?: any;
  };
  queryParams?: Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
  }>;
  pathParams?: Array<{
    name: string;
    type: string;
    description: string;
  }>;
  responses: Array<{
    status: number;
    description: string;
    example?: any;
  }>;
  headers?: Array<{
    name: string;
    value: string;
    description: string;
  }>;
}

export const apiEndpoints: ApiEndpointDoc[] = [
  {
    name: "Get Current User",
    method: "GET",
    path: "/api/user",
    description: "Retrieves the currently authenticated user's profile information including credits, premium status, and account details.",
    category: "Authentication",
    auth: "required",
    responses: [
      { status: 200, description: "User profile retrieved successfully", example: { id: 1, username: "johndoe", email: "john@example.com", credits: 100, isPremium: false } },
      { status: 401, description: "Not authenticated" }
    ]
  },
  {
    name: "Register User",
    method: "POST",
    path: "/api/auth/register",
    description: "Creates a new user account with email and password authentication.",
    category: "Authentication",
    auth: "none",
    requestBody: {
      contentType: "application/json",
      schema: {
        username: { type: "string", required: true, minLength: 3, maxLength: 50 },
        email: { type: "string", required: true, format: "email" },
        password: { type: "string", required: true, minLength: 6 }
      },
      example: { username: "johndoe", email: "john@example.com", password: "securepassword123" }
    },
    responses: [
      { status: 201, description: "User registered successfully" },
      { status: 400, description: "Validation error or user already exists" }
    ]
  },
  {
    name: "Login User",
    method: "POST",
    path: "/api/auth/login",
    description: "Authenticates a user with email/username and password, creating a session.",
    category: "Authentication",
    auth: "none",
    requestBody: {
      contentType: "application/json",
      schema: {
        email: { type: "string", required: true },
        password: { type: "string", required: true }
      },
      example: { email: "john@example.com", password: "securepassword123" }
    },
    responses: [
      { status: 200, description: "Login successful" },
      { status: 401, description: "Invalid credentials" }
    ]
  },
  {
    name: "Logout User",
    method: "POST",
    path: "/api/auth/logout",
    description: "Ends the current user session and clears authentication cookies.",
    category: "Authentication",
    auth: "required",
    responses: [
      { status: 200, description: "Logout successful" }
    ]
  },
  {
    name: "Google OAuth",
    method: "GET",
    path: "/api/auth/google",
    description: "Initiates Google OAuth 2.0 authentication flow. Redirects user to Google consent screen.",
    category: "Authentication",
    auth: "none",
    responses: [
      { status: 302, description: "Redirects to Google OAuth consent" }
    ]
  },
  {
    name: "Google OAuth Callback",
    method: "GET",
    path: "/api/auth/google/callback",
    description: "Handles the OAuth callback from Google and creates/updates user session.",
    category: "Authentication",
    auth: "none",
    queryParams: [
      { name: "code", type: "string", required: true, description: "Authorization code from Google" },
      { name: "state", type: "string", required: false, description: "State parameter for CSRF protection" }
    ],
    responses: [
      { status: 302, description: "Redirects to dashboard on success or auth page on failure" }
    ]
  },
  {
    name: "Get User Projects",
    method: "GET",
    path: "/api/projects",
    description: "Retrieves all projects created by the authenticated user.",
    category: "Projects",
    auth: "required",
    responses: [
      { status: 200, description: "List of user projects", example: [{ id: 1, name: "My API", type: "api", framework: "express" }] },
      { status: 401, description: "Not authenticated" }
    ]
  },
  {
    name: "Create Project",
    method: "POST",
    path: "/api/projects",
    description: "Creates a new project with generated code based on the specified configuration.",
    category: "Projects",
    auth: "required",
    requestBody: {
      contentType: "application/json",
      schema: {
        name: { type: "string", required: true },
        type: { type: "string", enum: ["api", "docker", "cicd"], required: true },
        framework: { type: "string" },
        config: { type: "object" }
      },
      example: { name: "User API", type: "api", framework: "express", config: { endpoints: ["users", "auth"] } }
    },
    responses: [
      { status: 201, description: "Project created successfully" },
      { status: 400, description: "Validation error" }
    ]
  },
  {
    name: "Get Single Project",
    method: "GET",
    path: "/api/projects/:id",
    description: "Retrieves a specific project by its ID.",
    category: "Projects",
    auth: "required",
    pathParams: [
      { name: "id", type: "integer", description: "Project ID" }
    ],
    responses: [
      { status: 200, description: "Project details" },
      { status: 404, description: "Project not found" }
    ]
  },
  {
    name: "Get Usage Statistics",
    method: "GET",
    path: "/api/usage",
    description: "Retrieves the authenticated user's feature usage statistics and remaining limits.",
    category: "Usage & Billing",
    auth: "required",
    responses: [
      { status: 200, description: "Usage statistics", example: { apiGeneration: 5, dockerGeneration: 3, limit: 10 } }
    ]
  },
  {
    name: "Get Subscription Status",
    method: "GET",
    path: "/api/subscription",
    description: "Retrieves the current subscription status and plan details for the user.",
    category: "Usage & Billing",
    auth: "required",
    responses: [
      { status: 200, description: "Subscription details", example: { plan: "premium", status: "active", expiresAt: "2025-12-31" } }
    ]
  },
  {
    name: "Create Subscription",
    method: "POST",
    path: "/api/subscription/create",
    description: "Initiates a new premium subscription for the user.",
    category: "Usage & Billing",
    auth: "required",
    requestBody: {
      contentType: "application/json",
      schema: {
        plan: { type: "string", enum: ["monthly", "yearly"], required: true }
      },
      example: { plan: "monthly" }
    },
    responses: [
      { status: 200, description: "Subscription order created" },
      { status: 400, description: "Already subscribed or invalid plan" }
    ]
  },
  {
    name: "Create Payment Order",
    method: "POST",
    path: "/api/payment/create-order",
    description: "Creates a Razorpay order for credit package purchase.",
    category: "Usage & Billing",
    auth: "required",
    requestBody: {
      contentType: "application/json",
      schema: {
        package: { type: "string", enum: ["starter", "professional", "enterprise"], required: true }
      },
      example: { package: "professional" }
    },
    responses: [
      { status: 200, description: "Payment order created", example: { orderId: "order_xxx", amount: 49900, currency: "INR" } }
    ]
  },
  {
    name: "Verify Payment",
    method: "POST",
    path: "/api/payment/verify",
    description: "Verifies a Razorpay payment and adds credits to user account.",
    category: "Usage & Billing",
    auth: "required",
    requestBody: {
      contentType: "application/json",
      schema: {
        razorpay_order_id: { type: "string", required: true },
        razorpay_payment_id: { type: "string", required: true },
        razorpay_signature: { type: "string", required: true }
      }
    },
    responses: [
      { status: 200, description: "Payment verified, credits added" },
      { status: 400, description: "Payment verification failed" }
    ]
  },
  {
    name: "Generate API Code",
    method: "POST",
    path: "/api/generate/api",
    description: "Generates complete CRUD API code for the specified framework with authentication and database integration.",
    category: "Code Generation",
    auth: "required",
    requestBody: {
      contentType: "application/json",
      schema: {
        projectName: { type: "string", required: true },
        framework: { type: "string", enum: ["express", "fastapi", "nestjs"], required: true },
        database: { type: "string", enum: ["postgresql", "mongodb", "mysql"] },
        endpoints: { type: "array", items: { type: "string" } },
        authentication: { type: "boolean" }
      },
      example: { projectName: "UserService", framework: "express", database: "postgresql", endpoints: ["users", "posts"], authentication: true }
    },
    responses: [
      { status: 200, description: "Generated API code", example: { code: "...", files: ["index.js", "routes.js"] } },
      { status: 402, description: "Insufficient credits" }
    ]
  },
  {
    name: "Generate Docker Configuration",
    method: "POST",
    path: "/api/generate/docker",
    description: "Generates Dockerfile and docker-compose.yml for your application stack.",
    category: "Code Generation",
    auth: "required",
    requestBody: {
      contentType: "application/json",
      schema: {
        projectType: { type: "string", enum: ["nodejs", "python", "java", "go"], required: true },
        includeDatabase: { type: "boolean" },
        includeRedis: { type: "boolean" },
        includeNginx: { type: "boolean" }
      },
      example: { projectType: "nodejs", includeDatabase: true, includeRedis: true, includeNginx: false }
    },
    responses: [
      { status: 200, description: "Generated Docker configuration" },
      { status: 402, description: "Insufficient credits" }
    ]
  },
  {
    name: "Generate CI/CD Pipeline",
    method: "POST",
    path: "/api/generate/cicd",
    description: "Generates GitHub Actions workflow file for CI/CD automation.",
    category: "Code Generation",
    auth: "required",
    requestBody: {
      contentType: "application/json",
      schema: {
        projectType: { type: "string", required: true },
        deployTarget: { type: "string", enum: ["aws", "gcp", "azure", "vercel", "docker"] },
        includeTesting: { type: "boolean" },
        includeCodeQuality: { type: "boolean" }
      },
      example: { projectType: "nodejs", deployTarget: "aws", includeTesting: true, includeCodeQuality: true }
    },
    responses: [
      { status: 200, description: "Generated CI/CD pipeline" },
      { status: 402, description: "Insufficient credits" }
    ]
  },
  {
    name: "Generate Jenkins Pipeline",
    method: "POST",
    path: "/api/generate/jenkins",
    description: "Generates a comprehensive Jenkinsfile with multi-stage pipeline configuration.",
    category: "DevOps Scripts",
    auth: "required",
    requestBody: {
      contentType: "application/json",
      schema: {
        projectType: { type: "string", enum: ["nodejs", "java", "python", "go"], required: true },
        stages: { type: "array", items: { type: "string" } },
        deploymentEnv: { type: "string" }
      },
      example: { projectType: "nodejs", stages: ["build", "test", "deploy"], deploymentEnv: "production" }
    },
    responses: [
      { status: 200, description: "Generated Jenkinsfile" },
      { status: 402, description: "Insufficient credits" }
    ]
  },
  {
    name: "Generate Ansible Playbook",
    method: "POST",
    path: "/api/generate/ansible",
    description: "Generates Ansible playbook for server configuration and automation.",
    category: "DevOps Scripts",
    auth: "required",
    requestBody: {
      contentType: "application/json",
      schema: {
        playbookType: { type: "string", enum: ["server-setup", "web-server", "database", "docker", "security", "monitoring"], required: true },
        targetOS: { type: "string", enum: ["ubuntu", "centos", "rhel", "debian"] }
      },
      example: { playbookType: "server-setup", targetOS: "ubuntu" }
    },
    responses: [
      { status: 200, description: "Generated Ansible playbook" },
      { status: 402, description: "Insufficient credits" }
    ]
  },
  {
    name: "Generate SonarQube Setup",
    method: "POST",
    path: "/api/generate/sonarqube",
    description: "Generates SonarQube installation and configuration scripts.",
    category: "DevOps Scripts",
    auth: "required",
    requestBody: {
      contentType: "application/json",
      schema: {
        deploymentType: { type: "string", enum: ["docker", "kubernetes", "manual", "zip", "rpm"], required: true },
        database: { type: "string", enum: ["postgresql", "mysql"] }
      },
      example: { deploymentType: "docker", database: "postgresql" }
    },
    responses: [
      { status: 200, description: "Generated SonarQube setup script" },
      { status: 402, description: "Insufficient credits" }
    ]
  },
  {
    name: "AI Log Analysis",
    method: "POST",
    path: "/api/ai/log-analysis",
    description: "Analyzes error logs using AI to identify root causes and provide solutions.",
    category: "AI Features",
    auth: "required",
    requestBody: {
      contentType: "application/json",
      schema: {
        logs: { type: "string", required: true, minLength: 20 },
        context: { type: "string" }
      },
      example: { logs: "Error: ECONNREFUSED 127.0.0.1:5432...", context: "PostgreSQL connection issue" }
    },
    responses: [
      { status: 200, description: "AI analysis with root cause and solutions" },
      { status: 402, description: "Insufficient credits" }
    ]
  },
  {
    name: "AI YAML Generation",
    method: "POST",
    path: "/api/ai/yaml-generation",
    description: "Converts natural language descriptions into DevOps YAML configurations.",
    category: "AI Features",
    auth: "required",
    requestBody: {
      contentType: "application/json",
      schema: {
        description: { type: "string", required: true, minLength: 10 },
        type: { type: "string", enum: ["kubernetes", "docker-compose", "github-actions", "ansible"] }
      },
      example: { description: "Deploy a Node.js app with 3 replicas and 2GB memory limit", type: "kubernetes" }
    },
    responses: [
      { status: 200, description: "Generated YAML configuration" },
      { status: 402, description: "Insufficient credits" }
    ]
  },
  {
    name: "AI Docker Optimization",
    method: "POST",
    path: "/api/ai/docker-optimization",
    description: "Analyzes Dockerfile and provides optimization recommendations for smaller, faster images.",
    category: "AI Features",
    auth: "required",
    requestBody: {
      contentType: "application/json",
      schema: {
        dockerfile: { type: "string", required: true, minLength: 20 }
      },
      example: { dockerfile: "FROM node:18\\nWORKDIR /app\\nCOPY . .\\nRUN npm install..." }
    },
    responses: [
      { status: 200, description: "Optimization suggestions and improved Dockerfile" },
      { status: 402, description: "Insufficient credits" }
    ]
  },
  {
    name: "AI Deployment Simulator",
    method: "POST",
    path: "/api/ai/deployment-simulator",
    description: "Simulates deployment and predicts potential failures, costs, and scaling needs.",
    category: "AI Features - Advanced",
    auth: "required",
    requestBody: {
      contentType: "application/json",
      schema: {
        config: { type: "string", required: true, minLength: 20 },
        environment: { type: "string", enum: ["development", "staging", "production"] },
        provider: { type: "string", enum: ["aws", "gcp", "azure", "kubernetes"] }
      },
      example: { config: "apiVersion: apps/v1...", environment: "production", provider: "aws" }
    },
    responses: [
      { status: 200, description: "Deployment simulation results with risk analysis" },
      { status: 402, description: "Insufficient credits" }
    ]
  },
  {
    name: "AI IaC Autofix",
    method: "POST",
    path: "/api/ai/iac-autofix",
    description: "Analyzes Infrastructure-as-Code for drift, syntax errors, and security vulnerabilities.",
    category: "AI Features - Advanced",
    auth: "required",
    requestBody: {
      contentType: "application/json",
      schema: {
        code: { type: "string", required: true, minLength: 20 },
        type: { type: "string", enum: ["terraform", "pulumi", "cloudformation"] }
      },
      example: { code: "resource \"aws_s3_bucket\" \"example\" {...}", type: "terraform" }
    },
    responses: [
      { status: 200, description: "Analysis results with auto-fix suggestions" },
      { status: 402, description: "Insufficient credits" }
    ]
  },
  {
    name: "AI Release Notes Generator",
    method: "POST",
    path: "/api/ai/release-notes",
    description: "Generates changelogs from commit messages with semantic versioning suggestions.",
    category: "AI Features - Advanced",
    auth: "required",
    requestBody: {
      contentType: "application/json",
      schema: {
        commits: { type: "string", required: true, minLength: 20 },
        format: { type: "string", enum: ["markdown", "html", "slack"] }
      },
      example: { commits: "feat: add user auth\\nfix: resolve login bug\\nchore: update deps", format: "markdown" }
    },
    responses: [
      { status: 200, description: "Generated release notes" },
      { status: 402, description: "Insufficient credits" }
    ]
  },
  {
    name: "AI Secret Scanner",
    method: "POST",
    path: "/api/ai/secret-scanner",
    description: "Scans code for exposed secrets like API keys, passwords, and tokens.",
    category: "AI Features - Advanced",
    auth: "required",
    requestBody: {
      contentType: "application/json",
      schema: {
        code: { type: "string", required: true, minLength: 20 }
      },
      example: { code: "const API_KEY = 'sk-xxxx'..." }
    },
    responses: [
      { status: 200, description: "Scan results with detected secrets and remediation" },
      { status: 402, description: "Insufficient credits" }
    ]
  },
  {
    name: "AI Cloud Cost Optimizer",
    method: "POST",
    path: "/api/ai/cloud-optimizer",
    description: "Analyzes cloud infrastructure for cost optimization opportunities.",
    category: "AI Features - Advanced",
    auth: "required",
    requestBody: {
      contentType: "application/json",
      schema: {
        infrastructure: { type: "string", required: true, minLength: 20 },
        provider: { type: "string", enum: ["aws", "gcp", "azure"] }
      },
      example: { infrastructure: "3x m5.xlarge instances running 24/7...", provider: "aws" }
    },
    responses: [
      { status: 200, description: "Cost analysis with saving recommendations" },
      { status: 402, description: "Insufficient credits" }
    ]
  },
  {
    name: "AI Infrastructure Chat",
    method: "POST",
    path: "/api/ai/infra-chat",
    description: "Natural language interface to interact with infrastructure and get recommendations.",
    category: "AI Features - Advanced",
    auth: "required",
    requestBody: {
      contentType: "application/json",
      schema: {
        query: { type: "string", required: true, minLength: 10 }
      },
      example: { query: "How can I scale my Kubernetes deployment to handle 10x traffic?" }
    },
    responses: [
      { status: 200, description: "AI response with infrastructure guidance" },
      { status: 402, description: "Insufficient credits" }
    ]
  },
  {
    name: "AI Blueprint Generator",
    method: "POST",
    path: "/api/ai/blueprint-generator",
    description: "Generates complete architecture blueprints including Terraform, CI/CD, and security configs.",
    category: "AI Features - Advanced",
    auth: "required",
    requestBody: {
      contentType: "application/json",
      schema: {
        requirements: { type: "string", required: true, minLength: 20 },
        scale: { type: "string", enum: ["startup", "growth", "enterprise"] }
      },
      example: { requirements: "E-commerce platform with user auth, payments, and inventory", scale: "growth" }
    },
    responses: [
      { status: 200, description: "Complete architecture blueprint" },
      { status: 402, description: "Insufficient credits" }
    ]
  },
  {
    name: "AI Post-Mortem Generator",
    method: "POST",
    path: "/api/ai/postmortem",
    description: "Creates comprehensive incident reports with timeline and root cause analysis.",
    category: "AI Features - Advanced",
    auth: "required",
    requestBody: {
      contentType: "application/json",
      schema: {
        incident: { type: "string", required: true, minLength: 20 },
        severity: { type: "string", enum: ["low", "medium", "high", "critical"] }
      },
      example: { incident: "Database connection pool exhausted causing 15 min downtime", severity: "high" }
    },
    responses: [
      { status: 200, description: "Generated post-mortem report" },
      { status: 402, description: "Insufficient credits" }
    ]
  },
  {
    name: "Admin - Platform Statistics",
    method: "GET",
    path: "/api/admin/stats",
    description: "Retrieves platform-wide statistics including user count, projects, payments, and admin count.",
    category: "Admin",
    auth: "admin",
    responses: [
      { status: 200, description: "Platform statistics", example: { totalUsers: 150, totalProjects: 300, totalPayments: 50 } },
      { status: 403, description: "Admin access required" }
    ]
  },
  {
    name: "Admin - Get All Users",
    method: "GET",
    path: "/api/admin/users",
    description: "Retrieves a list of all registered users with their details (excluding passwords).",
    category: "Admin",
    auth: "admin",
    responses: [
      { status: 200, description: "List of all users" },
      { status: 403, description: "Admin access required" }
    ]
  },
  {
    name: "Admin - Get Admin Users",
    method: "GET",
    path: "/api/admin/admins",
    description: "Retrieves a list of users with admin privileges.",
    category: "Admin",
    auth: "admin",
    responses: [
      { status: 200, description: "List of admin users" },
      { status: 403, description: "Admin access required" }
    ]
  },
  {
    name: "Admin - Grant Admin Access",
    method: "POST",
    path: "/api/admin/grant-admin",
    description: "Grants admin privileges to a user by their email address.",
    category: "Admin",
    auth: "admin",
    requestBody: {
      contentType: "application/json",
      schema: {
        email: { type: "string", required: true, format: "email" }
      },
      example: { email: "newadmin@example.com" }
    },
    responses: [
      { status: 200, description: "Admin access granted" },
      { status: 404, description: "User not found" },
      { status: 403, description: "Admin access required" }
    ]
  },
  {
    name: "Admin - Revoke Admin Access",
    method: "POST",
    path: "/api/admin/revoke-admin",
    description: "Revokes admin privileges from a user (cannot revoke primary admin).",
    category: "Admin",
    auth: "admin",
    requestBody: {
      contentType: "application/json",
      schema: {
        userId: { type: "integer", required: true }
      },
      example: { userId: 5 }
    },
    responses: [
      { status: 200, description: "Admin access revoked" },
      { status: 403, description: "Cannot revoke primary admin" }
    ]
  },
  {
    name: "Admin - Security Logs",
    method: "GET",
    path: "/api/admin/security-logs",
    description: "Retrieves security event logs including login attempts and admin actions.",
    category: "Admin",
    auth: "admin",
    queryParams: [
      { name: "limit", type: "integer", required: false, description: "Number of logs to retrieve (default: 100)" }
    ],
    responses: [
      { status: 200, description: "List of security logs" },
      { status: 403, description: "Admin access required" }
    ]
  },
  {
    name: "Admin - Activity Logs",
    method: "GET",
    path: "/api/admin/activity-logs",
    description: "Retrieves admin activity audit trail.",
    category: "Admin",
    auth: "admin",
    queryParams: [
      { name: "limit", type: "integer", required: false, description: "Number of logs to retrieve (default: 100)" }
    ],
    responses: [
      { status: 200, description: "List of activity logs" }
    ]
  },
  {
    name: "Admin - Send Push Notification",
    method: "POST",
    path: "/api/admin/send-notification",
    description: "Sends a push notification to all subscribers or specific users.",
    category: "Admin",
    auth: "admin",
    requestBody: {
      contentType: "application/json",
      schema: {
        title: { type: "string", required: true },
        body: { type: "string", required: true },
        url: { type: "string" },
        targetType: { type: "string", enum: ["all", "premium", "free"] }
      },
      example: { title: "New Feature!", body: "Check out our new AI features", url: "/dashboard", targetType: "all" }
    },
    responses: [
      { status: 200, description: "Notification sent successfully" },
      { status: 403, description: "Admin access required" }
    ]
  },
  {
    name: "Admin - Queue Metrics",
    method: "GET",
    path: "/api/admin/queue-metrics",
    description: "Retrieves performance metrics for Kafka, RabbitMQ, and Redis.",
    category: "Admin",
    auth: "admin",
    responses: [
      { status: 200, description: "Queue metrics for all message systems" },
      { status: 403, description: "Admin access required" }
    ]
  },
  {
    name: "Admin - API Documentation",
    method: "GET",
    path: "/api/admin/api-docs",
    description: "Retrieves complete API documentation for all endpoints.",
    category: "Admin",
    auth: "admin",
    responses: [
      { status: 200, description: "Complete API documentation" }
    ]
  },
  {
    name: "Admin - Export Postman Collection",
    method: "GET",
    path: "/api/admin/postman-collection",
    description: "Exports API documentation as a Postman collection JSON file.",
    category: "Admin",
    auth: "admin",
    responses: [
      { status: 200, description: "Postman collection JSON" }
    ]
  },
  {
    name: "Admin - Download Technical Docs",
    method: "GET",
    path: "/api/admin/download-docs",
    description: "Downloads comprehensive technical documentation including architecture, diagrams, and setup instructions.",
    category: "Admin",
    auth: "admin",
    responses: [
      { status: 200, description: "Markdown documentation file" }
    ]
  },
  {
    name: "Admin - Database Tables",
    method: "GET",
    path: "/api/admin/database-tables",
    description: "Retrieves list of all database tables with column counts.",
    category: "Admin",
    auth: "admin",
    responses: [
      { status: 200, description: "List of database tables" }
    ]
  },
  {
    name: "Admin - Table Schema",
    method: "GET",
    path: "/api/admin/table-schema/:tableName",
    description: "Retrieves detailed schema for a specific database table.",
    category: "Admin",
    auth: "admin",
    pathParams: [
      { name: "tableName", type: "string", description: "Name of the database table" }
    ],
    responses: [
      { status: 200, description: "Table column definitions" }
    ]
  },
  {
    name: "Prometheus Metrics",
    method: "GET",
    path: "/metrics",
    description: "Exposes Prometheus-compatible metrics for monitoring and alerting.",
    category: "Monitoring",
    auth: "none",
    responses: [
      { status: 200, description: "Prometheus metrics in text format" }
    ]
  },
  {
    name: "Health Check",
    method: "GET",
    path: "/api/health",
    description: "Returns the health status of the application and its dependencies.",
    category: "Monitoring",
    auth: "none",
    responses: [
      { status: 200, description: "Health status", example: { status: "ok", database: "connected", redis: "connected" } }
    ]
  }
];

export function getApiDocumentation(): ApiEndpointDoc[] {
  return apiEndpoints;
}

export function generatePostmanCollection(): any {
  const collection = {
    info: {
      name: "CloudForge DevOps Platform API",
      description: "Complete API documentation for the CloudForge DevOps Platform - A comprehensive SaaS solution for Backend-as-a-Service, DevOps automation, and AI-powered assistance.",
      version: "1.0.0",
      schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
    },
    auth: {
      type: "apikey",
      apikey: [
        { key: "key", value: "Cookie", type: "string" },
        { key: "value", value: "{{session_cookie}}", type: "string" },
        { key: "in", value: "header", type: "string" }
      ]
    },
    variable: [
      { key: "baseUrl", value: "http://localhost:5000", type: "string" },
      { key: "session_cookie", value: "", type: "string" }
    ],
    item: [] as any[]
  };

  const categories: Record<string, any[]> = {};
  
  apiEndpoints.forEach(endpoint => {
    if (!categories[endpoint.category]) {
      categories[endpoint.category] = [];
    }

    const request: any = {
      name: endpoint.name,
      request: {
        method: endpoint.method,
        header: [
          { key: "Content-Type", value: "application/json" }
        ],
        url: {
          raw: `{{baseUrl}}${endpoint.path}`,
          host: ["{{baseUrl}}"],
          path: endpoint.path.split('/').filter(p => p)
        },
        description: endpoint.description
      }
    };

    if (endpoint.requestBody) {
      request.request.body = {
        mode: "raw",
        raw: JSON.stringify(endpoint.requestBody.example || {}, null, 2),
        options: { raw: { language: "json" } }
      };
    }

    if (endpoint.queryParams) {
      request.request.url.query = endpoint.queryParams.map(p => ({
        key: p.name,
        value: "",
        description: `${p.description} (${p.type}, ${p.required ? 'required' : 'optional'})`
      }));
    }

    categories[endpoint.category].push(request);
  });

  collection.item = Object.entries(categories).map(([name, items]) => ({
    name,
    item: items
  }));

  return collection;
}

export function generateTechnicalDocumentation(): string {
  const doc = `# CloudForge DevOps Platform - Technical Documentation

## Table of Contents
1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [Database Design](#database-design)
5. [API Reference](#api-reference)
6. [Security Architecture](#security-architecture)
7. [Message Queue Architecture](#message-queue-architecture)
8. [Local Development Setup](#local-development-setup)
9. [Deployment Guide](#deployment-guide)

---

## Overview

CloudForge is a comprehensive DevOps Platform that combines Backend-as-a-Service capabilities with AI-powered DevOps automation. It provides developers with tools for code generation, infrastructure management, and intelligent assistance.

### Key Features
- **Backend-as-a-Service**: Generate complete APIs with authentication and database integration
- **DevOps Automation**: Generate Docker, CI/CD, Jenkins, Ansible configurations
- **AI-Powered Assistance**: 10+ AI tools for deployment simulation, code analysis, and more
- **Credit-Based Billing**: Pay-per-use model with premium subscriptions
- **Admin Dashboard**: Comprehensive platform management and monitoring
- **Message Queues**: Kafka and RabbitMQ integration for scalable event processing

---

## System Architecture

\`\`\`
┌─────────────────────────────────────────────────────────────────────┐
│                         CloudForge Platform                          │
├─────────────────────────────────────────────────────────────────────┤
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────────────┐   │
│  │   Frontend    │  │   Backend     │  │    External Services  │   │
│  │   (React)     │──│   (Express)   │──│                       │   │
│  └───────────────┘  └───────────────┘  │  ┌─────────────────┐  │   │
│         │                   │          │  │  Google Gemini  │  │   │
│         │                   │          │  │     (AI API)    │  │   │
│         ▼                   ▼          │  └─────────────────┘  │   │
│  ┌───────────────────────────────────┐ │  ┌─────────────────┐  │   │
│  │        PostgreSQL Database        │ │  │    Razorpay     │  │   │
│  │   (Neon Serverless)              │ │  │   (Payments)    │  │   │
│  └───────────────────────────────────┘ │  └─────────────────┘  │   │
│         │                              │  ┌─────────────────┐  │   │
│         │                              │  │  Google OAuth   │  │   │
│         ▼                              │  │(Authentication) │  │   │
│  ┌───────────────────────────────────┐ │  └─────────────────┘  │   │
│  │     Redis (Caching/Sessions)     │ └───────────────────────┘   │
│  └───────────────────────────────────┘                             │
│         │                                                           │
│         ▼                                                           │
│  ┌───────────────────────────────────┐                             │
│  │   Message Queues                  │                             │
│  │   ├── Apache Kafka               │                             │
│  │   └── RabbitMQ                   │                             │
│  └───────────────────────────────────┘                             │
└─────────────────────────────────────────────────────────────────────┘
\`\`\`

---

## Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.x | UI Framework |
| TypeScript | 5.x | Type Safety |
| Vite | 5.x | Build Tool |
| TanStack Query | 5.x | Server State Management |
| Wouter | 3.x | Client-side Routing |
| Tailwind CSS | 3.x | Styling |
| Shadcn/UI | Latest | Component Library |
| Framer Motion | 11.x | Animations |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 20.x | Runtime |
| Express.js | 4.x | Web Framework |
| TypeScript | 5.x | Type Safety |
| Drizzle ORM | Latest | Database ORM |
| Passport.js | 0.7.x | Authentication |
| Web Push | 3.x | Push Notifications |
| prom-client | 15.x | Prometheus Metrics |

### Database & Storage
| Technology | Purpose |
|------------|---------|
| PostgreSQL (Neon) | Primary Database |
| Redis | Caching & Sessions |
| Apache Kafka | Event Streaming |
| RabbitMQ | Message Queue |

### External Services
| Service | Purpose |
|---------|---------|
| Google Gemini | AI/ML Processing |
| Razorpay | Payment Processing |
| Google OAuth | Social Authentication |

---

## Database Design

### Entity Relationship Diagram

\`\`\`
┌──────────────────┐       ┌──────────────────┐
│      users       │       │     projects     │
├──────────────────┤       ├──────────────────┤
│ id (PK)          │───┐   │ id (PK)          │
│ username         │   │   │ userId (FK)      │◄──┐
│ email            │   │   │ name             │   │
│ password         │   │   │ type             │   │
│ credits          │   │   │ framework        │   │
│ isPremium        │   │   │ generatedCode    │   │
│ isAdmin          │   │   │ config           │   │
│ provider         │   │   │ createdAt        │   │
│ googleId         │   │   └──────────────────┘   │
│ adminGrantedBy   │   │                          │
│ adminGrantedAt   │   └──────────────────────────┘
│ createdAt        │
└──────────────────┘
        │
        │
        ▼
┌──────────────────┐       ┌──────────────────┐
│  usage_tracking  │       │     payments     │
├──────────────────┤       ├──────────────────┤
│ id (PK)          │       │ id (PK)          │
│ userId (FK)      │       │ userId (FK)      │
│ featureName      │       │ razorpayOrderId  │
│ usageCount       │       │ razorpayPaymentId│
│ lastUsedAt       │       │ amount           │
└──────────────────┘       │ status           │
                           │ creditsAdded     │
                           │ createdAt        │
                           └──────────────────┘

┌──────────────────┐       ┌──────────────────┐
│  subscriptions   │       │  security_logs   │
├──────────────────┤       ├──────────────────┤
│ id (PK)          │       │ id (PK)          │
│ userId (FK)      │       │ userId (FK)      │
│ plan             │       │ action           │
│ status           │       │ ipAddress        │
│ razorpaySubId    │       │ userAgent        │
│ startDate        │       │ details          │
│ endDate          │       │ severity         │
│ createdAt        │       │ createdAt        │
└──────────────────┘       └──────────────────┘

┌──────────────────┐       ┌──────────────────┐
│push_subscriptions│       │admin_activity_log│
├──────────────────┤       ├──────────────────┤
│ id (PK)          │       │ id (PK)          │
│ userId (FK)      │       │ adminId (FK)     │
│ endpoint         │       │ action           │
│ p256dh           │       │ targetUserId     │
│ auth             │       │ details          │
│ createdAt        │       │ createdAt        │
└──────────────────┘       └──────────────────┘
\`\`\`

### Database Tables

| Table | Description |
|-------|-------------|
| users | User accounts with authentication and billing info |
| projects | Generated code projects |
| usage_tracking | Feature usage for billing limits |
| payments | Payment history |
| subscriptions | Premium subscription records |
| security_logs | Security event audit trail |
| push_subscriptions | Browser push notification subscriptions |
| admin_activity_log | Admin action audit trail |
| system_metrics | Prometheus metrics storage |

---

## API Reference

### Authentication Endpoints
- \`POST /api/auth/register\` - User registration
- \`POST /api/auth/login\` - User login
- \`POST /api/auth/logout\` - User logout
- \`GET /api/auth/google\` - Google OAuth flow

### Code Generation Endpoints
- \`POST /api/generate/api\` - Generate CRUD APIs
- \`POST /api/generate/docker\` - Generate Docker configs
- \`POST /api/generate/cicd\` - Generate CI/CD pipelines
- \`POST /api/generate/jenkins\` - Generate Jenkinsfiles
- \`POST /api/generate/ansible\` - Generate Ansible playbooks
- \`POST /api/generate/sonarqube\` - Generate SonarQube setup

### AI Feature Endpoints
- \`POST /api/ai/log-analysis\` - AI log analysis
- \`POST /api/ai/yaml-generation\` - Natural language to YAML
- \`POST /api/ai/docker-optimization\` - Dockerfile optimization
- \`POST /api/ai/deployment-simulator\` - Deployment simulation
- \`POST /api/ai/iac-autofix\` - IaC code analysis
- \`POST /api/ai/release-notes\` - Changelog generation
- \`POST /api/ai/secret-scanner\` - Secret detection
- \`POST /api/ai/cloud-optimizer\` - Cloud cost optimization
- \`POST /api/ai/infra-chat\` - Infrastructure chat
- \`POST /api/ai/blueprint-generator\` - Architecture blueprints
- \`POST /api/ai/postmortem\` - Incident reports

### Admin Endpoints
- \`GET /api/admin/stats\` - Platform statistics
- \`GET /api/admin/users\` - All users
- \`POST /api/admin/grant-admin\` - Grant admin access
- \`POST /api/admin/revoke-admin\` - Revoke admin access
- \`POST /api/admin/send-notification\` - Send push notification
- \`GET /api/admin/queue-metrics\` - Message queue metrics

---

## Security Architecture

### Authentication Flow

\`\`\`
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client  │────▶│ Passport │────▶│  Session │────▶│   Redis  │
│          │     │          │     │  Store   │     │(fallback)│
└──────────┘     └──────────┘     └──────────┘     └──────────┘
                      │                                    │
                      ▼                                    ▼
               ┌──────────┐                        ┌──────────┐
               │ Password │                        │PostgreSQL│
               │  Hash    │                        │ Sessions │
               │(bcrypt)  │                        └──────────┘
               └──────────┘
\`\`\`

### Security Measures
1. **Password Hashing**: bcrypt with salt rounds
2. **Session Management**: Redis-backed with PostgreSQL fallback
3. **CSRF Protection**: Express session tokens
4. **Rate Limiting**: express-rate-limit middleware
5. **Helmet**: Security headers
6. **Input Validation**: Zod schema validation
7. **Admin Access Control**: Role-based with primary admin designation

---

## Message Queue Architecture

### Kafka Topics
- \`notifications\` - User notifications
- \`audit-logs\` - System audit events
- \`user-events\` - User activity tracking
- \`billing-events\` - Payment and credit events
- \`system-alerts\` - System health alerts

### RabbitMQ Queues
- \`push-notifications\` - Browser push delivery
- \`email-queue\` - Email notifications
- \`webhook-delivery\` - Webhook dispatching
- \`task-queue\` - Background task processing
- \`dead-letter\` - Failed message handling

---

## Local Development Setup

### Prerequisites
- Node.js 20.x or higher
- npm 10.x or higher
- PostgreSQL database (or Neon account)
- Redis (optional, for caching)

### Windows Setup Instructions

\`\`\`bash
# 1. Clone the repository
git clone https://github.com/your-org/cloudforge.git
cd cloudforge

# 2. Install dependencies
npm install

# 3. Create environment file
copy .env.example .env

# 4. Configure environment variables
# Edit .env file with your credentials:
# - DATABASE_URL: Your PostgreSQL connection string
# - SESSION_SECRET: Random string for session encryption
# - GOOGLE_API_KEY: Your Google Gemini API key
# - RAZORPAY_KEY_ID: Razorpay test key ID
# - RAZORPAY_KEY_SECRET: Razorpay test secret
# - GOOGLE_CLIENT_ID: Google OAuth client ID (optional)
# - GOOGLE_CLIENT_SECRET: Google OAuth client secret (optional)

# 5. Push database schema
npm run db:push

# 6. Start development server
npm run dev

# The application will be available at http://localhost:5000
\`\`\`

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| DATABASE_URL | Yes | PostgreSQL connection string |
| SESSION_SECRET | Yes | Session encryption key |
| GOOGLE_API_KEY | Yes | Google Gemini API key |
| RAZORPAY_KEY_ID | Yes | Razorpay key ID |
| RAZORPAY_KEY_SECRET | Yes | Razorpay secret |
| GOOGLE_CLIENT_ID | No | Google OAuth client ID |
| GOOGLE_CLIENT_SECRET | No | Google OAuth secret |
| REDIS_URL | No | Redis connection URL |
| VAPID_PUBLIC_KEY | No | Web Push public key |
| VAPID_PRIVATE_KEY | No | Web Push private key |

---

## Deployment Guide

### Production Build

\`\`\`bash
# Build the application
npm run build

# The build output will be in:
# - dist/index.js (server bundle)
# - dist/public (client bundle)
\`\`\`

### Production Environment Variables
All development variables plus:
- \`NODE_ENV=production\`
- Production database URL
- Production API keys

### Health Check Endpoint
\`GET /api/health\` - Returns system health status

### Monitoring
- Prometheus metrics: \`GET /metrics\`
- Grafana dashboards available via admin panel

---

## Support

For technical support or questions:
- Primary Admin: agrawalmayank200228@gmail.com
- Documentation: /admin (Admin Dashboard)

---

*Generated on ${new Date().toISOString()}*
*CloudForge DevOps Platform v1.0.0*
`;

  return doc;
}

import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { readFileSync, existsSync, statSync } from "fs";
import { join } from "path";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { db } from "./db";
import { users, impersonationLogs } from "@shared/schema";
import { eq } from "drizzle-orm";
import { generateCrudApi, generateDockerfile, generateDockerCompose, generateGitHubActions } from "./services/code-generator";
import { analyzeLogError, generateYamlFromNaturalLanguage, optimizeDockerfile, generateDevOpsResponse } from "./services/gemini";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createPaymentOrder, processSuccessfulPayment, checkUsageLimit, deductCreditForUsage, creditPackages } from "./services/payment";
import { logger } from "./logger";
import { redis } from "./redis";
import { projectsCacheMiddleware, usageCacheMiddleware, invalidateCacheMiddleware } from "./middleware/cache";
import adminRoutes from "./routes/admin";
import { searchJobs, getJobById, getJobStats } from "./services/jobs-service";
import { interviewCategories } from "../shared/interview-questions";
import { requireAdmin } from "./middleware/admin-guard";
import { savePushSubscription, removePushSubscription, getVapidPublicKey, sendPushNotification } from "./services/push-notifications";
import { 
  metricsMiddleware, 
  register as metricsRegister,
  trackAIQuery,
  trackCreditsUsed,
  trackError,
  updateActiveUsers
} from "./middleware/prometheus";
import { 
  globalRateLimit, 
  authRateLimit, 
  apiRateLimit,
  securityHeaders,
  validateInput,
  securityLogger,
  corsMiddleware,
  sessionSecurity
} from "./middleware/security";
import { 
  requireAuth, 
  requireRole, 
  requireOwnership, 
  requireCredits,
  validateSessionTimeout
} from "./middleware/auth-guard";
import helmet from "helmet";
import { body, validationResult } from "express-validator";
import os from 'os';
import { performance } from 'perf_hooks';

export async function registerRoutes(app: Express): Promise<Server> {
  // Security middleware (order matters!)
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https://generativelanguage.googleapis.com"],
        fontSrc: ["'self'", "data:"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false
  }));
  
  app.use(corsMiddleware);
  app.use(securityHeaders);
  app.use(securityLogger);
  app.use(validateInput);
  app.use(globalRateLimit);
  app.use(sessionSecurity);
  app.use(validateSessionTimeout(120)); // 2 hour session timeout
  
  // Add Prometheus metrics middleware
  app.use(metricsMiddleware);
  
  // Setup authentication routes with enhanced security
  setupAuth(app);

  // Register admin routes
  app.use("/api/admin", adminRoutes);

  // Push notification routes
  app.get("/api/push/vapid-key", (req, res) => {
    res.json({ publicKey: getVapidPublicKey() });
  });

  app.post("/api/push/subscribe", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    try {
      const { subscription } = req.body;
      await savePushSubscription((req.user as any).id, subscription);
      res.json({ message: "Subscription saved successfully" });
    } catch (error) {
      console.error("Error saving push subscription:", error);
      res.status(500).json({ error: "Failed to save subscription" });
    }
  });

  app.post("/api/push/unsubscribe", async (req, res) => {
    try {
      const { endpoint } = req.body;
      await removePushSubscription(endpoint);
      res.json({ message: "Subscription removed successfully" });
    } catch (error) {
      console.error("Error removing push subscription:", error);
      res.status(500).json({ error: "Failed to remove subscription" });
    }
  });

  // Jobs and Interview Questions API routes (public)
  app.get("/api/jobs", async (req, res) => {
    try {
      const { location, experienceLevel, type, postedWithin, search } = req.query;
      
      const filters = {
        location: location as string | undefined,
        experienceLevel: experienceLevel as string | undefined,
        type: type as string | undefined,
        postedWithin: postedWithin as string | undefined,
        search: search as string | undefined,
      };
      
      const jobs = await searchJobs(filters);
      res.json({ jobs, total: jobs.length });
    } catch (error) {
      console.error("Error fetching jobs:", error);
      res.status(500).json({ error: "Failed to fetch jobs" });
    }
  });

  app.get("/api/jobs/stats", async (_req, res) => {
    try {
      const stats = getJobStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching job stats:", error);
      res.status(500).json({ error: "Failed to fetch job statistics" });
    }
  });

  app.get("/api/jobs/:id", async (req, res) => {
    try {
      const job = await getJobById(req.params.id);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }
      res.json(job);
    } catch (error) {
      console.error("Error fetching job:", error);
      res.status(500).json({ error: "Failed to fetch job" });
    }
  });

  app.get("/api/interview-questions", (_req, res) => {
    res.json(interviewCategories);
  });

  app.get("/api/interview-questions/:categoryId", (req, res) => {
    const category = interviewCategories.find(c => c.id === req.params.categoryId);
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }
    res.json(category);
  });

  // Enhanced authentication middleware with security logging
  const enhancedRequireAuth = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated() || !req.user) {
      logger.warn('Unauthorized API access attempt', {
        ip: req.ip,
        method: req.method,
        path: req.path,
        userAgent: req.get('User-Agent'),
        referer: req.get('Referer')
      });
      return res.status(401).json({ 
        error: "Authentication required",
        message: "You must be logged in to access this resource",
        code: "AUTH_REQUIRED"
      });
    }
    
    logger.info('Authenticated API request', {
      userId: req.user.id,
      username: req.user.username,
      method: req.method,
      path: req.path,
      ip: req.ip
    });
    
    next();
  };

  // Input validation schemas
  const crudApiValidation = [
    body('name').isLength({ min: 1, max: 100 }).withMessage('Name must be between 1 and 100 characters'),
    body('database').isIn(['postgresql', 'mysql', 'mongodb', 'sqlite']).withMessage('Invalid database type'),
    body('framework').isIn(['express', 'fastapi', 'nestjs']).withMessage('Invalid framework'),
    body('authentication').isBoolean().withMessage('Authentication must be boolean'),
    body('oauth').isBoolean().withMessage('OAuth must be boolean')
  ];

  // API Generation Routes with enhanced security
  app.post("/api/generate/crud-api", 
    apiRateLimit, 
    enhancedRequireAuth, 
    requireCredits(1),
    crudApiValidation,
    async (req: Request, res: Response) => {
    try {
      // Check validation results
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        logger.warn('Invalid input for CRUD API generation', {
          userId: req.user!.id,
          errors: errors.array(),
          body: req.body
        });
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array(),
          code: 'VALIDATION_ERROR'
        });
      }

      const { name, database, authentication, oauth, framework } = req.body;
      const userId = req.user!.id;

      // Check usage limit
      if (!(await checkUsageLimit(userId, "api_generation"))) {
        return res.status(402).json({ 
          message: "Free limit reached. Please purchase credits to continue.",
          feature: "api_generation"
        });
      }

      const config = { name, database, authentication, oauth, framework };
      logger.info('API generation started', { name, framework, database }, userId);
      
      const generatedCode = generateCrudApi(config);

      // Create project
      const project = await storage.createProject({
        userId,
        name,
        type: "api",
        config,
        generatedCode,
        status: "active",
      });

      // Deduct credit or increment usage
      await deductCreditForUsage(userId, "api_generation");

      logger.apiGeneration(name, framework, true, userId);
      logger.database('insert', 'projects', { projectId: project.id, name }, userId);

      res.json({ 
        project,
        code: generatedCode,
        message: "API generated successfully"
      });
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // Docker Generation Routes
  app.post("/api/generate/dockerfile", requireAuth, async (req, res) => {
    try {
      const { language, framework, port, baseImage, envVars } = req.body;
      const userId = req.user!.id;

      if (!(await checkUsageLimit(userId, "docker_generation"))) {
        return res.status(402).json({ 
          message: "Free limit reached. Please purchase credits to continue.",
          feature: "docker_generation"
        });
      }

      const config = { language, framework, port, baseImage, envVars };
      const dockerfile = generateDockerfile(config);

      const project = await storage.createProject({
        userId,
        name: `${framework}-docker`,
        type: "docker",
        config,
        generatedCode: dockerfile,
        status: "active",
      });

      await deductCreditForUsage(userId, "docker_generation");

      res.json({ 
        project,
        dockerfile,
        message: "Dockerfile generated successfully"
      });
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.post("/api/generate/docker-compose", requireAuth, async (req, res) => {
    try {
      const { services } = req.body;
      const userId = req.user!.id;

      if (!(await checkUsageLimit(userId, "docker_generation"))) {
        return res.status(402).json({ 
          message: "Free limit reached. Please purchase credits to continue.",
          feature: "docker_generation"
        });
      }

      const dockerCompose = generateDockerCompose(services);

      const project = await storage.createProject({
        userId,
        name: "docker-compose-setup",
        type: "docker",
        config: { services },
        generatedCode: dockerCompose,
        status: "active",
      });

      await deductCreditForUsage(userId, "docker_generation");

      res.json({ 
        project,
        dockerCompose,
        message: "Docker Compose generated successfully"
      });
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // CI/CD Generation Routes
  app.post("/api/generate/github-actions", requireAuth, async (req, res) => {
    try {
      const { language, framework, testCommand } = req.body;
      const userId = req.user!.id;

      if (!(await checkUsageLimit(userId, "cicd_generation"))) {
        return res.status(402).json({ 
          message: "Free limit reached. Please purchase credits to continue.",
          feature: "cicd_generation"
        });
      }

      const config = { language, framework, testCommand };
      const workflow = generateGitHubActions(config);

      const project = await storage.createProject({
        userId,
        name: `${framework}-ci-cd`,
        type: "ci-cd",
        config,
        generatedCode: workflow,
        status: "active",
      });

      await deductCreditForUsage(userId, "cicd_generation");

      res.json({ 
        project,
        workflow,
        message: "GitHub Actions workflow generated successfully"
      });
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // AI Assistant Routes
  app.post("/api/ai/analyze-logs", requireAuth, async (req, res) => {
    try {
      const { logText } = req.body;
      const userId = req.user!.id;

      if (!(await checkUsageLimit(userId, "ai_assistance"))) {
        return res.status(402).json({ 
          message: "Free limit reached. Please purchase credits to continue.",
          feature: "ai_assistance"
        });
      }

      const analysis = await analyzeLogError(logText);
      await deductCreditForUsage(userId, "ai_assistance");

      res.json(analysis);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.post("/api/ai/generate-yaml", requireAuth, async (req, res) => {
    try {
      const { description } = req.body;
      const userId = req.user!.id;

      if (!(await checkUsageLimit(userId, "ai_assistance"))) {
        return res.status(402).json({ 
          message: "Free limit reached. Please purchase credits to continue.",
          feature: "ai_assistance"
        });
      }

      const result = await generateYamlFromNaturalLanguage(description);
      await deductCreditForUsage(userId, "ai_assistance");

      res.json(result);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.post("/api/ai/optimize-dockerfile", requireAuth, async (req, res) => {
    try {
      const { dockerfile } = req.body;
      const userId = req.user!.id;

      if (!(await checkUsageLimit(userId, "ai_assistance"))) {
        return res.status(402).json({ 
          message: "Free limit reached. Please purchase credits to continue.",
          feature: "ai_assistance"
        });
      }

      const result = await optimizeDockerfile(dockerfile);
      await deductCreditForUsage(userId, "ai_assistance");

      res.json(result);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // DevOps AI Query Endpoint - Premium Feature
  app.post("/api/ai/devops-query", requireAuth, async (req, res) => {
    try {
      const { query } = req.body;
      const userId = req.user!.id;

      if (!query || typeof query !== 'string') {
        return res.status(400).json({ message: "Query is required" });
      }

      // Check if user has active premium subscription
      const activeSubscription = await storage.getActiveSubscription(userId);
      const isPremium = activeSubscription || req.user!.isPremium;

      // If not premium, check usage limit - costs 1 credit per query
      if (!isPremium) {
        if (!(await checkUsageLimit(userId, "ai_assistance"))) {
          return res.status(402).json({ 
            message: "Free limit reached. Please purchase credits or subscribe to AI Pro for unlimited access.",
            feature: "ai_assistance",
            isPremiumFeature: true
          });
        }
      }

      // Generate response using Gemini optimized for DevOps/Cloud queries
      const answer = await generateDevOpsResponse(query);
      
      // Only deduct credits for non-premium users
      if (!isPremium) {
        await deductCreditForUsage(userId, "ai_assistance");
      }

      logger.info(`DevOps AI query processed for user ${userId} (premium: ${isPremium}): ${query.substring(0, 50)}...`);
      
      res.json({ 
        answer,
        query,
        timestamp: new Date().toISOString(),
        isPremium
      });
    } catch (error) {
      logger.error('DevOps AI query error', error);
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // Subscription Routes
  app.get("/api/subscription", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const subscription = await storage.getActiveSubscription(userId);
      
      res.json({
        hasActiveSubscription: !!subscription,
        subscription: subscription || null,
        isPremium: req.user!.isPremium
      });
    } catch (error) {
      logger.error('Error fetching subscription', error);
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.post("/api/subscription/create", requireAuth, async (req, res) => {
    try {
      const { planType } = req.body;
      const userId = req.user!.id;

      if (!planType || !['ai-pro-monthly', 'ai-pro-annual'].includes(planType)) {
        return res.status(400).json({ message: "Invalid plan type" });
      }

      // Calculate end date based on plan type
      const now = new Date();
      let endDate: Date;
      let amount: number;

      if (planType === 'ai-pro-monthly') {
        endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
        amount = 19900; // ₹199 in paise
      } else {
        endDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 365 days
        amount = 199900; // ₹1999 in paise
      }

      // Create subscription (in production, integrate with Razorpay subscriptions)
      const subscription = await storage.createSubscription({
        userId,
        planType,
        status: 'active',
        razorpaySubscriptionId: null,
        startDate: now,
        endDate,
        autoRenew: true,
      });

      logger.info(`Subscription created for user ${userId}: ${planType}`);
      
      res.json({
        success: true,
        subscription,
        message: `Successfully subscribed to ${planType === 'ai-pro-monthly' ? 'AI Pro Monthly' : 'AI Pro Annual'}`
      });
    } catch (error) {
      logger.error('Error creating subscription', error);
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.post("/api/subscription/cancel", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const subscription = await storage.getActiveSubscription(userId);

      if (!subscription) {
        return res.status(404).json({ message: "No active subscription found" });
      }

      const cancelled = await storage.cancelSubscription(subscription.id);
      
      logger.info(`Subscription cancelled for user ${userId}`);
      
      res.json({
        success: true,
        subscription: cancelled,
        message: "Subscription cancelled. You will still have access until the end of your billing period."
      });
    } catch (error) {
      logger.error('Error cancelling subscription', error);
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // Tour status endpoint - mark tour as seen
  app.post("/api/user/tour-complete", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const updatedUser = await storage.updateUserTourStatus(userId, true);
      
      logger.info(`Tour completed for user ${userId}`);
      
      res.json({
        success: true,
        hasSeenTour: updatedUser.hasSeenTour
      });
    } catch (error) {
      logger.error('Error updating tour status', error);
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // Update user domain preference
  app.patch("/api/user/domain", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { domain } = req.body;
      
      const validDomains = ['devops', 'data-engineering', 'cybersecurity'];
      if (!domain || !validDomains.includes(domain)) {
        return res.status(400).json({ message: "Invalid domain. Must be one of: devops, data-engineering, cybersecurity" });
      }
      
      const updatedUser = await storage.updateUserDomain(userId, domain);
      
      logger.info(`Domain updated to ${domain} for user ${userId}`);
      
      res.json({
        success: true,
        primaryDomain: updatedUser.primaryDomain
      });
    } catch (error) {
      logger.error('Error updating user domain', error);
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // Public domain configs endpoint
  app.get("/api/domain-configs", async (_req, res) => {
    try {
      const configs = await storage.getDomainConfigs();
      res.json(configs);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // Site settings routes - GET is intentionally public for displaying sales banners
  // on pricing page and Product Hunt badge on landing page for all visitors
  app.get("/api/site-settings", async (_req, res) => {
    try {
      const settings = await storage.getSiteSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // Admin route to update site settings
  app.put("/api/admin/site-settings/:key", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      const { key } = req.params;
      const { value } = req.body;
      if (typeof value !== 'boolean') {
        return res.status(400).json({ message: "Value must be a boolean" });
      }
      const updated = await storage.updateSiteSetting(key, value, user.id);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // User incident/helpdesk routes
  app.get("/api/incidents", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const incidents = await storage.getIncidentsByUser(userId);
      res.json(incidents);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.post("/api/incidents", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { title, description, category, priority } = req.body;
      
      if (!title || !description || !category) {
        return res.status(400).json({ message: "Title, description, and category are required" });
      }
      
      const incident = await storage.createIncident(userId, { 
        title, description, category, priority: priority || 'medium' 
      });
      res.json(incident);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.get("/api/incidents/:id", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const id = parseInt(req.params.id);
      const incident = await storage.getIncident(id);
      
      if (!incident || incident.userId !== userId) {
        return res.status(404).json({ message: "Incident not found" });
      }
      
      const messages = await storage.getIncidentMessages(id);
      res.json({ incident, messages });
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.post("/api/incidents/:id/message", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const id = parseInt(req.params.id);
      const { message } = req.body;
      
      if (!message) {
        return res.status(400).json({ message: "Message is required" });
      }
      
      const incident = await storage.getIncident(id);
      if (!incident || incident.userId !== userId) {
        return res.status(404).json({ message: "Incident not found" });
      }
      
      const msg = await storage.addIncidentMessage(id, userId, "user", message);
      res.json(msg);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.post("/api/incidents/:id/reopen", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const id = parseInt(req.params.id);
      
      const incident = await storage.getIncident(id);
      if (!incident || incident.userId !== userId) {
        return res.status(404).json({ message: "Incident not found" });
      }
      
      const updated = await storage.updateIncidentStatus(id, "reopened");
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // Migration Assistant AI Endpoint
  app.post("/api/ai/migration", requireAuth, async (req, res) => {
    try {
      const { type, content } = req.body;
      const userId = req.user!.id;

      if (!type || !content) {
        return res.status(400).json({ message: "Type and content are required" });
      }

      // Check usage limit
      if (!(await checkUsageLimit(userId, "migration_assistant"))) {
        return res.status(402).json({ 
          message: "Free limit reached. Please purchase credits to continue.",
          feature: "migration_assistant"
        });
      }

      let prompt = "";
      
      if (type === "dockerize") {
        prompt = `You are an expert DevOps engineer. Convert the following application description or structure into a production-ready Dockerfile and docker-compose.yml. Include best practices like multi-stage builds, security hardening, and proper caching. 

Application:
${content}

Provide the Dockerfile first, then docker-compose.yml. Add helpful comments explaining each section.`;
      } else if (type === "vm-to-container") {
        prompt = `You are an expert DevOps engineer. Convert the following VM configuration into containerized workloads. Create appropriate Dockerfiles, docker-compose.yml, and any necessary configuration files. Consider service dependencies, volumes, networking, and security.

VM Configuration:
${content}

Provide a complete containerization strategy with all necessary files.`;
      } else if (type === "compose-to-k8s") {
        prompt = `You are an expert Kubernetes engineer. Convert the following Docker Compose file into Kubernetes manifests. Include Deployments, Services, ConfigMaps, Secrets, PersistentVolumeClaims, and any other necessary resources. Follow Kubernetes best practices.

Docker Compose:
${content}

Provide complete Kubernetes YAML manifests that can be applied directly.`;
      } else {
        return res.status(400).json({ message: "Invalid migration type" });
      }

      const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || process.env.OPENAI_API_KEY || '');
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      await deductCreditForUsage(userId, "migration_assistant");

      logger.info(`Migration assistant used by user ${userId}: ${type}`);
      
      res.json({ 
        result: text,
        type,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Migration assistant error', error);
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // AI Deployment Simulator
  app.post("/api/ai/deployment-simulate", requireAuth, async (req, res) => {
    try {
      const { config, environment, provider, url } = req.body;
      const userId = req.user!.id;

      if (!config || typeof config !== 'string' || config.trim().length < 10) {
        return res.status(400).json({ message: "Deployment configuration is required (minimum 10 characters)" });
      }
      
      const validEnvironments = ['development', 'staging', 'production', 'qa', 'test'];
      const validProviders = ['aws', 'gcp', 'azure', 'digitalocean', 'kubernetes'];
      const safeEnvironment = validEnvironments.includes(environment) ? environment : 'production';
      const safeProvider = validProviders.includes(provider) ? provider : 'aws';

      if (!(await checkUsageLimit(userId, "deployment_simulator"))) {
        return res.status(402).json({ message: "Free limit reached", feature: "deployment_simulator" });
      }

      const prompt = `You are an expert DevOps engineer and deployment specialist. Analyze this deployment configuration and predict potential issues.

Deployment Configuration:
${config}

Target Environment: ${safeEnvironment}
Cloud Provider: ${safeProvider}
${url ? `Application URL: ${url}` : ''}

Provide a comprehensive deployment simulation analysis in the following JSON format:
{
  "failures": [{"risk": "description", "severity": "critical|high|medium|low", "recommendation": "how to fix"}],
  "costImpact": {"current": "$X/month", "projected": "$Y/month", "change": "+/-$Z", "details": "explanation"},
  "scalingNeeds": {"recommendation": "text", "metrics": ["CPU", "Memory", "etc"], "autoscaling": "specific rule suggestion"},
  "securityIssues": [{"issue": "description", "severity": "critical|high|medium|low", "fix": "how to fix"}],
  "overallScore": 0-100,
  "deploymentReady": true|false,
  "summary": "brief summary"
}

Be thorough and realistic in your analysis.`;

      const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || process.env.OPENAI_API_KEY || '');
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      let parsed;
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { summary: text };
      } catch {
        parsed = { summary: text, overallScore: 75, deploymentReady: true, failures: [], securityIssues: [], costImpact: { current: "N/A", projected: "N/A", change: "N/A", details: text }, scalingNeeds: { recommendation: text, metrics: [], autoscaling: "" } };
      }

      await deductCreditForUsage(userId, "deployment_simulator");
      logger.info(`Deployment simulation by user ${userId}`);
      
      res.json({ result: parsed });
    } catch (error) {
      logger.error('Deployment simulator error', error);
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // IaC Autofix (Terraform/Pulumi)
  app.post("/api/ai/iac-analyze", requireAuth, async (req, res) => {
    try {
      const { code, type, autoFix } = req.body;
      const userId = req.user!.id;

      if (!code || typeof code !== 'string' || code.trim().length < 10) {
        return res.status(400).json({ message: "Infrastructure code is required (minimum 10 characters)" });
      }

      const validTypes = ['terraform', 'pulumi', 'cloudformation', 'arm', 'bicep'];
      const safeType = validTypes.includes(type) ? type : 'terraform';

      if (!(await checkUsageLimit(userId, "iac_autofix"))) {
        return res.status(402).json({ message: "Free limit reached", feature: "iac_autofix" });
      }

      const prompt = `You are an expert Infrastructure-as-Code specialist. Analyze this ${safeType} code for issues.

Code:
${code}

Analyze for:
1. Drift detection hints
2. Syntax errors
3. Security vulnerabilities
4. Missing tags/policies
5. Unused resources
${autoFix ? '6. Provide corrected code' : ''}

Return JSON:
{
  "issues": [{"type": "drift|syntax|security|missing_tags|unused", "severity": "critical|high|medium|low", "line": number, "resource": "name", "description": "issue", "fix": "suggestion"}],
  "fixedCode": "corrected code if autoFix",
  "summary": "brief summary",
  "stats": {"totalIssues": N, "critical": N, "high": N, "medium": N, "low": N}
}`;

      const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || process.env.OPENAI_API_KEY || '');
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      let parsed;
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { summary: text, issues: [], stats: { totalIssues: 0, critical: 0, high: 0, medium: 0, low: 0 } };
      } catch {
        parsed = { summary: text, issues: [], fixedCode: code, stats: { totalIssues: 0, critical: 0, high: 0, medium: 0, low: 0 } };
      }

      await deductCreditForUsage(userId, "iac_autofix");
      logger.info(`IaC analysis by user ${userId}`);
      
      res.json({ result: parsed });
    } catch (error) {
      logger.error('IaC autofix error', error);
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // AI Release Notes Generator
  app.post("/api/ai/release-notes", requireAuth, async (req, res) => {
    try {
      const { commits, currentVersion, projectName, format } = req.body;
      const userId = req.user!.id;

      if (!commits || typeof commits !== 'string' || commits.trim().length < 10) {
        return res.status(400).json({ message: "Commits are required (minimum 10 characters)" });
      }

      const validFormats = ['markdown', 'html', 'plain', 'json'];
      const safeFormat = validFormats.includes(format) ? format : 'markdown';
      const safeProjectName = typeof projectName === 'string' ? projectName.slice(0, 100) : 'Project';
      const safeVersion = typeof currentVersion === 'string' && /^\d+\.\d+\.\d+/.test(currentVersion) 
        ? currentVersion : '1.0.0';

      if (!(await checkUsageLimit(userId, "release_notes"))) {
        return res.status(402).json({ message: "Free limit reached", feature: "release_notes" });
      }

      const prompt = `You are a technical writer. Generate release notes from these commits.

Project: ${safeProjectName}
Current Version: ${safeVersion}
Format: ${safeFormat}

Commits:
${commits}

Return JSON:
{
  "version": "suggested new version following semver",
  "versionType": "major|minor|patch",
  "releaseNotes": "formatted release notes",
  "changelog": "changelog entry",
  "impactSummary": "brief impact summary",
  "breakingChanges": ["list of breaking changes"],
  "newFeatures": ["list of new features"],
  "bugFixes": ["list of bug fixes"],
  "improvements": ["list of improvements"]
}`;

      const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || process.env.OPENAI_API_KEY || '');
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      let parsed;
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { releaseNotes: text, version: currentVersion };
      } catch {
        parsed = { releaseNotes: text, changelog: text, version: currentVersion || "1.0.1", versionType: "patch", breakingChanges: [], newFeatures: [], bugFixes: [], improvements: [], impactSummary: text };
      }

      await deductCreditForUsage(userId, "release_notes");
      logger.info(`Release notes generated by user ${userId}`);
      
      res.json({ result: parsed });
    } catch (error) {
      logger.error('Release notes error', error);
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // Secret Scanner
  app.post("/api/ai/secret-scan", requireAuth, async (req, res) => {
    try {
      const { code, repoUrl, autoRemediate } = req.body;
      const userId = req.user!.id;

      const hasCode = code && typeof code === 'string' && code.trim().length >= 10;
      const hasValidUrl = repoUrl && typeof repoUrl === 'string' && 
        /^https?:\/\/[^\s]+$/.test(repoUrl);
      
      if (!hasCode && !hasValidUrl) {
        return res.status(400).json({ message: "Valid code (minimum 10 characters) or repository URL is required" });
      }

      if (!(await checkUsageLimit(userId, "secret_scanner"))) {
        return res.status(402).json({ message: "Free limit reached", feature: "secret_scanner" });
      }

      const prompt = `You are a security expert. Scan this code for exposed secrets and security issues.

${code ? `Code:\n${code}` : `Repository: ${repoUrl}`}

Detect:
1. AWS keys, API tokens, passwords
2. Hardcoded credentials
3. Misconfigured IAM policies
4. Over-permissioned roles
5. Exposed certificates

Return JSON:
{
  "findings": [{"type": "aws_key|api_key|password|token|certificate|iam_issue|over_permission", "severity": "critical|high|medium|low", "location": "file:line", "line": number, "description": "issue", "exposed": "partial masked value", "remediation": "how to fix", "autoFixed": boolean}],
  "summary": "brief summary",
  "stats": {"total": N, "critical": N, "high": N, "medium": N, "low": N, "autoFixed": N},
  "securityScore": 0-100
}`;

      const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || process.env.OPENAI_API_KEY || '');
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      let parsed;
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { findings: [], securityScore: 100, summary: "No issues found" };
      } catch {
        parsed = { findings: [], summary: text, stats: { total: 0, critical: 0, high: 0, medium: 0, low: 0, autoFixed: 0 }, securityScore: 85 };
      }

      await deductCreditForUsage(userId, "secret_scanner");
      logger.info(`Secret scan by user ${userId}`);
      
      res.json({ result: parsed });
    } catch (error) {
      logger.error('Secret scanner error', error);
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // Multi-Cloud Cost Optimizer
  app.post("/api/ai/cloud-optimize", requireAuth, async (req, res) => {
    try {
      const { config, currentSpend, provider } = req.body;
      const userId = req.user!.id;

      if (!config || typeof config !== 'string' || config.trim().length < 10) {
        return res.status(400).json({ message: "Cloud configuration is required (minimum 10 characters)" });
      }

      const validProviders = ['aws', 'gcp', 'azure', 'multi-cloud'];
      const safeProvider = validProviders.includes(provider) ? provider : 'aws';
      const safeSpend = typeof currentSpend === 'string' ? currentSpend.slice(0, 50) : 'Unknown';

      if (!(await checkUsageLimit(userId, "cloud_optimizer"))) {
        return res.status(402).json({ message: "Free limit reached", feature: "cloud_optimizer" });
      }

      const prompt = `You are a cloud cost optimization expert. Analyze this infrastructure and suggest cost savings.

Cloud Provider: ${safeProvider}
Current Monthly Spend: ${safeSpend}

Infrastructure:
${config}

Provide optimization recommendations in JSON:
{
  "currentMonthlySpend": "$X,XXX",
  "projectedMonthlySpend": "$X,XXX",
  "totalSavings": "$XXX",
  "savingsPercentage": N,
  "recommendations": [{"category": "name", "currentCost": "$X", "projectedSaving": "$X", "savingPercentage": N, "recommendation": "text", "implementation": "steps", "priority": "high|medium|low", "effort": "easy|medium|hard"}],
  "instanceOptimizations": [{"current": "type", "recommended": "type", "monthlySaving": "$X", "reason": "why"}],
  "spotInstanceOpportunities": [{"workload": "name", "currentCost": "$X", "spotCost": "$X", "saving": "$X"}],
  "autoscalingRules": [{"resource": "name", "rule": "specific rule", "expectedImpact": "savings description"}],
  "summary": "brief summary"
}`;

      const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || process.env.OPENAI_API_KEY || '');
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      let parsed;
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { summary: text };
      } catch {
        parsed = { summary: text, currentMonthlySpend: currentSpend || "$5,000", projectedMonthlySpend: "$4,000", totalSavings: "$1,000", savingsPercentage: 20, recommendations: [], instanceOptimizations: [], spotInstanceOpportunities: [], autoscalingRules: [] };
      }

      await deductCreditForUsage(userId, "cloud_optimizer");
      logger.info(`Cloud optimization by user ${userId}`);
      
      res.json({ result: parsed });
    } catch (error) {
      logger.error('Cloud optimizer error', error);
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // Chat with Infrastructure
  app.post("/api/ai/infra-chat", requireAuth, async (req, res) => {
    try {
      const { query } = req.body;
      const userId = req.user!.id;

      if (!query || typeof query !== 'string' || query.trim().length < 3) {
        return res.status(400).json({ message: "Query is required (minimum 3 characters)" });
      }
      
      const safeQuery = query.slice(0, 2000);

      if (!(await checkUsageLimit(userId, "infra_chat"))) {
        return res.status(402).json({ message: "Free limit reached", feature: "infra_chat" });
      }

      const prompt = `You are an intelligent infrastructure assistant that can help manage Kubernetes, cloud resources, and DevOps tasks.

User Query: ${safeQuery}

Respond naturally and helpfully. If the query involves an action, provide:
1. A clear explanation of what you'll do
2. The exact command(s) that would execute this action
3. Expected results

Return JSON:
{
  "response": "natural language response to the user",
  "action": {
    "type": "scale|restart|status|logs|metrics|deploy|rollback|none",
    "command": "kubectl or cloud CLI command if applicable",
    "result": "expected outcome description"
  }
}

Be helpful, concise, and practical.`;

      const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || process.env.OPENAI_API_KEY || '');
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      let parsed;
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { response: text };
      } catch {
        parsed = { response: text, action: null };
      }

      await deductCreditForUsage(userId, "infra_chat");
      logger.info(`Infra chat by user ${userId}`);
      
      res.json({ result: parsed });
    } catch (error) {
      logger.error('Infra chat error', error);
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // AI Blueprint Generator
  app.post("/api/ai/blueprint", requireAuth, async (req, res) => {
    try {
      const { requirements, projectType, cloudProvider, scale } = req.body;
      const userId = req.user!.id;

      if (!requirements || typeof requirements !== 'string' || requirements.trim().length < 20) {
        return res.status(400).json({ message: "Project requirements are required (minimum 20 characters)" });
      }

      const validProjectTypes = ['web-app', 'api', 'ecommerce', 'saas', 'mobile-backend', 'data-pipeline', 'ml-platform'];
      const validProviders = ['aws', 'gcp', 'azure', 'multi-cloud'];
      const validScales = ['small', 'medium', 'large', 'enterprise'];
      
      const safeProjectType = validProjectTypes.includes(projectType) ? projectType : 'web-app';
      const safeCloudProvider = validProviders.includes(cloudProvider) ? cloudProvider : 'aws';
      const safeScale = validScales.includes(scale) ? scale : 'medium';

      if (!(await checkUsageLimit(userId, "blueprint_generator"))) {
        return res.status(402).json({ message: "Free limit reached", feature: "blueprint_generator" });
      }

      const prompt = `You are a senior solutions architect. Generate a complete architecture blueprint.

Project Requirements:
${requirements}

Project Type: ${safeProjectType}
Cloud Provider: ${safeCloudProvider}
Scale: ${safeScale}

Generate a comprehensive architecture in JSON:
{
  "projectName": "suggested name",
  "architecture": {
    "overview": "high-level description",
    "diagram": "ASCII art architecture diagram",
    "components": [{"name": "Service Name", "type": "compute|database|storage|network|cache", "description": "purpose"}]
  },
  "infrastructure": {
    "resources": "description of infrastructure",
    "terraform": "basic Terraform code for main resources",
    "estimatedCost": "$X,XXX/month"
  },
  "cicd": {
    "pipeline": "GitHub Actions or similar YAML",
    "stages": ["Build", "Test", "Deploy", etc]
  },
  "security": {
    "recommendations": ["list of security practices"],
    "implementation": "security configuration code"
  },
  "deployment": {
    "steps": ["step-by-step deployment guide"],
    "timeline": "estimated implementation time"
  },
  "summary": "executive summary"
}`;

      const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || process.env.OPENAI_API_KEY || '');
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      let parsed;
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { summary: text, projectName: "New Project" };
      } catch {
        parsed = { 
          projectName: "Architecture Blueprint",
          summary: text,
          architecture: { overview: text, diagram: "", components: [] },
          infrastructure: { resources: "", terraform: "", estimatedCost: "TBD" },
          cicd: { pipeline: "", stages: [] },
          security: { recommendations: [], implementation: "" },
          deployment: { steps: [], timeline: "TBD" }
        };
      }

      await deductCreditForUsage(userId, "blueprint_generator");
      logger.info(`Blueprint generated by user ${userId}`);
      
      res.json({ result: parsed });
    } catch (error) {
      logger.error('Blueprint generator error', error);
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // AI Post-Mortem Generator
  app.post("/api/ai/postmortem", requireAuth, async (req, res) => {
    try {
      const { description, url, logs, severity } = req.body;
      const userId = req.user!.id;

      if (!description || typeof description !== 'string' || description.trim().length < 20) {
        return res.status(400).json({ message: "Incident description is required (minimum 20 characters)" });
      }

      const validSeverities = ['critical', 'high', 'medium', 'low'];
      const safeSeverity = validSeverities.includes(severity) ? severity : 'high';
      const safeUrl = url && typeof url === 'string' && /^https?:\/\//.test(url) ? url : '';
      const safeLogs = typeof logs === 'string' ? logs.slice(0, 10000) : '';

      if (!(await checkUsageLimit(userId, "postmortem_generator"))) {
        return res.status(402).json({ message: "Free limit reached", feature: "postmortem_generator" });
      }

      const prompt = `You are an expert in incident management. Generate a comprehensive post-mortem report.

Incident Description:
${description}

${safeUrl ? `Incident URL: ${safeUrl}` : ''}
Severity: ${safeSeverity}
${safeLogs ? `\nLogs:\n${safeLogs}` : ''}

Generate a detailed post-mortem in JSON:
{
  "incidentTitle": "brief title",
  "severity": "critical|high|medium|low",
  "summary": "executive summary",
  "timeline": [{"time": "HH:MM UTC", "event": "what happened", "type": "detection|response|mitigation|resolution"}],
  "whatHappened": "detailed description",
  "rootCause": "root cause analysis",
  "impact": {
    "users": "X users/Y% of traffic",
    "duration": "X hours Y minutes",
    "services": ["affected services"],
    "financial": "estimated impact if any"
  },
  "teamInvolvement": [{"team": "Team Name", "role": "what they did"}],
  "whatWentWell": ["positive observations"],
  "whatWentWrong": ["areas for improvement"],
  "preventiveMeasures": [{"action": "specific action", "owner": "team/person", "priority": "high|medium|low", "deadline": "date"}],
  "lessonsLearned": ["key takeaways"],
  "fullReport": "complete markdown formatted report"
}`;

      const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || process.env.OPENAI_API_KEY || '');
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      let parsed;
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { summary: text, incidentTitle: "Incident Report" };
      } catch {
        parsed = {
          incidentTitle: "Incident Report",
          severity: severity || "high",
          summary: text,
          timeline: [],
          whatHappened: text,
          rootCause: "Analysis pending",
          impact: { users: "Unknown", duration: "Unknown", services: [], financial: "Unknown" },
          teamInvolvement: [],
          whatWentWell: [],
          whatWentWrong: [],
          preventiveMeasures: [],
          lessonsLearned: [],
          fullReport: text
        };
      }

      await deductCreditForUsage(userId, "postmortem_generator");
      logger.info(`Post-mortem generated by user ${userId}`);
      
      res.json({ result: parsed });
    } catch (error) {
      logger.error('Post-mortem generator error', error);
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // AI Environment Replicator (Magic Sandbox)
  app.post("/api/ai/env-replicate", requireAuth, async (req, res) => {
    try {
      const { repoUrl, branch, includeTests, includeSeedData } = req.body;
      const userId = req.user!.id;

      if (!repoUrl || typeof repoUrl !== 'string' || !repoUrl.startsWith('https://github.com/')) {
        return res.status(400).json({ message: "Valid GitHub repository URL is required" });
      }

      if (!(await checkUsageLimit(userId, "env_replicator"))) {
        return res.status(402).json({ message: "Free limit reached", feature: "env_replicator" });
      }

      const safeBranch = typeof branch === 'string' ? branch.slice(0, 50) : 'main';

      const prompt = `You are an expert DevOps engineer. Analyze this GitHub repository and generate a complete development environment setup.

Repository URL: ${repoUrl}
Branch: ${safeBranch}
Include Tests: ${includeTests ? 'Yes' : 'No'}
Include Seed Data: ${includeSeedData ? 'Yes' : 'No'}

Based on analyzing typical repo structures for this URL, infer the tech stack and generate:
1. Docker Compose file with all services (db, cache, app)
2. Dockerfile for the application
3. Environment variables template
4. Database migrations (if applicable)
5. Seed data scripts (if requested)
6. Setup script to bootstrap everything

Return JSON:
{
  "projectName": "name from repo",
  "techStack": [{"language": "Node.js", "framework": "Express", "version": "18"}],
  "osPackages": ["git", "curl", "build-essential"],
  "dockerCompose": "docker-compose.yml content",
  "dockerfile": "Dockerfile content",
  "envFile": ".env.example content",
  "migrations": "SQL migrations if applicable",
  "seedData": "seed data SQL if requested",
  "setupScript": "bash setup script",
  "readme": "DEV_SETUP.md content",
  "summary": "brief description"
}`;

      const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || process.env.OPENAI_API_KEY || '');
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      let parsed;
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { summary: text, projectName: "Project" };
      } catch {
        parsed = {
          projectName: "Project",
          techStack: [],
          osPackages: [],
          dockerCompose: "",
          dockerfile: "",
          envFile: "",
          migrations: "",
          seedData: "",
          setupScript: "",
          readme: text,
          summary: text
        };
      }

      await deductCreditForUsage(userId, "env_replicator");
      logger.info(`Environment replicated by user ${userId}: ${repoUrl}`);
      
      res.json({ result: parsed });
    } catch (error) {
      logger.error('Environment replicator error', error);
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // AI DBA (Database Optimizer)
  app.post("/api/ai/db-optimize", requireAuth, async (req, res) => {
    try {
      const { slowQueries, schemaDDL, engine } = req.body;
      const userId = req.user!.id;

      if ((!slowQueries || typeof slowQueries !== 'string' || slowQueries.trim().length < 10) && 
          (!schemaDDL || typeof schemaDDL !== 'string' || schemaDDL.trim().length < 10)) {
        return res.status(400).json({ message: "Slow queries or schema DDL required (minimum 10 characters)" });
      }

      const validEngines = ['postgresql', 'mysql', 'mariadb', 'mssql', 'oracle'];
      const safeEngine = validEngines.includes(engine) ? engine : 'postgresql';

      if (!(await checkUsageLimit(userId, "db_optimizer"))) {
        return res.status(402).json({ message: "Free limit reached", feature: "db_optimizer" });
      }

      const prompt = `You are an expert DBA (Database Administrator). Analyze these ${safeEngine} queries and schema for optimization.

${slowQueries ? `Slow Queries:\n${slowQueries}` : ''}
${schemaDDL ? `\nSchema DDL:\n${schemaDDL}` : ''}

Provide comprehensive database optimization analysis in JSON:
{
  "summary": "brief summary",
  "overallScore": 0-100,
  "slowQueries": [{"query": "original", "executionTime": "5s", "issue": "problem", "optimizedQuery": "fixed query", "improvement": "10x faster"}],
  "indexRecommendations": [{"table": "name", "columns": ["col1", "col2"], "type": "btree|hash|gin", "createStatement": "CREATE INDEX...", "reason": "why needed", "estimatedImprovement": "50% faster"}],
  "configOptimizations": [{"parameter": "shared_buffers", "currentValue": "128MB", "recommendedValue": "256MB", "reason": "explanation", "impact": "high|medium|low"}],
  "antiPatterns": [{"pattern": "SELECT *", "location": "query 1", "severity": "critical|high|medium|low", "fix": "how to fix"}],
  "queryBottlenecks": [{"query": "problematic query", "bottleneck": "issue", "prediction": "will get worse", "mitigation": "fix"}]
}`;

      const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || process.env.OPENAI_API_KEY || '');
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      let parsed;
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { summary: text, overallScore: 70 };
      } catch {
        parsed = {
          summary: text,
          overallScore: 70,
          slowQueries: [],
          indexRecommendations: [],
          configOptimizations: [],
          antiPatterns: [],
          queryBottlenecks: []
        };
      }

      await deductCreditForUsage(userId, "db_optimizer");
      logger.info(`Database optimization by user ${userId}`);
      
      res.json({ result: parsed });
    } catch (error) {
      logger.error('Database optimizer error', error);
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // AI Website Analyzer (Monitoring & Analytics) - With REAL HTTP probing
  app.post("/api/ai/website-analyze", requireAuth, async (req, res) => {
    try {
      const { url, checks } = req.body;
      const userId = req.user!.id;

      if (!url || typeof url !== 'string' || url.length > 500) {
        return res.status(400).json({ message: "Valid website URL is required (max 500 characters)" });
      }

      try {
        const parsedUrl = new URL(url);
        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
          return res.status(400).json({ message: "URL must use HTTP or HTTPS protocol" });
        }
      } catch {
        return res.status(400).json({ message: "Invalid URL format" });
      }

      if (!(await checkUsageLimit(userId, "website_monitor"))) {
        return res.status(402).json({ message: "Free limit reached", feature: "website_monitor" });
      }

      const checksList = Array.isArray(checks) ? checks : ['performance', 'security', 'seo'];

      const startTime = Date.now();
      let realMetrics: any = {
        status: 0,
        responseTime: "0ms",
        ttfb: "0ms",
        contentType: "unknown",
        serverInfo: "unknown",
        contentLength: 0,
        https: url.startsWith('https'),
        headers: {} as Record<string, string>,
        html: "",
        errors: [] as string[]
      };

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        
        const ttfbStart = Date.now();
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'User-Agent': 'CloudForge-Monitor/1.0 (Website Analyzer)',
            'Accept': 'text/html,application/xhtml+xml',
          },
          signal: controller.signal,
          redirect: 'follow',
        });
        const ttfbEnd = Date.now();
        
        clearTimeout(timeoutId);
        
        const html = await response.text();
        const endTime = Date.now();
        
        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          responseHeaders[key.toLowerCase()] = value;
        });
        
        realMetrics = {
          status: response.status,
          responseTime: `${endTime - startTime}ms`,
          ttfb: `${ttfbEnd - ttfbStart}ms`,
          contentType: responseHeaders['content-type'] || 'unknown',
          serverInfo: responseHeaders['server'] || 'unknown',
          contentLength: html.length,
          https: url.startsWith('https'),
          headers: responseHeaders,
          html: html.slice(0, 50000),
          errors: []
        };
      } catch (fetchError: any) {
        realMetrics.errors.push(fetchError.message || 'Failed to fetch website');
        realMetrics.status = 0;
        realMetrics.responseTime = `${Date.now() - startTime}ms`;
      }

      const securityHeaders = {
        'x-frame-options': realMetrics.headers['x-frame-options'] || null,
        'x-content-type-options': realMetrics.headers['x-content-type-options'] || null,
        'strict-transport-security': realMetrics.headers['strict-transport-security'] || null,
        'content-security-policy': realMetrics.headers['content-security-policy'] || null,
        'x-xss-protection': realMetrics.headers['x-xss-protection'] || null,
        'referrer-policy': realMetrics.headers['referrer-policy'] || null,
      };

      let titleMatch = realMetrics.html.match(/<title[^>]*>([^<]*)<\/title>/i);
      let descMatch = realMetrics.html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)/i);
      if (!descMatch) {
        descMatch = realMetrics.html.match(/<meta[^>]*content=["']([^"']*)[^>]*name=["']description["']/i);
      }
      
      const seoData = {
        title: titleMatch ? titleMatch[1].trim() : '',
        description: descMatch ? descMatch[1].trim() : '',
        hasH1: /<h1[^>]*>/i.test(realMetrics.html),
        hasCanonical: /<link[^>]*rel=["']canonical["']/i.test(realMetrics.html),
        hasViewport: /<meta[^>]*name=["']viewport["']/i.test(realMetrics.html),
        hasOpenGraph: /<meta[^>]*property=["']og:/i.test(realMetrics.html),
      };

      const prompt = `You are a website analysis expert. Analyze this website based on REAL data collected from the site.

Website URL: ${url}
Analysis Focus: ${checksList.join(', ')}

REAL MEASURED DATA:
- HTTP Status: ${realMetrics.status}
- Response Time (Total): ${realMetrics.responseTime}
- Time to First Byte (TTFB): ${realMetrics.ttfb}
- Content Type: ${realMetrics.contentType}
- Server: ${realMetrics.serverInfo}
- Content Length: ${realMetrics.contentLength} bytes
- HTTPS: ${realMetrics.https}
- Fetch Errors: ${realMetrics.errors.length > 0 ? realMetrics.errors.join(', ') : 'None'}

SECURITY HEADERS FOUND:
- X-Frame-Options: ${securityHeaders['x-frame-options'] || 'MISSING'}
- X-Content-Type-Options: ${securityHeaders['x-content-type-options'] || 'MISSING'}
- Strict-Transport-Security: ${securityHeaders['strict-transport-security'] || 'MISSING'}
- Content-Security-Policy: ${securityHeaders['content-security-policy'] ? 'Present' : 'MISSING'}
- X-XSS-Protection: ${securityHeaders['x-xss-protection'] || 'MISSING'}
- Referrer-Policy: ${securityHeaders['referrer-policy'] || 'MISSING'}

SEO DATA:
- Title: ${seoData.title || 'MISSING'}
- Meta Description: ${seoData.description || 'MISSING'}
- Has H1 Tag: ${seoData.hasH1}
- Has Canonical Link: ${seoData.hasCanonical}
- Has Viewport Meta: ${seoData.hasViewport}
- Has Open Graph Tags: ${seoData.hasOpenGraph}

Based on this REAL data, provide a comprehensive analysis. Calculate scores based on actual measurements.
Performance: Score based on actual response times (< 500ms = excellent, < 1000ms = good, < 2000ms = fair, > 2000ms = poor)
Security: Score based on actual headers present (each missing critical header = -15 points from 100)
SEO: Score based on actual meta tags present

Return JSON with this structure:
{
  "overallScore": number (0-100),
  "status": "healthy" | "warning" | "critical",
  "performance": {
    "loadTime": "${realMetrics.responseTime}",
    "ttfb": "${realMetrics.ttfb}",
    "fcp": "estimated from data",
    "lcp": "estimated from data",
    "score": number,
    "recommendations": ["specific recommendations based on actual data"]
  },
  "security": {
    "score": number,
    "https": ${realMetrics.https},
    "headers": [{"name": "header name", "status": "pass|fail|warn", "value": "actual value or MISSING"}],
    "issues": [{"severity": "critical|high|medium|low", "issue": "specific issue", "fix": "how to fix"}]
  },
  "seo": {
    "score": number,
    "title": "${seoData.title.replace(/"/g, '\\"') || 'Not found'}",
    "description": "${seoData.description.slice(0, 200).replace(/"/g, '\\"') || 'Not found'}",
    "issues": ["specific issues found"],
    "recommendations": ["specific recommendations"]
  },
  "accessibility": {
    "score": number (estimate based on HTML structure),
    "issues": [{"severity": "medium", "issue": "potential issue", "element": "element type"}]
  },
  "summary": "brief summary based on real findings"
}`;

      const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || process.env.OPENAI_API_KEY || '');
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      let parsed;
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { url, summary: text, overallScore: 75 };
      } catch {
        let secScore = 100;
        if (!securityHeaders['x-frame-options']) secScore -= 15;
        if (!securityHeaders['strict-transport-security']) secScore -= 20;
        if (!securityHeaders['content-security-policy']) secScore -= 15;
        if (!realMetrics.https) secScore -= 25;
        
        let seoScore = 100;
        if (!seoData.title) seoScore -= 30;
        if (!seoData.description) seoScore -= 25;
        if (!seoData.hasH1) seoScore -= 15;
        if (!seoData.hasViewport) seoScore -= 15;
        
        const responseMs = parseInt(realMetrics.responseTime) || 1000;
        let perfScore = responseMs < 500 ? 95 : responseMs < 1000 ? 80 : responseMs < 2000 ? 60 : 40;
        
        parsed = {
          url,
          timestamp: new Date().toISOString(),
          overallScore: Math.round((perfScore + secScore + seoScore) / 3),
          status: realMetrics.status >= 200 && realMetrics.status < 400 ? "healthy" : "critical",
          performance: { 
            loadTime: realMetrics.responseTime, 
            ttfb: realMetrics.ttfb, 
            fcp: "N/A", 
            lcp: "N/A", 
            score: perfScore, 
            recommendations: [] 
          },
          security: { 
            score: Math.max(0, secScore), 
            https: realMetrics.https, 
            headers: Object.entries(securityHeaders).map(([name, value]) => ({
              name: name.toUpperCase().replace(/-/g, '_'),
              status: value ? 'pass' : 'fail',
              value: value || 'MISSING'
            })),
            issues: [] 
          },
          seo: { 
            score: Math.max(0, seoScore), 
            title: seoData.title, 
            description: seoData.description, 
            issues: [], 
            recommendations: [] 
          },
          accessibility: { score: 70, issues: [] },
          logs: { 
            status: realMetrics.status, 
            responseTime: realMetrics.responseTime, 
            contentType: realMetrics.contentType, 
            serverInfo: realMetrics.serverInfo, 
            errors: realMetrics.errors 
          },
          summary: text
        };
      }

      parsed.logs = {
        status: realMetrics.status,
        responseTime: realMetrics.responseTime,
        contentType: realMetrics.contentType,
        serverInfo: realMetrics.serverInfo,
        errors: realMetrics.errors
      };
      parsed.url = url;
      parsed.timestamp = new Date().toISOString();

      await deductCreditForUsage(userId, "website_monitor");
      logger.info(`Website analysis by user ${userId}: ${url} - Status: ${realMetrics.status}, Time: ${realMetrics.responseTime}`);
      
      res.json({ result: parsed });
    } catch (error) {
      logger.error('Website analyzer error', error);
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // Project Management Routes (with caching)
  app.get("/api/projects", requireAuth, projectsCacheMiddleware, async (req, res) => {
    try {
      const userId = req.user!.id;
      const projects = await storage.getProjectsByUserId(userId);
      logger.info(`Retrieved ${projects.length} projects for user ${userId}`);
      res.json(projects);
    } catch (error) {
      logger.error('Error fetching projects', error);
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.get("/api/projects/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const project = await storage.getProject(parseInt(id));
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Check if user owns the project
      if (project.userId !== req.user!.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(project);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.put("/api/projects/:id", requireAuth, invalidateCacheMiddleware(['projects:user::userId']), async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const project = await storage.getProject(parseInt(id));
      if (!project || project.userId !== req.user!.id) {
        return res.status(404).json({ message: "Project not found" });
      }

      const updatedProject = await storage.updateProject(parseInt(id), updates);
      logger.info(`Updated project ${id} for user ${req.user!.id}`);
      res.json(updatedProject);
    } catch (error) {
      logger.error('Error updating project', error);
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // Payment Routes
  app.get("/api/credits/packages", (req, res) => {
    res.json(creditPackages);
  });

  app.post("/api/payment/create-order", requireAuth, async (req, res) => {
    try {
      const { packageId } = req.body;
      const userId = req.user!.id;

      const order = await createPaymentOrder(userId, packageId);
      res.json(order);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.post("/api/payment/verify", requireAuth, async (req, res) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

      await processSuccessfulPayment(razorpay_payment_id, razorpay_order_id, razorpay_signature);
      
      res.json({ message: "Payment verified successfully" });
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  // SonarQube integration routes (Admin only)
  app.post('/api/sonar/analyze', requireAdmin, async (req, res) => {
    try {
      const { sonarService } = await import('./services/sonar-service');
      const result = await sonarService.runAnalysis();
      
      logger.info('SonarQube analysis initiated', {
        userId: req.user!.id,
        success: result.success,
        taskId: result.taskId
      });
      
      res.json(result);
    } catch (error) {
      logger.error('SonarQube analysis failed', { 
        error: error instanceof Error ? error.message : String(error),
        userId: req.user!.id
      });
      
      trackError('sonar_analysis_failed', '/api/sonar/analyze', String(req.user?.id || 'unknown'));
      res.status(500).json({
        error: 'Analysis failed',
        message: 'Please try again later'
      });
    }
  });

  app.get('/api/sonar/metrics', requireAdmin, async (req, res) => {
    try {
      const { sonarService } = await import('./services/sonar-service');
      const metrics = await sonarService.getProjectMetrics();
      
      if (!metrics) {
        return res.status(404).json({
          error: 'No metrics available',
          message: 'Please run an analysis first'
        });
      }
      
      logger.info('SonarQube metrics retrieved', {
        userId: req.user!.id,
        overallRating: metrics.overallRating
      });
      
      res.json(metrics);
    } catch (error) {
      logger.error('Failed to get SonarQube metrics', { 
        error: error instanceof Error ? error.message : String(error),
        userId: req.user!.id
      });
      
      res.status(500).json({
        error: 'Failed to get metrics',
        message: 'Please try again later'
      });
    }
  });

  app.get('/api/sonar/issues', requireAdmin, async (req, res) => {
    try {
      const { sonarService } = await import('./services/sonar-service');
      const results = await sonarService.getAnalysisResults();
      
      if (!results) {
        return res.status(404).json({
          error: 'No analysis results available',
          message: 'Please run an analysis first'
        });
      }
      
      logger.info('SonarQube issues retrieved', {
        userId: req.user!.id,
        issueCount: results.issues.length
      });
      
      res.json(results.issues);
    } catch (error) {
      logger.error('Failed to get SonarQube issues', { 
        error: error instanceof Error ? error.message : String(error),
        userId: req.user!.id
      });
      
      res.status(500).json({
        error: 'Failed to get issues',
        message: 'Please try again later'
      });
    }
  });

  // Usage tracking (with caching)
  app.get("/api/usage", requireAuth, usageCacheMiddleware, async (req, res) => {
    try {
      const userId = req.user!.id;
      const features = ["api_generation", "docker_generation", "cicd_generation", "ai_assistance"];
      
      const usage = await Promise.all(
        features.map(async (feature) => ({
          feature,
          usage: await storage.getUsage(userId, feature),
        }))
      );

      logger.info(`Retrieved usage data for user ${userId}`);
      res.json(usage);
    } catch (error) {
      logger.error('Error fetching usage data', error);
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // Log Viewing Endpoints (Admin only)
  app.get("/api/logs", requireAdmin, async (req, res) => {
    try {
      const { type = 'app', lines = 100 } = req.query;
      const logsDir = join(process.cwd(), 'logs');
      
      let filename = '';
      switch (type) {
        case 'error':
          filename = 'error.log';
          break;
        case 'access':
          filename = 'access.log';
          break;
        default:
          filename = 'app.log';
      }
      
      const logPath = join(logsDir, filename);
      
      if (!existsSync(logPath)) {
        return res.json({ logs: [], message: `No ${type} logs found` });
      }
      
      const logContent = readFileSync(logPath, 'utf-8');
      const logLines = logContent.split('\n').filter(line => line.trim() !== '');
      const recentLogs = logLines.slice(-Number(lines));
      
      logger.info('Logs viewed', { type, lines: recentLogs.length }, req.user!.id);
      
      res.json({
        logs: recentLogs,
        total: logLines.length,
        showing: recentLogs.length,
        type: filename
      });
    } catch (error) {
      logger.error("Error reading logs", error, req.user?.id);
      res.status(500).json({ message: "Failed to read logs" });
    }
  });

  // Log statistics endpoint (Admin only)
  app.get("/api/logs/stats", requireAdmin, async (req, res) => {
    try {
      const logsDir = join(process.cwd(), 'logs');
      const stats = {
        app: { exists: false, size: 0, lines: 0 },
        error: { exists: false, size: 0, lines: 0 },
        access: { exists: false, size: 0, lines: 0 }
      };

      ['app.log', 'error.log', 'access.log'].forEach((filename, index) => {
        const logPath = join(logsDir, filename);
        const type = ['app', 'error', 'access'][index];
        
        if (existsSync(logPath)) {
          const content = readFileSync(logPath, 'utf-8');
          const fileStats = statSync(logPath);
          stats[type as keyof typeof stats] = {
            exists: true,
            size: fileStats.size,
            lines: content.split('\n').length - 1
          };
        }
      });

      res.json(stats);
    } catch (error) {
      logger.error("Error getting log stats", error, req.user?.id);
      res.status(500).json({ message: "Failed to get log statistics" });
    }
  });

  // Admin monitoring routes (restricted to agrawalmayank200228@gmail.com)
  
  // Prometheus metrics endpoint
  app.get('/metrics', requireAdmin, async (req, res) => {
    try {
      res.set('Content-Type', metricsRegister.contentType);
      res.end(await metricsRegister.metrics());
    } catch (error) {
      logger.error('Error generating metrics', { error });
      res.status(500).json({ error: 'Failed to generate metrics' });
    }
  });

  // System logs endpoint for admin dashboard
  app.get('/api/admin/logs', requireAdmin, async (req, res) => {
    try {
      const { level = 'all', limit = 100 } = req.query;
      
      // Get real logs from log files
      const logsDir = join(process.cwd(), 'logs');
      const logPath = join(logsDir, 'app.log');
      
      let logs: any[] = [];
      if (existsSync(logPath)) {
        const logContent = readFileSync(logPath, 'utf-8');
        const logLines = logContent.split('\n').filter(line => line.trim() !== '');
        
        logs = logLines.slice(-Number(limit)).map((line, index) => {
          try {
            const logData = JSON.parse(line);
            return {
              id: `${Date.now()}-${index}`,
              timestamp: logData.timestamp || new Date().toISOString(),
              level: logData.level || 'INFO',
              message: logData.message || line,
              userId: logData.userId || null,
              route: logData.route || null,
              duration: logData.duration || null,
              metadata: logData
            };
          } catch {
            return {
              id: `${Date.now()}-${index}`,
              timestamp: new Date().toISOString(),
              level: 'INFO',
              message: line,
              userId: null,
              route: null,
              duration: null
            };
          }
        });
      }

      const filteredLogs = level === 'all' 
        ? logs 
        : logs.filter(log => log.level === level);

      res.json(filteredLogs);
    } catch (error) {
      logger.error('Error fetching logs', { error });
      res.status(500).json({ error: 'Failed to fetch logs' });
    }
  });

  // System metrics endpoint for admin dashboard
  app.get('/api/admin/metrics', requireAdmin, async (req, res) => {
    try {
      const userCount = await storage.getUserCount();
      
      const metrics = [
        {
          name: 'Total Users',
          value: userCount,
          unit: '',
          status: 'good'
        },
        {
          name: 'Active Sessions',
          value: 1, // Current logged in user
          unit: '',
          status: 'good'
        },
        {
          name: 'System Uptime',
          value: Math.round(process.uptime() / 3600),
          unit: 'hours',
          status: 'good'
        },
        {
          name: 'Memory Usage',
          value: Math.round((process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100),
          unit: '%',
          status: 'good'
        },
        {
          name: 'API Response Time',
          value: 245,
          unit: 'ms',
          change: -12,
          status: 'good'
        },
        {
          name: 'Error Rate',
          value: 0.5,
          unit: '%',
          status: 'good'
        }
      ];

      res.json(metrics);
    } catch (error) {
      logger.error('Error fetching metrics', { error });
      res.status(500).json({ error: 'Failed to fetch metrics' });
    }
  });

  // System health endpoint for admin dashboard
  app.get('/api/admin/health', requireAdmin, async (req, res) => {
    try {
      const memoryUsage = process.memoryUsage();
      const uptime = process.uptime();

      // Calculate memory percentage
      const memoryPercent = Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100);

      // Check database health
      let databaseStatus = 'healthy';
      try {
        await storage.getUserCount();
      } catch (error) {
        databaseStatus = 'error';
      }

      // Check Redis health
      let redisStatus = 'warning'; // Since Redis is not connected in current setup
      try {
        if (redis && redis.isConnected()) {
          redisStatus = 'healthy';
        }
      } catch (error) {
        redisStatus = 'error';
      }

      const systemHealth = {
        cpu: Math.round(Math.random() * 30 + 20), // Mock CPU usage between 20-50%
        memory: memoryPercent,
        disk: 45, // Mock value
        database: databaseStatus,
        redis: redisStatus,
        status: databaseStatus === 'error' ? 'down' : 
                redisStatus === 'error' ? 'degraded' : 'healthy',
        uptime: Math.round(uptime),
        timestamp: new Date().toISOString()
      };

      res.json(systemHealth);
    } catch (error) {
      logger.error('Error checking system health', { error });
      res.status(500).json({ error: 'Failed to check system health' });
    }
  });

  // Export logs endpoint for admin dashboard
  app.get('/api/admin/logs/export', requireAdmin, async (req, res) => {
    try {
      const logsDir = join(process.cwd(), 'logs');
      const logPath = join(logsDir, 'app.log');
      
      let logs: string[] = [];
      if (existsSync(logPath)) {
        const logContent = readFileSync(logPath, 'utf-8');
        logs = logContent.split('\n').filter(line => line.trim() !== '');
      }

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=logs-${new Date().toISOString().split('T')[0]}.json`);
      res.json({
        exported_at: new Date().toISOString(),
        exported_by: req.user?.email,
        logs: logs
      });
    } catch (error) {
      logger.error('Error exporting logs', { error });
      res.status(500).json({ error: 'Failed to export logs' });
    }
  });

  // Script generation routes  
  app.post('/api/jenkins/generate', requireAuth, apiRateLimit, requireCredits(1), async (req, res) => {
    try {
      const { generateJenkinsPipeline } = await import('./services/jenkins-generator');
      const config = req.body;
      const script = generateJenkinsPipeline(config);
      
      await deductCreditForUsage(req.user!.id, "jenkins_generation");
      logger.info(`Jenkins pipeline generated for user ${req.user!.id}`, { projectName: config.projectName });
      
      res.json({ 
        script, 
        filename: `Jenkinsfile-${config.projectName || 'pipeline'}`,
        type: 'jenkins-pipeline'
      });
    } catch (error) {
      logger.error('Jenkins generation error', error);
      res.status(500).json({ error: 'Failed to generate Jenkins pipeline' });
    }
  });

  app.post('/api/ansible/generate', requireAuth, apiRateLimit, requireCredits(1), async (req, res) => {
    try {
      const { generateAnsiblePlaybook } = await import('./services/ansible-generator');
      const config = req.body;
      const playbook = generateAnsiblePlaybook(config);
      
      await deductCreditForUsage(req.user!.id, "ansible_generation");
      logger.info(`Ansible playbook generated for user ${req.user!.id}`, { playbookName: config.playbookName });
      
      res.json({ 
        playbook, 
        filename: `${config.playbookName || 'playbook'}.yml`,
        type: 'ansible-playbook'
      });
    } catch (error) {
      logger.error('Ansible generation error', error);
      res.status(500).json({ error: 'Failed to generate Ansible playbook' });
    }
  });

  app.post('/api/sonarqube/setup', requireAuth, apiRateLimit, requireCredits(1), async (req, res) => {
    try {
      const { generateSonarQubeSetup } = await import('./services/sonarqube-generator');
      const config = req.body;
      const script = generateSonarQubeSetup(config);
      
      await deductCreditForUsage(req.user!.id, "sonarqube_setup");
      logger.info(`SonarQube setup generated for user ${req.user!.id}`, { setupType: config.setupType });
      
      res.json({ 
        script, 
        filename: `sonarqube-setup-${config.setupType || 'docker'}.${config.setupType === 'kubernetes' ? 'yaml' : 'sh'}`,
        type: 'sonarqube-setup'
      });
    } catch (error) {
      logger.error('SonarQube setup generation error', error);
      res.status(500).json({ error: 'Failed to generate SonarQube setup' });
    }
  });

  // Snowflake setup generation
  app.post('/api/snowflake/generate', requireAuth, apiRateLimit, requireCredits(1), async (req, res) => {
    try {
      const { generateSnowflakeSetup } = await import('./services/snowflake-generator');
      const config = req.body;
      const script = generateSnowflakeSetup(config);
      
      await deductCreditForUsage(req.user!.id, "snowflake_setup");
      logger.info(`Snowflake setup generated for user ${req.user!.id}`, { databaseName: config.databaseName });
      
      res.json({ 
        script, 
        filename: `snowflake-setup-${config.databaseName || 'config'}.sql`,
        type: 'snowflake-setup'
      });
    } catch (error) {
      logger.error('Snowflake setup generation error', error);
      res.status(500).json({ error: 'Failed to generate Snowflake setup' });
    }
  });

  // Airflow DAG generation
  app.post('/api/airflow/generate', requireAuth, apiRateLimit, requireCredits(1), async (req, res) => {
    try {
      const { generateAirflowDAG } = await import('./services/airflow-generator');
      const config = req.body;
      const script = generateAirflowDAG(config);
      
      await deductCreditForUsage(req.user!.id, "airflow_generation");
      logger.info(`Airflow DAG generated for user ${req.user!.id}`, { dagId: config.dagId });
      
      res.json({ 
        script, 
        filename: `${config.dagId || 'dag'}.py`,
        type: 'airflow-dag'
      });
    } catch (error) {
      logger.error('Airflow DAG generation error', error);
      res.status(500).json({ error: 'Failed to generate Airflow DAG' });
    }
  });

  // ============ Impersonation Routes - Switch User Functionality ============
  const PRIMARY_ADMIN_EMAIL = "agrawalmayank200228@gmail.com";

  // Start impersonation - switch to another user
  app.post('/api/admin/impersonate/start', requireAuth, async (req, res) => {
    try {
      const { email, reason } = req.body;
      const impersonatorId = req.user!.id;
      const impersonatorEmail = req.user!.email;
      
      if (!email) {
        return res.status(400).json({ error: "Target user email is required" });
      }

      const isPrimaryAdmin = impersonatorEmail === PRIMARY_ADMIN_EMAIL;
      const isAdmin = (req.user as any).isAdmin || isPrimaryAdmin;
      const canImpersonate = (req.user as any).canImpersonate;
      
      if (!isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      if (!isPrimaryAdmin && !canImpersonate) {
        return res.status(403).json({ error: "You don't have impersonation privileges" });
      }
      
      const targetUser = await storage.getUserByEmail(email);
      if (!targetUser) {
        return res.status(404).json({ error: "User not found" });
      }

      if (targetUser.id === impersonatorId) {
        return res.status(400).json({ error: "Cannot impersonate yourself" });
      }
      
      await db.insert(impersonationLogs).values({
        impersonatorId,
        targetUserId: targetUser.id,
        reason: reason || null,
        action: 'start',
        ipAddress: req.ip || null,
        userAgent: req.headers['user-agent'] || null
      });
      
      (req.session as any).originalUserId = impersonatorId;
      (req.session as any).originalUserEmail = impersonatorEmail;
      (req.session as any).isImpersonating = true;
      
      req.login(targetUser, (err) => {
        if (err) {
          logger.error('Failed to switch user', { error: err, impersonatorId, targetUserId: targetUser.id });
          return res.status(500).json({ error: "Failed to switch user" });
        }
        logger.info(`User ${impersonatorEmail} started impersonating ${email}`, { impersonatorId, targetUserId: targetUser.id, reason });
        res.json({ success: true, user: targetUser, isImpersonating: true });
      });
    } catch (error) {
      logger.error('Impersonation start error', error);
      res.status(500).json({ error: 'Failed to start impersonation' });
    }
  });

  // End impersonation - return to original user
  app.post('/api/admin/impersonate/end', requireAuth, async (req, res) => {
    try {
      const session = req.session as any;
      if (!session.isImpersonating || !session.originalUserId) {
        return res.status(400).json({ error: "Not currently impersonating" });
      }
      
      const originalUserId = session.originalUserId;
      const targetUserId = req.user!.id;
      
      await db.insert(impersonationLogs).values({
        impersonatorId: originalUserId,
        targetUserId,
        action: 'end',
        ipAddress: req.ip || null,
        userAgent: req.headers['user-agent'] || null
      });
      
      const originalUser = await storage.getUser(originalUserId);
      if (!originalUser) {
        return res.status(500).json({ error: "Original user not found" });
      }
      
      delete session.originalUserId;
      delete session.originalUserEmail;
      delete session.isImpersonating;
      
      req.login(originalUser, (err) => {
        if (err) {
          logger.error('Failed to restore session', { error: err, originalUserId });
          return res.status(500).json({ error: "Failed to restore session" });
        }
        logger.info(`User ${originalUser.email} ended impersonation of user ${targetUserId}`);
        res.json({ success: true, user: originalUser });
      });
    } catch (error) {
      logger.error('Impersonation end error', error);
      res.status(500).json({ error: 'Failed to end impersonation' });
    }
  });

  // Get impersonation status
  app.get('/api/admin/impersonation-status', requireAuth, (req, res) => {
    const session = req.session as any;
    res.json({
      isImpersonating: !!session.isImpersonating,
      originalUserEmail: session.originalUserEmail || null
    });
  });

  // Grant impersonation privilege to admin
  app.post('/api/admin/grant-impersonate', requireAuth, async (req, res) => {
    try {
      const { userId } = req.body;
      const granterEmail = req.user!.email;
      const granterId = req.user!.id;
      
      if (granterEmail !== PRIMARY_ADMIN_EMAIL) {
        return res.status(403).json({ error: "Only primary admin can grant impersonation privileges" });
      }

      if (!userId || typeof userId !== 'number') {
        return res.status(400).json({ error: "Valid user ID is required" });
      }

      if (userId === granterId) {
        return res.status(400).json({ error: "Cannot grant impersonation to yourself" });
      }
      
      const targetUser = await storage.getUser(userId);
      if (!targetUser) {
        return res.status(404).json({ error: "User not found" });
      }

      if (!targetUser.isAdmin && targetUser.email !== PRIMARY_ADMIN_EMAIL) {
        return res.status(400).json({ error: "Target user must be an admin" });
      }
      
      await db.update(users).set({ canImpersonate: true }).where(eq(users.id, userId));
      logger.info(`Impersonation privilege granted to user ${userId} by ${granterEmail}`);
      res.json({ success: true });
    } catch (error) {
      logger.error('Grant impersonate error', error);
      res.status(500).json({ error: 'Failed to grant impersonation privilege' });
    }
  });

  // Revoke impersonation privilege
  app.post('/api/admin/revoke-impersonate', requireAuth, async (req, res) => {
    try {
      const { userId } = req.body;
      const granterEmail = req.user!.email;
      
      if (granterEmail !== PRIMARY_ADMIN_EMAIL) {
        return res.status(403).json({ error: "Only primary admin can revoke impersonation privileges" });
      }

      if (!userId || typeof userId !== 'number') {
        return res.status(400).json({ error: "Valid user ID is required" });
      }

      const targetUser = await storage.getUser(userId);
      if (!targetUser) {
        return res.status(404).json({ error: "User not found" });
      }
      
      await db.update(users).set({ canImpersonate: false }).where(eq(users.id, userId));
      logger.info(`Impersonation privilege revoked from user ${userId} by ${granterEmail}`);
      res.json({ success: true });
    } catch (error) {
      logger.error('Revoke impersonate error', error);
      res.status(500).json({ error: 'Failed to revoke impersonation privilege' });
    }
  });

  // Ban user
  app.post('/api/admin/ban-user', requireAuth, async (req, res) => {
    try {
      const { userId, reason } = req.body;
      const adminEmail = req.user!.email;
      
      const isAdmin = req.user!.isAdmin || adminEmail === PRIMARY_ADMIN_EMAIL;
      if (!isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      if (!userId || typeof userId !== 'number') {
        return res.status(400).json({ error: "Valid user ID is required" });
      }

      if (userId === req.user!.id) {
        return res.status(400).json({ error: "Cannot ban yourself" });
      }

      const targetUser = await storage.getUser(userId);
      if (!targetUser) {
        return res.status(404).json({ error: "User not found" });
      }

      if (targetUser.email === PRIMARY_ADMIN_EMAIL) {
        return res.status(403).json({ error: "Cannot ban the primary admin" });
      }

      await storage.banUser(userId, reason || 'No reason provided');
      logger.info(`User ${userId} banned by ${adminEmail}`, { reason });
      res.json({ success: true });
    } catch (error) {
      logger.error('Ban user error', error);
      res.status(500).json({ error: 'Failed to ban user' });
    }
  });

  // Unban user
  app.post('/api/admin/unban-user', requireAuth, async (req, res) => {
    try {
      const { userId } = req.body;
      const adminEmail = req.user!.email;
      
      const isAdmin = req.user!.isAdmin || adminEmail === PRIMARY_ADMIN_EMAIL;
      if (!isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      if (!userId || typeof userId !== 'number') {
        return res.status(400).json({ error: "Valid user ID is required" });
      }

      const targetUser = await storage.getUser(userId);
      if (!targetUser) {
        return res.status(404).json({ error: "User not found" });
      }

      await storage.unbanUser(userId);
      logger.info(`User ${userId} unbanned by ${adminEmail}`);
      res.json({ success: true });
    } catch (error) {
      logger.error('Unban user error', error);
      res.status(500).json({ error: 'Failed to unban user' });
    }
  });

  // Update user credits
  app.post('/api/admin/update-credits', requireAuth, async (req, res) => {
    try {
      const { email, credits } = req.body;
      const adminEmail = req.user!.email;
      
      const isAdmin = req.user!.isAdmin || adminEmail === PRIMARY_ADMIN_EMAIL;
      if (!isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      if (!email || typeof credits !== 'number') {
        return res.status(400).json({ error: "Email and credits amount required" });
      }

      const targetUser = await storage.getUserByEmail(email);
      if (!targetUser) {
        return res.status(404).json({ error: "User not found" });
      }

      await storage.updateUserCredits(targetUser.id, credits);
      logger.info(`Credits updated for ${email} to ${credits} by ${adminEmail}`);
      res.json({ success: true });
    } catch (error) {
      logger.error('Update credits error', error);
      res.status(500).json({ error: 'Failed to update credits' });
    }
  });

  // Update domain config
  app.put('/api/admin/domain-configs/:domain', requireAuth, async (req, res) => {
    try {
      const { domain } = req.params;
      const { isEnabled, comingSoonMessage } = req.body;
      const adminEmail = req.user!.email;
      
      const isAdmin = req.user!.isAdmin || adminEmail === PRIMARY_ADMIN_EMAIL;
      if (!isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      if (typeof isEnabled !== 'boolean') {
        return res.status(400).json({ error: "isEnabled must be a boolean" });
      }

      const updatedConfig = await storage.updateDomainConfig(
        domain,
        isEnabled,
        comingSoonMessage || null,
        req.user!.id
      );
      
      logger.info(`Domain ${domain} config updated by ${adminEmail}`, { isEnabled, comingSoonMessage });
      res.json(updatedConfig);
    } catch (error) {
      logger.error('Update domain config error', error);
      res.status(500).json({ error: 'Failed to update domain config' });
    }
  });

  // AI Chatbot endpoint
  app.post('/api/chatbot', requireAuth, async (req, res) => {
    try {
      const { message } = req.body;
      const userId = req.user!.id;

      if (!message || typeof message !== 'string' || message.length < 2) {
        return res.status(400).json({ error: "Message is required" });
      }

      if (message.length > 2000) {
        return res.status(400).json({ error: "Message too long (max 2000 characters)" });
      }

      const gemini = await import('./services/gemini');
      
      const systemPrompt = `You are CloudForge AI Assistant, a helpful DevOps and cloud infrastructure expert. You help users with:
- DevOps best practices and tooling
- Docker, Kubernetes, CI/CD pipelines
- Cloud infrastructure (AWS, GCP, Azure)
- Infrastructure as Code (Terraform, Ansible)
- Monitoring and observability
- Security best practices

Be concise, practical, and provide code examples when helpful. Focus on production-ready solutions.`;

      const response = await gemini.generateChatResponse(systemPrompt, message);
      
      logger.info(`Chatbot query from user ${userId}`, { messageLength: message.length });
      res.json({ response });
    } catch (error) {
      logger.error('Chatbot error', error);
      res.status(500).json({ error: 'Failed to generate response' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

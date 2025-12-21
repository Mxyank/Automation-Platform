import * as client from 'prom-client';
import { Request, Response, NextFunction } from 'express';

// Create a Registry which registers the metrics
const register = new client.Registry();

// Add default metrics (CPU, memory, etc.)
client.collectDefaultMetrics({ register });

// Custom metrics for the application
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code', 'user_id'],
  buckets: [0.1, 0.5, 1, 2, 5, 10]
});

const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code', 'user_id']
});

const activeUsers = new client.Gauge({
  name: 'active_users_total',
  help: 'Number of currently active users'
});

const aiQueriesTotal = new client.Counter({
  name: 'ai_queries_total',
  help: 'Total number of AI queries made',
  labelNames: ['user_id', 'success']
});

const creditsUsed = new client.Counter({
  name: 'credits_used_total',
  help: 'Total number of credits used',
  labelNames: ['user_id', 'feature']
});

const errorRate = new client.Counter({
  name: 'errors_total',
  help: 'Total number of errors',
  labelNames: ['type', 'route', 'user_id']
});

const databaseQueries = new client.Histogram({
  name: 'database_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'table'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2]
});

const redisOperations = new client.Histogram({
  name: 'redis_operation_duration_seconds',
  help: 'Duration of Redis operations in seconds',
  labelNames: ['operation', 'success'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5]
});

// Register all metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestsTotal);
register.registerMetric(activeUsers);
register.registerMetric(aiQueriesTotal);
register.registerMetric(creditsUsed);
register.registerMetric(errorRate);
register.registerMetric(databaseQueries);
register.registerMetric(redisOperations);

// Middleware to collect HTTP metrics
export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - startTime) / 1000;
    const route = req.route?.path || req.path;
    const method = req.method;
    const statusCode = res.statusCode.toString();
    const userId = (req as any).user?.id?.toString() || 'anonymous';
    
    // Record metrics
    httpRequestDuration
      .labels(method, route, statusCode, userId)
      .observe(duration);
      
    httpRequestsTotal
      .labels(method, route, statusCode, userId)
      .inc();
      
    // Track errors
    if (res.statusCode >= 400) {
      errorRate
        .labels('http_error', route, userId)
        .inc();
    }
  });
  
  next();
}

// Function to update active users count
export function updateActiveUsers(count: number) {
  activeUsers.set(count);
}

// Function to track AI queries
export function trackAIQuery(userId: string, success: boolean) {
  aiQueriesTotal
    .labels(userId, success.toString())
    .inc();
}

// Function to track credit usage
export function trackCreditsUsed(userId: string, feature: string, amount: number = 1) {
  creditsUsed
    .labels(userId, feature)
    .inc(amount);
}

// Function to track database operations
export function trackDatabaseQuery(operation: string, table: string, duration: number) {
  databaseQueries
    .labels(operation, table)
    .observe(duration / 1000);
}

// Function to track Redis operations
export function trackRedisOperation(operation: string, success: boolean, duration: number) {
  redisOperations
    .labels(operation, success.toString())
    .observe(duration / 1000);
}

// Function to track custom errors
export function trackError(type: string, route: string, userId: string = 'anonymous') {
  errorRate
    .labels(type, route, userId)
    .inc();
}

export { register };
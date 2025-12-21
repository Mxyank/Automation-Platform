import client from 'prom-client';

const register = new client.Registry();

client.collectDefaultMetrics({ register });

export const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
  registers: [register],
});

export const httpRequestTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

export const activeUsers = new client.Gauge({
  name: 'active_users_total',
  help: 'Total number of active users',
  registers: [register],
});

export const totalUsers = new client.Gauge({
  name: 'total_users',
  help: 'Total number of registered users',
  registers: [register],
});

export const totalProjects = new client.Gauge({
  name: 'total_projects',
  help: 'Total number of projects',
  registers: [register],
});

export const apiGenerations = new client.Counter({
  name: 'api_generations_total',
  help: 'Total number of API generations',
  labelNames: ['type'],
  registers: [register],
});

export const dockerGenerations = new client.Counter({
  name: 'docker_generations_total',
  help: 'Total number of Docker file generations',
  registers: [register],
});

export const aiAssistanceRequests = new client.Counter({
  name: 'ai_assistance_requests_total',
  help: 'Total number of AI assistance requests',
  labelNames: ['feature'],
  registers: [register],
});

export const paymentTransactions = new client.Counter({
  name: 'payment_transactions_total',
  help: 'Total number of payment transactions',
  labelNames: ['status'],
  registers: [register],
});

export const creditsConsumed = new client.Counter({
  name: 'credits_consumed_total',
  help: 'Total credits consumed',
  registers: [register],
});

export const securityEvents = new client.Counter({
  name: 'security_events_total',
  help: 'Total security events',
  labelNames: ['type', 'severity'],
  registers: [register],
});

export const databaseQueryDuration = new client.Histogram({
  name: 'database_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'table'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register],
});

export const cacheHits = new client.Counter({
  name: 'cache_hits_total',
  help: 'Total number of cache hits',
  labelNames: ['cache_type'],
  registers: [register],
});

export const cacheMisses = new client.Counter({
  name: 'cache_misses_total',
  help: 'Total number of cache misses',
  labelNames: ['cache_type'],
  registers: [register],
});

export const errorRate = new client.Counter({
  name: 'errors_total',
  help: 'Total number of errors',
  labelNames: ['type', 'endpoint'],
  registers: [register],
});

export const metricsRegistry = register;

export function getMetrics() {
  return register.metrics();
}

export function getContentType() {
  return register.contentType;
}

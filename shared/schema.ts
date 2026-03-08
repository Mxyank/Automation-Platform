import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password"), // Make password optional for OAuth users
  credits: integer("credits").default(2).notNull(), // New users get 2 free credits
  razorpayCustomerId: text("razorpay_customer_id"),
  googleId: text("google_id").unique(), // Google OAuth ID
  avatar: text("avatar"), // Profile picture from Google
  provider: text("provider").default("local").notNull(), // 'local' or 'google'
  isPremium: boolean("is_premium").default(false).notNull(), // Premium subscription status
  premiumExpiresAt: timestamp("premium_expires_at"), // Premium expiration date
  hasSeenTour: boolean("has_seen_tour").default(false).notNull(), // Track if user has seen the onboarding tour
  isAdmin: boolean("is_admin").default(false).notNull(), // Admin role for platform management
  adminGrantedBy: text("admin_granted_by"), // Email of admin who granted access
  adminGrantedAt: timestamp("admin_granted_at"), // When admin access was granted
  primaryDomain: text("primary_domain").default("devops").notNull(), // 'devops', 'data-engineering', 'cybersecurity'
  isBanned: boolean("is_banned").default(false).notNull(), // User ban status
  bannedAt: timestamp("banned_at"), // When user was banned
  banReason: text("ban_reason"), // Reason for ban
  canImpersonate: boolean("can_impersonate").default(false).notNull(), // Can switch to other user accounts
  lastActiveAt: timestamp("last_active_at"), // Last activity timestamp
  resetToken: text("reset_token"), // For password reset links
  resetTokenExpiresAt: timestamp("reset_token_expires_at"), // Reset link expiration
  githubAccessToken: text("github_access_token"), // GitHub OAuth token
  githubUsername: text("github_username"), // GitHub username
  // Profile fields
  headline: text("headline"), // e.g. "Senior DevOps Engineer"
  bio: text("bio"),
  location: text("location"),
  company: text("company"),
  role: text("role"),
  skills: jsonb("skills"), // ["Docker", "AWS", "Kubernetes"]
  experience: jsonb("experience"), // [{company, role, from, to}]
  userProjects: jsonb("user_projects"), // [{name, description, url}]
  socialLinks: jsonb("social_links"), // {linkedin, github, twitter, website}
  profileCompleted: boolean("profile_completed").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User connections (LinkedIn-style)
export const connections = pgTable("connections", {
  id: serial("id").primaryKey(),
  requesterId: integer("requester_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  receiverId: integer("receiver_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: text("status").default("pending").notNull(), // pending, accepted, declined
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Stories (Expired after 24h)
export const stories = pgTable("stories", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  mediaUrl: text("media_url").notNull(), // Base64 or URL
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
});

// User Posts (Instagram-style)
export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content"),
  mediaUrl: text("media_url"), // Base64 or URL
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Post Likes
export const postLikes = pgTable("post_likes", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Post Comments
export const postComments = pgTable("post_comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Chat conversations
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  user1Id: integer("user1_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  user2Id: integer("user2_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  lastMessageAt: timestamp("last_message_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Chat messages
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  senderId: integer("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Security scan results from GitHub repo analysis
export const securityScans = pgTable("security_scans", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  repoName: text("repo_name").notNull(),
  repoUrl: text("repo_url").notNull(),
  score: integer("score"), // 0-100 security score
  findings: jsonb("findings"), // Array of security issues
  summary: text("summary"),
  status: text("status").default("pending").notNull(), // pending, scanning, complete, failed
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const session = pgTable("session", {
  sid: text("sid").primaryKey(),
  sess: jsonb("sess").notNull(),
  expire: timestamp("expire").notNull(),
});

// Domain configuration for enabling/disabling platform domains
export const domainConfigs = pgTable("domain_configs", {
  id: serial("id").primaryKey(),
  domain: text("domain").notNull().unique(), // 'devops', 'dataeng', 'security'
  isEnabled: boolean("is_enabled").default(false).notNull(),
  comingSoonMessage: text("coming_soon_message"),
  updatedBy: integer("updated_by").references(() => users.id, { onDelete: "set null" }),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Site settings for promotions and feature toggles
export const siteSettings = pgTable("site_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: boolean("value").default(false).notNull(),
  stringValue: text("string_value"),
  numberValue: integer("number_value"),
  label: text("label").notNull(),
  description: text("description"),
  updatedBy: integer("updated_by").references(() => users.id, { onDelete: "set null" }),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Incident/Helpdesk tickets
export const incidents = pgTable("incidents", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // 'bug', 'abuse', 'billing', 'feature', 'other'
  priority: text("priority").default("medium").notNull(), // 'low', 'medium', 'high', 'critical'
  status: text("status").default("open").notNull(), // 'open', 'in_progress', 'resolved', 'closed', 'reopened'
  assigneeId: integer("assignee_id").references(() => users.id, { onDelete: "set null" }),
  resolution: text("resolution"), // Resolution notes from admin
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  closedAt: timestamp("closed_at"),
});

// Incident messages/responses
export const incidentMessages = pgTable("incident_messages", {
  id: serial("id").primaryKey(),
  incidentId: integer("incident_id").notNull().references(() => incidents.id, { onDelete: "cascade" }),
  authorId: integer("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  authorRole: text("author_role").notNull(), // 'user', 'admin'
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'api', 'docker', 'ci-cd'
  config: jsonb("config").notNull(),
  generatedCode: text("generated_code"),
  status: text("status").default("draft").notNull(), // 'draft', 'active', 'deploying'
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const usage = pgTable("usage", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  featureName: text("feature_name").notNull(), // 'api_generation', 'docker_generation', 'ai_assistance'
  usedCount: integer("used_count").default(0).notNull(),
  lastUsed: timestamp("last_used").defaultNow().notNull(),
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  razorpayPaymentId: text("razorpay_payment_id"),
  amount: integer("amount").notNull(), // in paise
  credits: integer("credits").notNull(),
  status: text("status").notNull(), // 'pending', 'completed', 'failed'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  planType: text("plan_type").notNull(), // 'ai-pro-monthly', 'ai-pro-annual'
  status: text("status").notNull().default("active"), // 'active', 'cancelled', 'expired'
  razorpaySubscriptionId: text("razorpay_subscription_id"),
  startDate: timestamp("start_date").defaultNow().notNull(),
  endDate: timestamp("end_date").notNull(),
  autoRenew: boolean("auto_renew").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Security logs for admin dashboard
export const securityLogs = pgTable("security_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  action: text("action").notNull(), // 'login', 'logout', 'failed_login', 'password_change', 'api_access', 'admin_action'
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  details: jsonb("details"), // Additional context
  severity: text("severity").default("info").notNull(), // 'info', 'warning', 'critical'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Push notification subscriptions
export const pushSubscriptions = pgTable("push_subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(), // Public key
  auth: text("auth").notNull(), // Auth secret
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// System metrics for Prometheus/Grafana
export const systemMetrics = pgTable("system_metrics", {
  id: serial("id").primaryKey(),
  metricName: text("metric_name").notNull(),
  metricValue: text("metric_value").notNull(),
  labels: jsonb("labels"),
  recordedAt: timestamp("recorded_at").defaultNow().notNull(),
});

// Admin activity log
export const adminActivityLog = pgTable("admin_activity_log", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  action: text("action").notNull(), // 'grant_admin', 'revoke_admin', 'view_users', 'view_logs', etc.
  targetUserId: integer("target_user_id").references(() => users.id, { onDelete: "set null" }),
  details: jsonb("details"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Impersonation audit logs
export const impersonationLogs = pgTable("impersonation_logs", {
  id: serial("id").primaryKey(),
  impersonatorId: integer("impersonator_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  targetUserId: integer("target_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  reason: text("reason"),
  action: text("action").notNull(), // 'start', 'end'
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
  usage: many(usage),
  payments: many(payments),
  subscriptions: many(subscriptions),
  securityLogs: many(securityLogs),
  pushSubscriptions: many(pushSubscriptions),
  adminActivityLogs: many(adminActivityLog),
  incidents: many(incidents),
  incidentMessages: many(incidentMessages),
  stories: many(stories),
  posts: many(posts),
}));

export const storiesRelations = relations(stories, ({ one }) => ({
  user: one(users, {
    fields: [stories.userId],
    references: [users.id],
  }),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  user: one(users, {
    fields: [posts.userId],
    references: [users.id],
  }),
  likes: many(postLikes),
  comments: many(postComments),
}));

export const postLikesRelations = relations(postLikes, ({ one }) => ({
  post: one(posts, {
    fields: [postLikes.postId],
    references: [posts.id],
  }),
  user: one(users, {
    fields: [postLikes.userId],
    references: [users.id],
  }),
}));

export const postCommentsRelations = relations(postComments, ({ one }) => ({
  post: one(posts, {
    fields: [postComments.postId],
    references: [posts.id],
  }),
  user: one(users, {
    fields: [postComments.userId],
    references: [users.id],
  }),
}));

export const domainConfigsRelations = relations(domainConfigs, ({ one }) => ({
  updatedByUser: one(users, {
    fields: [domainConfigs.updatedBy],
    references: [users.id],
  }),
}));

export const incidentsRelations = relations(incidents, ({ one, many }) => ({
  user: one(users, {
    fields: [incidents.userId],
    references: [users.id],
  }),
  assignee: one(users, {
    fields: [incidents.assigneeId],
    references: [users.id],
  }),
  messages: many(incidentMessages),
}));

export const incidentMessagesRelations = relations(incidentMessages, ({ one }) => ({
  incident: one(incidents, {
    fields: [incidentMessages.incidentId],
    references: [incidents.id],
  }),
  author: one(users, {
    fields: [incidentMessages.authorId],
    references: [users.id],
  }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
}));

export const projectsRelations = relations(projects, ({ one }) => ({
  user: one(users, {
    fields: [projects.userId],
    references: [users.id],
  }),
}));

export const usageRelations = relations(usage, ({ one }) => ({
  user: one(users, {
    fields: [usage.userId],
    references: [users.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  user: one(users, {
    fields: [payments.userId],
    references: [users.id],
  }),
}));

export const securityLogsRelations = relations(securityLogs, ({ one }) => ({
  user: one(users, {
    fields: [securityLogs.userId],
    references: [users.id],
  }),
}));

export const pushSubscriptionsRelations = relations(pushSubscriptions, ({ one }) => ({
  user: one(users, {
    fields: [pushSubscriptions.userId],
    references: [users.id],
  }),
}));

export const adminActivityLogRelations = relations(adminActivityLog, ({ one }) => ({
  admin: one(users, {
    fields: [adminActivityLog.adminId],
    references: [users.id],
  }),
  targetUser: one(users, {
    fields: [adminActivityLog.targetUserId],
    references: [users.id],
  }),
}));

export const impersonationLogsRelations = relations(impersonationLogs, ({ one }) => ({
  impersonator: one(users, {
    fields: [impersonationLogs.impersonatorId],
    references: [users.id],
  }),
  targetUser: one(users, {
    fields: [impersonationLogs.targetUserId],
    references: [users.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
});

export const insertProjectSchema = createInsertSchema(projects).pick({
  name: true,
  type: true,
  config: true,
  generatedCode: true,
  status: true,
});

export const insertUsageSchema = createInsertSchema(usage).pick({
  featureName: true,
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).pick({
  planType: true,
  endDate: true,
});

export const insertSecurityLogSchema = createInsertSchema(securityLogs).pick({
  userId: true,
  action: true,
  ipAddress: true,
  userAgent: true,
  details: true,
  severity: true,
});

export const insertPushSubscriptionSchema = createInsertSchema(pushSubscriptions).pick({
  userId: true,
  endpoint: true,
  p256dh: true,
  auth: true,
});

export const insertAdminActivityLogSchema = createInsertSchema(adminActivityLog).pick({
  adminId: true,
  action: true,
  targetUserId: true,
  details: true,
});

export const insertDomainConfigSchema = createInsertSchema(domainConfigs).pick({
  domain: true,
  isEnabled: true,
  comingSoonMessage: true,
});

export const insertSiteSettingSchema = createInsertSchema(siteSettings).pick({
  key: true,
  value: true,
  label: true,
  description: true,
});

export const insertIncidentSchema = createInsertSchema(incidents).pick({
  title: true,
  description: true,
  category: true,
  priority: true,
});

export const insertIncidentMessageSchema = createInsertSchema(incidentMessages).pick({
  incidentId: true,
  message: true,
});

export const insertStorySchema = createInsertSchema(stories).pick({
  userId: true,
  mediaUrl: true,
  expiresAt: true,
});

export const insertPostSchema = createInsertSchema(posts).pick({
  userId: true,
  content: true,
  mediaUrl: true,
});

export const insertPostCommentSchema = createInsertSchema(postComments).pick({
  postId: true,
  userId: true,
  content: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;
export type Usage = typeof usage.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type SecurityLog = typeof securityLogs.$inferSelect;
export type InsertSecurityLog = z.infer<typeof insertSecurityLogSchema>;
export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type InsertPushSubscription = z.infer<typeof insertPushSubscriptionSchema>;
export type SystemMetric = typeof systemMetrics.$inferSelect;
export type AdminActivityLog = typeof adminActivityLog.$inferSelect;
export type InsertAdminActivityLog = z.infer<typeof insertAdminActivityLogSchema>;
export type DomainConfig = typeof domainConfigs.$inferSelect;
export type InsertDomainConfig = z.infer<typeof insertDomainConfigSchema>;
export type SiteSetting = typeof siteSettings.$inferSelect;
export type InsertSiteSetting = z.infer<typeof insertSiteSettingSchema>;
export type Incident = typeof incidents.$inferSelect;
export type InsertIncident = z.infer<typeof insertIncidentSchema>;
export type IncidentMessage = typeof incidentMessages.$inferSelect;
export type InsertIncidentMessage = z.infer<typeof insertIncidentMessageSchema>;
export type SecurityScan = typeof securityScans.$inferSelect;
export type Connection = typeof connections.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Story = typeof stories.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type PostLike = typeof postLikes.$inferSelect;
export type PostComment = typeof postComments.$inferSelect;

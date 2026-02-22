import { users, projects, usage, payments, subscriptions, securityLogs, pushSubscriptions, adminActivityLog, domainConfigs, incidents, incidentMessages, siteSettings, type User, type InsertUser, type Project, type InsertProject, type Usage, type Payment, type Subscription, type SecurityLog, type InsertSecurityLog, type AdminActivityLog, type InsertAdminActivityLog, type DomainConfig, type Incident, type InsertIncident, type IncidentMessage, type InsertIncidentMessage, type SiteSetting } from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, count, gte, like, or, sum } from "drizzle-orm";
import { redis } from "./redis";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserCredits(userId: number, credits: number): Promise<User>;
  updateUserTourStatus(userId: number, hasSeenTour: boolean): Promise<User>;
  updateUserDomain(userId: number, domain: string): Promise<User>;
  getUserCount(): Promise<number>;
  // Password Reset
  setPasswordResetToken(userId: number, token: string | null, expiresAt: Date | null): Promise<void>;
  getUserByResetToken(token: string): Promise<User | undefined>;
  updateUserPassword(userId: number, password: string): Promise<User>;

  // Projects
  createProject(project: InsertProject & { userId: number }): Promise<Project>;
  getProjectsByUserId(userId: number): Promise<Project[]>;
  getProject(id: number): Promise<Project | undefined>;
  updateProject(id: number, updates: Partial<Project>): Promise<Project>;

  // Usage tracking
  getUsage(userId: number, featureName: string): Promise<Usage | undefined>;
  incrementUsage(userId: number, featureName: string): Promise<Usage>;

  // Payments
  createPayment(payment: Omit<Payment, 'id' | 'createdAt'>): Promise<Payment>;
  updatePaymentStatus(paymentId: string, status: string): Promise<void>;

  // Subscriptions
  getActiveSubscription(userId: number): Promise<Subscription | undefined>;
  createSubscription(subscription: Omit<Subscription, 'id' | 'createdAt'>): Promise<Subscription>;
  cancelSubscription(subscriptionId: number): Promise<Subscription>;
  updateUserPremiumStatus(userId: number, isPremium: boolean, expiresAt: Date | null): Promise<User>;

  // Site settings (public for display, admin-only for update)
  getSiteSettings(): Promise<SiteSetting[]>;
  getSiteSetting(key: string): Promise<SiteSetting | undefined>;
  updateSiteSetting(key: string, value: boolean | string | number, updatedBy: number): Promise<SiteSetting>;
  seedFeatureSettings(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    // Try to get from cache first
    const cachedUser = await redis.getCachedUser(id);
    if (cachedUser) {
      return cachedUser;
    }

    // Get from database
    const [user] = await db.select().from(users).where(eq(users.id, id));
    if (user) {
      // Cache for 1 hour
      await redis.cacheUser(id, user, 3600);
    }
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.googleId, googleId));
    return user || undefined;
  }

  async createGoogleUser(profile: any): Promise<User> {
    // Generate a unique username from email or Google name
    const baseUsername = profile.emails[0].value.split('@')[0];
    let username = baseUsername;
    let counter = 1;

    // Ensure username uniqueness
    while (await this.getUserByUsername(username)) {
      username = `${baseUsername}${counter}`;
      counter++;
    }

    const [user] = await db
      .insert(users)
      .values({
        username,
        email: profile.emails[0].value,
        googleId: profile.id,
        avatar: profile.photos[0]?.value,
        provider: "google",
        password: null, // OAuth users don't have passwords
      })
      .returning();
    return user;
  }

  async updateUserCredits(userId: number, credits: number): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ credits })
      .where(eq(users.id, userId))
      .returning();
    // Clear user cache when credits are updated
    await redis.clearUserCache(userId);
    return user;
  }

  async updateUserTourStatus(userId: number, hasSeenTour: boolean): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ hasSeenTour })
      .where(eq(users.id, userId))
      .returning();
    // Clear user cache when tour status is updated
    await redis.clearUserCache(userId);
    return user;
  }

  async updateUserDomain(userId: number, domain: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ primaryDomain: domain })
      .where(eq(users.id, userId))
      .returning();
    // Clear user cache when domain is updated
    await redis.clearUserCache(userId);
    return user;
  }

  async getUserCount(): Promise<number> {
    const result = await db.select().from(users);
    return result.length;
  }

  // Projects
  async createProject(project: InsertProject & { userId: number }): Promise<Project> {
    const [newProject] = await db
      .insert(projects)
      .values(project)
      .returning();
    // Clear cache when new project is created
    await redis.clearUserCache(project.userId);
    return newProject;
  }

  async getProjectsByUserId(userId: number): Promise<Project[]> {
    // Try to get from cache first
    const cachedProjects = await redis.getCachedUserProjects(userId);
    if (cachedProjects) {
      return cachedProjects;
    }

    // Get from database
    const userProjects = await db
      .select()
      .from(projects)
      .where(eq(projects.userId, userId))
      .orderBy(desc(projects.createdAt));

    if (userProjects.length > 0) {
      // Cache for 30 minutes
      await redis.cacheUserProjects(userId, userProjects, 1800);
    }

    return userProjects;
  }

  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project || undefined;
  }

  async updateProject(id: number, updates: Partial<Project>): Promise<Project> {
    const [project] = await db
      .update(projects)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return project;
  }

  // Usage tracking
  async getUsage(userId: number, featureName: string): Promise<Usage | undefined> {
    const [usageRecord] = await db
      .select()
      .from(usage)
      .where(and(eq(usage.userId, userId), eq(usage.featureName, featureName)));
    return usageRecord || undefined;
  }

  async incrementUsage(userId: number, featureName: string): Promise<Usage> {
    const existingUsage = await this.getUsage(userId, featureName);

    if (existingUsage) {
      const [updated] = await db
        .update(usage)
        .set({
          usedCount: existingUsage.usedCount + 1,
          lastUsed: new Date()
        })
        .where(eq(usage.id, existingUsage.id))
        .returning();
      return updated;
    } else {
      const [newUsage] = await db
        .insert(usage)
        .values({
          userId,
          featureName,
          usedCount: 1,
        })
        .returning();
      return newUsage;
    }
  }

  // Payments
  async createPayment(payment: Omit<Payment, 'id' | 'createdAt'>): Promise<Payment> {
    const [newPayment] = await db
      .insert(payments)
      .values(payment)
      .returning();
    return newPayment;
  }

  async updatePaymentStatus(paymentId: string, status: string): Promise<void> {
    await db
      .update(payments)
      .set({ status })
      .where(eq(payments.razorpayPaymentId, paymentId));
  }

  // Subscriptions
  async getActiveSubscription(userId: number): Promise<Subscription | undefined> {
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.status, 'active')
      ))
      .orderBy(desc(subscriptions.endDate));

    if (subscription && new Date(subscription.endDate) > new Date()) {
      return subscription;
    }
    return undefined;
  }

  async createSubscription(subscription: Omit<Subscription, 'id' | 'createdAt'>): Promise<Subscription> {
    const [newSubscription] = await db
      .insert(subscriptions)
      .values(subscription)
      .returning();

    // Update user premium status
    await this.updateUserPremiumStatus(subscription.userId, true, subscription.endDate);

    return newSubscription;
  }

  async cancelSubscription(subscriptionId: number): Promise<Subscription> {
    const [subscription] = await db
      .update(subscriptions)
      .set({ status: 'cancelled', autoRenew: false })
      .where(eq(subscriptions.id, subscriptionId))
      .returning();

    return subscription;
  }

  async updateUserPremiumStatus(userId: number, isPremium: boolean, expiresAt: Date | null): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ isPremium, premiumExpiresAt: expiresAt })
      .where(eq(users.id, userId))
      .returning();

    await redis.clearUserCache(userId);
    return user;
  }

  // Admin methods
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getAdminUsers(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.isAdmin, true));
  }

  async grantAdminAccess(userId: number, grantedByEmail: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        isAdmin: true,
        adminGrantedBy: grantedByEmail,
        adminGrantedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    await redis.clearUserCache(userId);
    return user;
  }

  async revokeAdminAccess(userId: number): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        isAdmin: false,
        adminGrantedBy: null,
        adminGrantedAt: null
      })
      .where(eq(users.id, userId))
      .returning();
    await redis.clearUserCache(userId);
    return user;
  }

  // Security logs
  async createSecurityLog(log: InsertSecurityLog): Promise<SecurityLog> {
    const [newLog] = await db.insert(securityLogs).values(log).returning();
    return newLog;
  }

  async getSecurityLogs(limit: number = 100): Promise<SecurityLog[]> {
    return await db
      .select()
      .from(securityLogs)
      .orderBy(desc(securityLogs.createdAt))
      .limit(limit);
  }

  async getSecurityLogsByUser(userId: number, limit: number = 50): Promise<SecurityLog[]> {
    return await db
      .select()
      .from(securityLogs)
      .where(eq(securityLogs.userId, userId))
      .orderBy(desc(securityLogs.createdAt))
      .limit(limit);
  }

  // Admin activity log
  async createAdminActivityLog(log: InsertAdminActivityLog): Promise<AdminActivityLog> {
    const [newLog] = await db.insert(adminActivityLog).values(log).returning();
    return newLog;
  }

  async getAdminActivityLogs(limit: number = 100): Promise<AdminActivityLog[]> {
    return await db
      .select()
      .from(adminActivityLog)
      .orderBy(desc(adminActivityLog.createdAt))
      .limit(limit);
  }

  // Platform stats for admin
  async getPlatformStats(): Promise<{
    totalUsers: number;
    totalProjects: number;
    totalPayments: number;
    premiumUsers: number;
    adminCount: number;
    totalSubscriptions: number;
    totalPaymentAmount: number;
  }> {
    const [userStats] = await db.select({ count: count() }).from(users);
    const [projectStats] = await db.select({ count: count() }).from(projects);
    const [paymentStats] = await db.select({ count: count() }).from(payments);
    const [premiumStats] = await db.select({ count: count() }).from(users).where(eq(users.isPremium, true));
    const [adminStats] = await db.select({ count: count() }).from(users).where(eq(users.isAdmin, true));
    const [subscriptionStats] = await db.select({ count: count() }).from(subscriptions);
    const [paymentAmountStats] = await db.select({ total: sum(payments.amount) }).from(payments);

    return {
      totalUsers: userStats.count,
      totalProjects: projectStats.count,
      totalPayments: paymentStats.count,
      premiumUsers: premiumStats.count,
      adminCount: adminStats.count,
      totalSubscriptions: subscriptionStats.count,
      totalPaymentAmount: Number(paymentAmountStats.total) || 0,
    };
  }

  // Get all payments for admin
  async getAllPayments(limit: number = 100): Promise<Payment[]> {
    return await db
      .select()
      .from(payments)
      .orderBy(desc(payments.createdAt))
      .limit(limit);
  }

  // Get all subscriptions for admin
  async getAllSubscriptions(limit: number = 100): Promise<Subscription[]> {
    return await db
      .select()
      .from(subscriptions)
      .orderBy(desc(subscriptions.createdAt))
      .limit(limit);
  }

  // Domain config methods
  async getDomainConfigs(): Promise<DomainConfig[]> {
    return await db.select().from(domainConfigs);
  }

  async getDomainConfig(domain: string): Promise<DomainConfig | undefined> {
    const [config] = await db.select().from(domainConfigs).where(eq(domainConfigs.domain, domain));
    return config || undefined;
  }

  async updateDomainConfig(domain: string, isEnabled: boolean, message: string | null, updatedBy: number): Promise<DomainConfig> {
    const existing = await this.getDomainConfig(domain);
    if (existing) {
      const [updated] = await db
        .update(domainConfigs)
        .set({ isEnabled, comingSoonMessage: message, updatedBy, updatedAt: new Date() })
        .where(eq(domainConfigs.domain, domain))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(domainConfigs)
        .values({ domain, isEnabled, comingSoonMessage: message, updatedBy })
        .returning();
      return created;
    }
  }

  // Site settings methods
  async getSiteSettings(): Promise<SiteSetting[]> {
    return await db.select().from(siteSettings);
  }

  async getSiteSetting(key: string): Promise<SiteSetting | undefined> {
    const [setting] = await db.select().from(siteSettings).where(eq(siteSettings.key, key));
    return setting || undefined;
  }

  async updateSiteSetting(key: string, value: boolean | string | number, updatedBy: number): Promise<SiteSetting> {
    const updates: any = { updatedBy, updatedAt: new Date() };

    if (typeof value === "boolean") {
      updates.value = value;
    } else if (typeof value === "string") {
      updates.stringValue = value;
    } else if (typeof value === "number") {
      updates.numberValue = value;
    }

    const [updated] = await db
      .update(siteSettings)
      .set(updates)
      .where(eq(siteSettings.key, key))
      .returning();
    return updated;
  }

  async seedFeatureSettings(): Promise<void> {
    const defaultSettings = [
      // Core Features
      { key: "feature_docker_generation", label: "Docker Setup", description: "Enable/Disable Dockerfile and Docker Compose generation", value: true },
      { key: "feature_api_generation", label: "API Generator", description: "Enable/Disable CRUD API generation tools", value: true },
      { key: "feature_cicd_generation", label: "CI/CD Pipeline", description: "Enable/Disable GitHub Actions and CI/CD tools", value: true },
      { key: "feature_ai_assistance", label: "AI DevOps Assistant", description: "Enable/Disable AI-powered DevOps chat and analysis", value: true },
      { key: "feature_ansible_generation", label: "Ansible Setup", description: "Enable/Disable Ansible playbook generation", value: true },

      // Additional Domains
      { key: "feature_airflow_generation", label: "Airflow Generator", description: "Enable/Disable Apache Airflow DAG generation", value: true },
      { key: "feature_blueprint_generator", label: "Blueprint Generator", description: "Enable/Disable Architecture Blueprint generation", value: true },
      { key: "feature_cloud_optimizer", label: "Cloud Optimizer", description: "Enable/Disable Cloud resource optimization tools", value: true },
      { key: "feature_cloud_search", label: "Cloud Search", description: "Enable/Disable Cloud infrastructure search", value: true },
      { key: "feature_cost_estimator", label: "Cost Estimator", description: "Enable/Disable Infrastructure cost estimation", value: true },
      { key: "feature_database_optimizer", label: "DB Optimizer", description: "Enable/Disable Database query optimization", value: true },
      { key: "feature_deployment_simulator", label: "Deployment Simulator", description: "Enable/Disable visual deployment simulations", value: true },
      { key: "feature_env_replicator", label: "Env Replicator", description: "Enable/Disable environment replication tools", value: true },
      { key: "feature_helpdesk", label: "Help Desk", description: "Enable/Disable incident management and support tickets", value: true },
      { key: "feature_iac_autofix", label: "IaC Autofix", description: "Enable/Disable automatic IaC security fixes", value: true },
      { key: "feature_infra_chat", label: "Infra Chat", description: "Enable/Disable platform-wide infrastructure chat", value: true },
      { key: "feature_logs_dashboard", label: "Logs Dashboard", description: "Enable/Disable centralized logging view", value: true },
      { key: "feature_migration_assistant", label: "Migration Assistant", description: "Enable/Disable cloud migration tools", value: true },
      { key: "feature_postmortem", label: "Postmortem Generator", description: "Enable/Disable AI-powered incident postmortems", value: true },
      { key: "feature_secret_scanner", label: "Secret Scanner", description: "Enable/Disable security secret scanning", value: true },
      { key: "feature_security_dashboard", label: "Security Dashboard", description: "Enable/Disable centralized security overview", value: true },
      { key: "feature_snowflake_setup", label: "Snowflake Setup", description: "Enable/Disable Snowflake data warehouse tools", value: true },
      { key: "feature_sonar_dashboard", label: "Sonar Dashboard", description: "Enable/Disable SonarQube metrics integration", value: true },
      { key: "feature_sonarqube_setup", label: "Sonarqube Setup", description: "Enable/Disable SonarQube infrastructure setup", value: true },
      { key: "feature_website_monitor", label: "Website Monitor", description: "Enable/Disable website uptime monitoring", value: true },

      // Promotions & Sales
      { key: "promo_banner_active", label: "Global Promo Banner", description: "Enable/Disable the banner at the top of the landing page", value: false },
      { key: "promo_banner_text", label: "Promo Banner Text", description: "The message shown in the global promotional banner", value: false, stringValue: "🚀 New Feature: Visual Pipeline Builder is now live! Try it today." },
      { key: "sale_active", label: "Platform Sale Mode", description: "When enabled, applies discounts to all pricing and shows sale banners", value: false },
      { key: "sale_percentage", label: "Sale Discount Percentage", description: "Percentage to discount from all products (0-100)", value: false, numberValue: 20 },
      { key: "ad_template_primary", label: "Primary Ad Template", description: "Markdown/HTML template for promotional cards", value: false, stringValue: "### Summer Sale is LIVE!\nGet **20% OFF** on all credit packages for a limited time." },
    ];

    for (const setting of defaultSettings) {
      const existing = await this.getSiteSetting(setting.key);
      if (!existing) {
        await db.insert(siteSettings).values({
          ...setting,
          updatedAt: new Date(),
        });
      }
    }
  }

  // User ban methods
  async banUser(userId: number, reason: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ isBanned: true, bannedAt: new Date(), banReason: reason })
      .where(eq(users.id, userId))
      .returning();
    await redis.clearUserCache(userId);
    return user;
  }

  async unbanUser(userId: number): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ isBanned: false, bannedAt: null, banReason: null })
      .where(eq(users.id, userId))
      .returning();
    await redis.clearUserCache(userId);
    return user;
  }

  async updateUserCreditsByEmail(email: string, credits: number): Promise<User | undefined> {
    const user = await this.getUserByEmail(email);
    if (!user) return undefined;
    return await this.updateUserCredits(user.id, credits);
  }

  async updateLastActive(userId: number): Promise<void> {
    await db.update(users).set({ lastActiveAt: new Date() }).where(eq(users.id, userId));
    await redis.clearUserCache(userId);
  }

  async updateUserPassword(userId: number, hashedPassword: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiresAt: null
      })
      .where(eq(users.id, userId))
      .returning();
    await redis.clearUserCache(userId);
    return user;
  }

  async setPasswordResetToken(userId: number, token: string | null, expiresAt: Date | null): Promise<void> {
    await db
      .update(users)
      .set({ resetToken: token, resetTokenExpiresAt: expiresAt })
      .where(eq(users.id, userId));
    await redis.clearUserCache(userId);
  }

  async getUserByResetToken(token: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(and(
        eq(users.resetToken, token),
        gte(users.resetTokenExpiresAt, new Date())
      ));
    return user || undefined;
  }

  // Enhanced stats
  async getActiveUsersCount(since: Date): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(users)
      .where(gte(users.lastActiveAt, since));
    return result.count;
  }

  async searchUsers(query: string): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(or(
        like(users.email, `%${query}%`),
        like(users.username, `%${query}%`)
      ))
      .orderBy(desc(users.createdAt))
      .limit(50);
  }

  // Incident/Helpdesk methods
  async createIncident(userId: number, data: InsertIncident): Promise<Incident> {
    const [incident] = await db
      .insert(incidents)
      .values({ ...data, userId })
      .returning();
    return incident;
  }

  async getIncidentsByUser(userId: number): Promise<Incident[]> {
    return await db
      .select()
      .from(incidents)
      .where(eq(incidents.userId, userId))
      .orderBy(desc(incidents.createdAt));
  }

  async getAllIncidents(status?: string): Promise<Incident[]> {
    if (status) {
      return await db
        .select()
        .from(incidents)
        .where(eq(incidents.status, status))
        .orderBy(desc(incidents.createdAt));
    }
    return await db.select().from(incidents).orderBy(desc(incidents.createdAt));
  }

  async getIncident(id: number): Promise<Incident | undefined> {
    const [incident] = await db.select().from(incidents).where(eq(incidents.id, id));
    return incident || undefined;
  }

  async updateIncidentStatus(id: number, status: string, resolution?: string, assigneeId?: number): Promise<Incident> {
    const updates: any = { status, updatedAt: new Date() };
    if (resolution) updates.resolution = resolution;
    if (assigneeId) updates.assigneeId = assigneeId;
    if (status === 'closed' || status === 'resolved') updates.closedAt = new Date();

    const [incident] = await db
      .update(incidents)
      .set(updates)
      .where(eq(incidents.id, id))
      .returning();
    return incident;
  }

  async addIncidentMessage(incidentId: number, authorId: number, authorRole: string, message: string): Promise<IncidentMessage> {
    const [msg] = await db
      .insert(incidentMessages)
      .values({ incidentId, authorId, authorRole, message })
      .returning();
    await db.update(incidents).set({ updatedAt: new Date() }).where(eq(incidents.id, incidentId));
    return msg;
  }

  async getIncidentMessages(incidentId: number): Promise<IncidentMessage[]> {
    return await db
      .select()
      .from(incidentMessages)
      .where(eq(incidentMessages.incidentId, incidentId))
      .orderBy(incidentMessages.createdAt);
  }

  async getIncidentStats(): Promise<{ open: number; inProgress: number; resolved: number; total: number }> {
    const [open] = await db.select({ count: count() }).from(incidents).where(eq(incidents.status, 'open'));
    const [inProgress] = await db.select({ count: count() }).from(incidents).where(eq(incidents.status, 'in_progress'));
    const [resolved] = await db.select({ count: count() }).from(incidents).where(or(eq(incidents.status, 'resolved'), eq(incidents.status, 'closed')));
    const [total] = await db.select({ count: count() }).from(incidents);
    return { open: open.count, inProgress: inProgress.count, resolved: resolved.count, total: total.count };
  }
}

export const storage = new DatabaseStorage();

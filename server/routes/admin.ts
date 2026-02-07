import { Router } from "express";
import { storage } from "../storage";
import { getMetrics, getContentType } from "../services/metrics";
import { db } from "../db";
import { sql } from "drizzle-orm";
import { sendBroadcastNotification, sendPushNotification } from "../services/push-notifications";
import { getAllQueueMetrics } from "../services/message-queue";
import { getApiDocumentation, generatePostmanCollection, generateTechnicalDocumentation } from "../services/api-documentation";

const router = Router();

const PRIMARY_ADMIN_EMAIL = "agrawalmayank200228@gmail.com";

function isAdmin(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  
  const user = req.user as any;
  if (!user.isAdmin && user.email !== PRIMARY_ADMIN_EMAIL) {
    return res.status(403).json({ error: "Forbidden: Admin access required" });
  }
  
  next();
}

router.get("/stats", isAdmin, async (req, res) => {
  try {
    const stats = await storage.getPlatformStats();
    
    await storage.createAdminActivityLog({
      adminId: (req.user as any).id,
      action: "view_stats",
      details: { timestamp: new Date().toISOString() },
    });

    res.json(stats);
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

router.get("/users", isAdmin, async (req, res) => {
  try {
    const users = await storage.getAllUsers();
    
    await storage.createAdminActivityLog({
      adminId: (req.user as any).id,
      action: "view_users",
      details: { count: users.length },
    });

    const sanitizedUsers = users.map(u => ({
      ...u,
      password: undefined,
    }));

    res.json(sanitizedUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

router.get("/admins", isAdmin, async (req, res) => {
  try {
    const admins = await storage.getAdminUsers();
    res.json(admins.map(a => ({
      ...a,
      password: undefined,
    })));
  } catch (error) {
    console.error("Error fetching admins:", error);
    res.status(500).json({ error: "Failed to fetch admins" });
  }
});

router.post("/grant-admin", isAdmin, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const user = await storage.getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const adminUser = req.user as any;
    const updatedUser = await storage.grantAdminAccess(user.id, adminUser.email);

    await storage.createAdminActivityLog({
      adminId: adminUser.id,
      action: "grant_admin",
      targetUserId: user.id,
      details: { targetEmail: email },
    });

    await storage.createSecurityLog({
      userId: user.id,
      action: "admin_action",
      details: { 
        action: "admin_access_granted",
        grantedBy: adminUser.email,
      },
      severity: "warning",
    });

    res.json({ 
      message: "Admin access granted successfully",
      user: { ...updatedUser, password: undefined },
    });
  } catch (error) {
    console.error("Error granting admin access:", error);
    res.status(500).json({ error: "Failed to grant admin access" });
  }
});

router.post("/revoke-admin", isAdmin, async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const targetUser = await storage.getUser(userId);
    if (!targetUser) {
      return res.status(404).json({ error: "User not found" });
    }

    if (targetUser.email === PRIMARY_ADMIN_EMAIL) {
      return res.status(403).json({ error: "Cannot revoke primary admin access" });
    }

    const adminUser = req.user as any;
    const updatedUser = await storage.revokeAdminAccess(userId);

    await storage.createAdminActivityLog({
      adminId: adminUser.id,
      action: "revoke_admin",
      targetUserId: userId,
      details: { targetEmail: targetUser.email },
    });

    await storage.createSecurityLog({
      userId: userId,
      action: "admin_action",
      details: { 
        action: "admin_access_revoked",
        revokedBy: adminUser.email,
      },
      severity: "warning",
    });

    res.json({ 
      message: "Admin access revoked successfully",
      user: { ...updatedUser, password: undefined },
    });
  } catch (error) {
    console.error("Error revoking admin access:", error);
    res.status(500).json({ error: "Failed to revoke admin access" });
  }
});

router.get("/security-logs", isAdmin, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const logs = await storage.getSecurityLogs(limit);

    await storage.createAdminActivityLog({
      adminId: (req.user as any).id,
      action: "view_security_logs",
      details: { limit },
    });

    res.json(logs);
  } catch (error) {
    console.error("Error fetching security logs:", error);
    res.status(500).json({ error: "Failed to fetch security logs" });
  }
});

router.get("/activity-logs", isAdmin, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const logs = await storage.getAdminActivityLogs(limit);
    res.json(logs);
  } catch (error) {
    console.error("Error fetching activity logs:", error);
    res.status(500).json({ error: "Failed to fetch activity logs" });
  }
});

router.get("/payments", isAdmin, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const payments = await storage.getAllPayments(limit);
    res.json(payments);
  } catch (error) {
    console.error("Error fetching payments:", error);
    res.status(500).json({ error: "Failed to fetch payments" });
  }
});

router.get("/subscriptions", isAdmin, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const subscriptions = await storage.getAllSubscriptions(limit);
    res.json(subscriptions);
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    res.status(500).json({ error: "Failed to fetch subscriptions" });
  }
});

router.get("/api-endpoints", isAdmin, async (_req, res) => {
  const docs = getApiDocumentation();
  res.json(docs.map(d => ({
    method: d.method,
    path: d.path,
    description: d.description,
    name: d.name,
    category: d.category,
    auth: d.auth,
  })));
});

router.get("/database-tables", isAdmin, async (_req, res) => {
  try {
    const tablesResult = await db.execute(sql`
      SELECT table_name, 
             (SELECT COUNT(*) FROM information_schema.columns WHERE columns.table_name = tables.table_name) as column_count
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    const tables = tablesResult.rows.map((row: any) => ({
      name: row.table_name,
      columnCount: parseInt(row.column_count),
    }));

    res.json(tables);
  } catch (error) {
    console.error("Error fetching database tables:", error);
    res.status(500).json({ error: "Failed to fetch database tables" });
  }
});

router.get("/table-schema/:tableName", isAdmin, async (req, res) => {
  try {
    const { tableName } = req.params;
    
    const columnsResult = await db.execute(sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = ${tableName}
      ORDER BY ordinal_position
    `);

    res.json(columnsResult.rows);
  } catch (error) {
    console.error("Error fetching table schema:", error);
    res.status(500).json({ error: "Failed to fetch table schema" });
  }
});

router.get("/metrics", isAdmin, async (_req, res) => {
  try {
    res.set("Content-Type", getContentType());
    res.end(await getMetrics());
  } catch (error) {
    console.error("Error fetching metrics:", error);
    res.status(500).json({ error: "Failed to fetch metrics" });
  }
});

router.get("/grafana-config", isAdmin, async (_req, res) => {
  res.json({
    prometheusEndpoint: "/api/admin/metrics",
    dashboards: [
      { name: "System Overview", id: "system-overview" },
      { name: "API Performance", id: "api-performance" },
      { name: "User Analytics", id: "user-analytics" },
      { name: "Security Events", id: "security-events" },
    ],
  });
});

router.post("/send-notification", isAdmin, async (req, res) => {
  try {
    const { title, body, url, targetType } = req.body;
    
    if (!title || !body) {
      return res.status(400).json({ error: "Title and body are required" });
    }

    const payload = {
      title,
      body,
      url: url || "/dashboard",
      tag: `admin-notification-${Date.now()}`,
    };

    if (targetType === "all" || !targetType) {
      await sendBroadcastNotification(payload);
    } else {
      const users = await storage.getAllUsers();
      const targetUsers = users.filter(u => {
        if (targetType === "premium") return u.isPremium;
        if (targetType === "free") return !u.isPremium;
        return true;
      });

      for (const user of targetUsers) {
        try {
          await sendPushNotification(user.id, payload);
        } catch (e) {
        }
      }
    }

    await storage.createAdminActivityLog({
      adminId: (req.user as any).id,
      action: "send_notification",
      details: { title, targetType: targetType || "all" },
    });

    res.json({ 
      success: true, 
      message: "Notification sent successfully",
      targetType: targetType || "all"
    });
  } catch (error) {
    console.error("Error sending notification:", error);
    res.status(500).json({ error: "Failed to send notification" });
  }
});

router.get("/queue-metrics", isAdmin, async (_req, res) => {
  try {
    const metrics = getAllQueueMetrics();
    res.json(metrics);
  } catch (error) {
    console.error("Error fetching queue metrics:", error);
    res.status(500).json({ error: "Failed to fetch queue metrics" });
  }
});

router.get("/api-docs", isAdmin, async (_req, res) => {
  try {
    const docs = getApiDocumentation();
    res.json(docs);
  } catch (error) {
    console.error("Error fetching API docs:", error);
    res.status(500).json({ error: "Failed to fetch API documentation" });
  }
});

router.get("/postman-collection", isAdmin, async (_req, res) => {
  try {
    const collection = generatePostmanCollection();
    
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", "attachment; filename=prometix-api-collection.json");
    res.json(collection);
  } catch (error) {
    console.error("Error generating Postman collection:", error);
    res.status(500).json({ error: "Failed to generate Postman collection" });
  }
});

router.get("/download-docs", isAdmin, async (_req, res) => {
  try {
    const documentation = generateTechnicalDocumentation();
    
    res.setHeader("Content-Type", "text/markdown");
    res.setHeader("Content-Disposition", "attachment; filename=Prometix-Technical-Documentation.md");
    res.send(documentation);
  } catch (error) {
    console.error("Error generating documentation:", error);
    res.status(500).json({ error: "Failed to generate documentation" });
  }
});

router.get("/notification-templates", isAdmin, async (_req, res) => {
  const templates = [
    {
      id: "upgrade-premium",
      name: "Upgrade to Premium",
      title: "Unlock Premium Features!",
      body: "Get unlimited AI features, priority support, and more. Upgrade now and save 20%!",
      url: "/checkout"
    },
    {
      id: "new-feature",
      name: "New Feature Announcement",
      title: "New Feature Released!",
      body: "Check out our latest AI-powered tool for DevOps automation.",
      url: "/dashboard"
    },
    {
      id: "maintenance",
      name: "Scheduled Maintenance",
      title: "Scheduled Maintenance",
      body: "Platform maintenance scheduled. Services may be briefly unavailable.",
      url: "/"
    },
    {
      id: "welcome-back",
      name: "Welcome Back",
      title: "We Miss You!",
      body: "It's been a while! Come back and explore our new features.",
      url: "/dashboard"
    },
    {
      id: "credits-low",
      name: "Low Credits Warning",
      title: "Credits Running Low",
      body: "Your credits are running low. Top up now to continue using premium features.",
      url: "/checkout"
    },
    {
      id: "security-update",
      name: "Security Update",
      title: "Important Security Update",
      body: "We've made security improvements to protect your account.",
      url: "/dashboard"
    }
  ];
  res.json(templates);
});

// Domain configuration routes
router.get("/domain-configs", isAdmin, async (_req, res) => {
  try {
    const configs = await storage.getDomainConfigs();
    res.json(configs);
  } catch (error) {
    console.error("Error fetching domain configs:", error);
    res.status(500).json({ error: "Failed to fetch domain configs" });
  }
});

router.put("/domain-configs/:domain", isAdmin, async (req, res) => {
  try {
    const { domain } = req.params;
    const { isEnabled, comingSoonMessage } = req.body;
    
    const updated = await storage.updateDomainConfig(
      domain,
      isEnabled ?? false,
      comingSoonMessage || null,
      (req.user as any).id
    );

    await storage.createAdminActivityLog({
      adminId: (req.user as any).id,
      action: "update_domain_config",
      details: { domain, isEnabled, message: comingSoonMessage },
    });

    res.json(updated);
  } catch (error) {
    console.error("Error updating domain config:", error);
    res.status(500).json({ error: "Failed to update domain config" });
  }
});

// User ban routes
router.post("/ban-user", isAdmin, async (req, res) => {
  try {
    const { userId, reason } = req.body;
    if (!userId || !reason) {
      return res.status(400).json({ error: "User ID and reason are required" });
    }

    const targetUser = await storage.getUser(userId);
    if (!targetUser) {
      return res.status(404).json({ error: "User not found" });
    }

    if (targetUser.email === PRIMARY_ADMIN_EMAIL) {
      return res.status(403).json({ error: "Cannot ban primary admin" });
    }

    const bannedUser = await storage.banUser(userId, reason);

    await storage.createAdminActivityLog({
      adminId: (req.user as any).id,
      action: "ban_user",
      targetUserId: userId,
      details: { reason },
    });

    await storage.createSecurityLog({
      userId: userId,
      action: "admin_action",
      details: { action: "user_banned", reason, bannedBy: (req.user as any).email },
      severity: "critical",
    });

    res.json({ message: "User banned successfully", user: { ...bannedUser, password: undefined } });
  } catch (error) {
    console.error("Error banning user:", error);
    res.status(500).json({ error: "Failed to ban user" });
  }
});

router.post("/unban-user", isAdmin, async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const unbannedUser = await storage.unbanUser(userId);

    await storage.createAdminActivityLog({
      adminId: (req.user as any).id,
      action: "unban_user",
      targetUserId: userId,
      details: {},
    });

    res.json({ message: "User unbanned successfully", user: { ...unbannedUser, password: undefined } });
  } catch (error) {
    console.error("Error unbanning user:", error);
    res.status(500).json({ error: "Failed to unban user" });
  }
});

// Credit management by email
router.post("/update-credits", isAdmin, async (req, res) => {
  try {
    const { email, credits } = req.body;
    if (!email || credits === undefined) {
      return res.status(400).json({ error: "Email and credits are required" });
    }

    const targetUser = await storage.getUserByEmail(email);
    if (!targetUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const updatedUser = await storage.updateUserCredits(targetUser.id, credits);

    await storage.createAdminActivityLog({
      adminId: (req.user as any).id,
      action: "update_credits",
      targetUserId: targetUser.id,
      details: { email, previousCredits: targetUser.credits, newCredits: credits },
    });

    res.json({ 
      message: "Credits updated successfully", 
      user: { ...updatedUser, password: undefined } 
    });
  } catch (error) {
    console.error("Error updating credits:", error);
    res.status(500).json({ error: "Failed to update credits" });
  }
});

// User search
router.get("/search-users", isAdmin, async (req, res) => {
  try {
    const query = req.query.q as string;
    if (!query) {
      return res.status(400).json({ error: "Search query is required" });
    }

    const users = await storage.searchUsers(query);
    res.json(users.map(u => ({ ...u, password: undefined })));
  } catch (error) {
    console.error("Error searching users:", error);
    res.status(500).json({ error: "Failed to search users" });
  }
});

// Enhanced stats with active users
router.get("/enhanced-stats", isAdmin, async (req, res) => {
  try {
    const stats = await storage.getPlatformStats();
    
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const activeUsers24h = await storage.getActiveUsersCount(last24h);
    const activeUsers7d = await storage.getActiveUsersCount(last7d);
    const activeUsers30d = await storage.getActiveUsersCount(last30d);

    res.json({
      ...stats,
      activeUsers: {
        last24Hours: activeUsers24h,
        last7Days: activeUsers7d,
        last30Days: activeUsers30d,
      },
    });
  } catch (error) {
    console.error("Error fetching enhanced stats:", error);
    res.status(500).json({ error: "Failed to fetch enhanced stats" });
  }
});

// Incident management routes
router.get("/incidents", isAdmin, async (req, res) => {
  try {
    const status = req.query.status as string;
    const incidents = await storage.getAllIncidents(status);
    res.json(incidents);
  } catch (error) {
    console.error("Error fetching incidents:", error);
    res.status(500).json({ error: "Failed to fetch incidents" });
  }
});

router.get("/incidents/stats", isAdmin, async (_req, res) => {
  try {
    const stats = await storage.getIncidentStats();
    res.json(stats);
  } catch (error) {
    console.error("Error fetching incident stats:", error);
    res.status(500).json({ error: "Failed to fetch incident stats" });
  }
});

router.get("/incidents/:id", isAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const incident = await storage.getIncident(id);
    if (!incident) {
      return res.status(404).json({ error: "Incident not found" });
    }
    const messages = await storage.getIncidentMessages(id);
    const user = await storage.getUser(incident.userId);
    res.json({ incident, messages, user: user ? { ...user, password: undefined } : null });
  } catch (error) {
    console.error("Error fetching incident:", error);
    res.status(500).json({ error: "Failed to fetch incident" });
  }
});

router.put("/incidents/:id/status", isAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status, resolution } = req.body;
    
    const incident = await storage.updateIncidentStatus(id, status, resolution, (req.user as any).id);

    await storage.createAdminActivityLog({
      adminId: (req.user as any).id,
      action: "update_incident",
      details: { incidentId: id, status, resolution },
    });

    res.json(incident);
  } catch (error) {
    console.error("Error updating incident:", error);
    res.status(500).json({ error: "Failed to update incident" });
  }
});

router.post("/incidents/:id/message", isAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const msg = await storage.addIncidentMessage(id, (req.user as any).id, "admin", message);
    res.json(msg);
  } catch (error) {
    console.error("Error adding incident message:", error);
    res.status(500).json({ error: "Failed to add message" });
  }
});

export default router;

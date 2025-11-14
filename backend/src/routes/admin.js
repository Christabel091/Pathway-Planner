// routes/admin.js
import express from "express";
export default function createAdminRouter(prisma, emitToUser) {
  const router = express.Router();
  router.post("/announcements", async (req, res) => {
    try {
      const { title, message } = req.body || {};
      if (!title || !message) {
        return res
          .status(400)
          .json({ error: "Both title and message are required." });
      }

      const users = await prisma.user.findMany({
        select: { id: true },
      });

      if (!users.length) {
        return res.status(200).json({
          created: 0,
          message: "No users found to send announcement.",
        });
      }

      const createdNotifications = [];

      // Create notifications and emit via WebSocket
      for (const u of users) {
        const notif = await prisma.notification.create({
          data: {
            user_id: u.id,
            type: "MESSAGE", // reuse MESSAGE type; handle as announcement on frontend
            entity: "announcement",
            entity_id: null,
            payload: {
              title,
              message,
            },
          },
        });

        createdNotifications.push(notif.id);

        // Push real-time event to each user
        emitToUser(u.id, {
          type: "ANNOUNCEMENT",
          payload: {
            notificationId: notif.id,
            title,
            message,
            created_at: notif.created_at,
          },
        });
      }

      return res.status(201).json({
        created: createdNotifications.length,
      });
    } catch (e) {
      console.error("POST /admin/announcements error", e);
      return res.status(500).json({ error: "Failed to send announcement." });
    }
  });

  // Get all users (basic info for Manage Users panel)
  router.get("/users", async (_req, res) => {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          UserName: true,
          role: true,
          created_at: true,
        },
        orderBy: { id: "asc" },
      });
      return res.json({ users });
    } catch (e) {
      console.error("GET /admin/users error", e);
      return res.status(500).json({ error: "Failed to fetch users." });
    }
  });

  // Delete a user by id
  router.delete("/users/:id", async (req, res) => {
    const id = Number(req.params.id);
    if (!id || Number.isNaN(id)) {
      return res.status(400).json({ error: "Invalid user id." });
    }

    try {
      await prisma.user.delete({
        where: { id },
      });
      return res.status(204).send();
    } catch (e) {
      console.error("DELETE /admin/users/:id error", e);
      if (e.code === "P2003") {
        return res.status(409).json({
          error:
            "Cannot delete user due to related records. Check foreign key constraints.",
        });
      }
      return res.status(500).json({ error: "Failed to delete user." });
    }
  });

  return router;
}

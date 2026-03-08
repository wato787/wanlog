/**
 * 招待API（トークン確認・参加）
 */
import { drizzle } from "drizzle-orm/d1";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { invitations, groups, groupMembers } from "../db/schema";
import { requireAuth } from "../middleware/auth";

type InvitationsEnv = {
  Bindings: { DB: D1Database };
  Variables: { userId: string };
};

export function createInvitationsApp() {
  const app = new Hono<InvitationsEnv>();

  // GET /invitations/:token — トークン確認（認証不要）
  app.get("/:token", async (c) => {
    const token = c.req.param("token");
    const db = drizzle(c.env.DB);

    const [inv] = await db
      .select({
        id: invitations.id,
        groupId: invitations.groupId,
        expiresAt: invitations.expiresAt,
        usedAt: invitations.usedAt,
        groupName: groups.name,
      })
      .from(invitations)
      .innerJoin(groups, eq(invitations.groupId, groups.id))
      .where(eq(invitations.token, token))
      .limit(1);

    if (!inv) {
      return c.json({ valid: false, reason: "not_found" });
    }

    const now = Math.floor(Date.now() / 1000);
    if (inv.usedAt != null) {
      return c.json({ valid: false, reason: "used", groupName: inv.groupName });
    }
    if (inv.expiresAt < now) {
      return c.json({
        valid: false,
        reason: "expired",
        groupName: inv.groupName,
      });
    }

    return c.json({
      valid: true,
      groupId: inv.groupId,
      groupName: inv.groupName,
      expiresAt: inv.expiresAt,
    });
  });

  // POST /invitations/:token/join — グループ参加（認証必須）
  app.post("/:token/join", requireAuth, async (c) => {
    const token = c.req.param("token");
    const userId = c.get("userId");
    const db = drizzle(c.env.DB);

    const [inv] = await db
      .select()
      .from(invitations)
      .where(eq(invitations.token, token))
      .limit(1);

    if (!inv) {
      return c.json({ error: "Invitation not found" }, 404);
    }

    const now = Math.floor(Date.now() / 1000);
    if (inv.usedAt != null) {
      return c.json({ error: "Invitation already used" }, 400);
    }
    if (inv.expiresAt < now) {
      return c.json({ error: "Invitation expired" }, 400);
    }

    const [existing] = await db
      .select()
      .from(groupMembers)
      .where(
        and(
          eq(groupMembers.groupId, inv.groupId),
          eq(groupMembers.userId, userId),
        ),
      )
      .limit(1);

    if (existing) {
      return c.json({ error: "Already a member" }, 400);
    }

    await db.insert(groupMembers).values({
      groupId: inv.groupId,
      userId,
      role: "member",
      joinedAt: now,
    });
    await db
      .update(invitations)
      .set({ usedAt: now })
      .where(eq(invitations.id, inv.id));

    return c.json({ ok: true, groupId: inv.groupId }, 201);
  });

  return app;
}

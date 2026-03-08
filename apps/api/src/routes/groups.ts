/**
 * グループAPI
 */
import { drizzle } from "drizzle-orm/d1";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { uuidv7 } from "uuidv7";
import { groups, groupMembers, users, invitations } from "../db/schema";
import { requireAuth } from "../middleware/auth";
import { createPostsApp } from "./posts";

const INVITATION_EXPIRES_DAYS = 7;

function generateInvitationToken(): string {
  return crypto.randomUUID().replace(/-/g, "");
}

const createGroupSchema = z.object({ name: z.string().min(1).max(100) });
const updateGroupSchema = z.object({ name: z.string().min(1).max(100) });

type GroupsEnv = {
  Bindings: { DB: D1Database };
  Variables: { userId: string };
};

export function createGroupsApp() {
  const app = new Hono<GroupsEnv>();

  app.use("/*", requireAuth);

  // POST /groups — グループ作成（作成者が owner）
  app.post("/", zValidator("json", createGroupSchema), async (c) => {
    const { name } = c.req.valid("json");
    const userId = c.get("userId");
    const db = drizzle(c.env.DB);
    const now = Math.floor(Date.now() / 1000);
    const id = uuidv7();

    await db.insert(groups).values({ id, name, createdAt: now });
    await db.insert(groupMembers).values({
      groupId: id,
      userId,
      role: "owner",
      joinedAt: now,
    });

    return c.json({ id, name, createdAt: now }, 201);
  });

  // GET /groups/:groupId — グループ情報取得（メンバーのみ）
  app.get("/:groupId", async (c) => {
    const groupId = c.req.param("groupId");
    const userId = c.get("userId");
    const db = drizzle(c.env.DB);

    const [member] = await db
      .select()
      .from(groupMembers)
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)))
      .limit(1);

    if (!member) {
      return c.json({ error: "Forbidden" }, 403);
    }

    const [group] = await db.select().from(groups).where(eq(groups.id, groupId)).limit(1);

    if (!group) {
      return c.json({ error: "Not found" }, 404);
    }

    return c.json({
      id: group.id,
      name: group.name,
      createdAt: group.createdAt,
    });
  });

  // PATCH /groups/:groupId — グループ名変更（owner のみ）
  app.patch("/:groupId", zValidator("json", updateGroupSchema), async (c) => {
    const groupId = c.req.param("groupId");
    const userId = c.get("userId");
    const { name } = c.req.valid("json");
    const db = drizzle(c.env.DB);

    const [member] = await db
      .select()
      .from(groupMembers)
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)))
      .limit(1);

    if (!member || member.role !== "owner") {
      return c.json({ error: "Forbidden" }, 403);
    }

    const [group] = await db.select().from(groups).where(eq(groups.id, groupId)).limit(1);

    if (!group) {
      return c.json({ error: "Not found" }, 404);
    }

    await db.update(groups).set({ name }).where(eq(groups.id, groupId));

    return c.json({ id: group.id, name, createdAt: group.createdAt });
  });

  // GET /groups/:groupId/members — メンバー一覧（メンバーのみ）
  app.get("/:groupId/members", async (c) => {
    const groupId = c.req.param("groupId");
    const userId = c.get("userId");
    const db = drizzle(c.env.DB);

    const [myMember] = await db
      .select()
      .from(groupMembers)
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)))
      .limit(1);

    if (!myMember) {
      return c.json({ error: "Forbidden" }, 403);
    }

    const members = await db
      .select({
        userId: groupMembers.userId,
        role: groupMembers.role,
        joinedAt: groupMembers.joinedAt,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
      })
      .from(groupMembers)
      .innerJoin(users, eq(groupMembers.userId, users.id))
      .where(eq(groupMembers.groupId, groupId));

    return c.json({ members });
  });

  // DELETE /groups/:groupId/members/:userId — メンバー削除（owner のみ、自分は削除不可）
  app.delete("/:groupId/members/:targetUserId", async (c) => {
    const groupId = c.req.param("groupId");
    const targetUserId = c.req.param("targetUserId");
    const userId = c.get("userId");
    const db = drizzle(c.env.DB);

    if (targetUserId === userId) {
      return c.json({ error: "Cannot remove yourself" }, 400);
    }

    const [ownerMember] = await db
      .select()
      .from(groupMembers)
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)))
      .limit(1);

    if (!ownerMember || ownerMember.role !== "owner") {
      return c.json({ error: "Forbidden" }, 403);
    }

    const [target] = await db
      .select()
      .from(groupMembers)
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, targetUserId)))
      .limit(1);

    if (!target) {
      return c.json({ error: "Not found" }, 404);
    }

    await db
      .delete(groupMembers)
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, targetUserId)));

    return c.json({ ok: true });
  });

  // POST /groups/:groupId/invitations — 招待トークン発行（owner のみ）
  app.post("/:groupId/invitations", async (c) => {
    const groupId = c.req.param("groupId");
    const userId = c.get("userId");
    const db = drizzle(c.env.DB);

    const [member] = await db
      .select()
      .from(groupMembers)
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)))
      .limit(1);

    if (!member || member.role !== "owner") {
      return c.json({ error: "Forbidden" }, 403);
    }

    const [group] = await db.select().from(groups).where(eq(groups.id, groupId)).limit(1);

    if (!group) {
      return c.json({ error: "Not found" }, 404);
    }

    const now = Math.floor(Date.now() / 1000);
    const id = uuidv7();
    const token = generateInvitationToken();
    const expiresAt = now + INVITATION_EXPIRES_DAYS * 24 * 60 * 60;

    await db.insert(invitations).values({
      id,
      groupId,
      token,
      expiresAt,
      createdAt: now,
    });

    return c.json({ id, token, groupId, expiresAt }, 201);
  });

  app.route("/:groupId/posts", createPostsApp());

  return app;
}

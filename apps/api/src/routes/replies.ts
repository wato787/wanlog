/**
 * リプライAPI（投稿単位）
 */
import { drizzle } from "drizzle-orm/d1";
import { and, asc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { uuidv7 } from "uuidv7";
import { replies, posts, groupMembers, users } from "../db/schema";
import { requireAuth } from "../middleware/auth";

const createReplySchema = z.object({
  body: z.string().min(1).max(2000),
});

type RepliesEnv = {
  Bindings: { DB: D1Database };
  Variables: { userId: string };
};

async function checkPostAccess(
  db: ReturnType<typeof drizzle>,
  postId: string,
  userId: string,
): Promise<{ post: { groupId: string } } | null> {
  const [post] = await db
    .select()
    .from(posts)
    .where(eq(posts.id, postId))
    .limit(1);
  if (!post) return null;

  const [member] = await db
    .select()
    .from(groupMembers)
    .where(
      and(
        eq(groupMembers.groupId, post.groupId),
        eq(groupMembers.userId, userId),
      ),
    )
    .limit(1);
  if (!member) return null;

  return { post };
}

export function createRepliesApp() {
  const app = new Hono<RepliesEnv>();

  app.use("/*", requireAuth);

  // GET / — リプライ一覧
  app.get("/", async (c) => {
    const postId = c.req.param("postId");
    const userId = c.get("userId");
    const db = drizzle(c.env.DB);

    const access = await checkPostAccess(db, postId, userId);
    if (!access) {
      return c.json({ error: "Not found" }, 404);
    }

    const rows = await db
      .select({
        id: replies.id,
        postId: replies.postId,
        userId: replies.userId,
        body: replies.body,
        createdAt: replies.createdAt,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
      })
      .from(replies)
      .innerJoin(users, eq(replies.userId, users.id))
      .where(eq(replies.postId, postId))
      .orderBy(asc(replies.createdAt));

    return c.json({
      replies: rows.map((r) => ({
        id: r.id,
        postId: r.postId,
        userId: r.userId,
        body: r.body,
        createdAt: r.createdAt,
        author: { displayName: r.displayName, avatarUrl: r.avatarUrl },
      })),
    });
  });

  // POST / — リプライ投稿
  app.post("/", zValidator("json", createReplySchema), async (c) => {
    const postId = c.req.param("postId");
    const userId = c.get("userId");
    const { body } = c.req.valid("json");
    const db = drizzle(c.env.DB);

    const access = await checkPostAccess(db, postId, userId);
    if (!access) {
      return c.json({ error: "Not found" }, 404);
    }

    const now = Math.floor(Date.now() / 1000);
    const id = uuidv7();

    await db.insert(replies).values({
      id,
      postId,
      userId,
      body,
      createdAt: now,
    });

    const [user] = await db
      .select({ displayName: users.displayName, avatarUrl: users.avatarUrl })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return c.json(
      {
        id,
        postId,
        userId,
        body,
        createdAt: now,
        author: {
          displayName: user?.displayName ?? "",
          avatarUrl: user?.avatarUrl ?? null,
        },
      },
      201,
    );
  });

  // DELETE /:replyId — リプライ削除（自分のみ）
  app.delete("/:replyId", async (c) => {
    const postId = c.req.param("postId");
    const replyId = c.req.param("replyId");
    const userId = c.get("userId");
    const db = drizzle(c.env.DB);

    const access = await checkPostAccess(db, postId, userId);
    if (!access) {
      return c.json({ error: "Not found" }, 404);
    }

    const [reply] = await db
      .select()
      .from(replies)
      .where(and(eq(replies.id, replyId), eq(replies.postId, postId)))
      .limit(1);

    if (!reply) {
      return c.json({ error: "Not found" }, 404);
    }

    if (reply.userId !== userId) {
      return c.json({ error: "Forbidden" }, 403);
    }

    await db.delete(replies).where(eq(replies.id, replyId));

    return c.json({ ok: true });
  });

  return app;
}

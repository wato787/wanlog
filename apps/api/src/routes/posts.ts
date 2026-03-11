/**
 * 投稿API（グループ内）
 */
import { drizzle } from "drizzle-orm/d1";
import { and, desc, eq, inArray, lt, sql } from "drizzle-orm";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { uuidv7 } from "uuidv7";
import { posts, postMedia, groupMembers, users, replies } from "../db/schema";
import { requireAuth } from "../middleware/auth";
import { createRepliesApp } from "./replies";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

const createPostSchema = z.object({
  caption: z.string().max(2000).optional(),
  takenAt: z.number().int().positive().optional(),
  media: z
    .array(
      z.object({
        key: z.string().min(1).max(500),
        mediaType: z.enum(["photo", "video"]),
      })
    )
    .min(0)
    .max(10),
});

const listPostsSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(MAX_LIMIT).optional(),
});

type PostsEnv = {
  Bindings: { DB: D1Database };
  Variables: { userId: string };
};

export function createPostsApp() {
  return new Hono<PostsEnv>()
    .use("/*", requireAuth)
    .post("/", zValidator("json", createPostSchema), async (c) => {
    const groupId = c.req.param("groupId");
    if (!groupId) return c.json({ error: "Bad request" }, 400);
    const userId = c.get("userId");
    const { caption, takenAt, media } = c.req.valid("json");
    const hasText = caption != null && caption.trim().length > 0;
    const hasMedia = media != null && media.length > 0;
    if (!hasText && !hasMedia) {
      return c.json({ error: "本文かメディアのいずれかが必要です" }, 400);
    }
    const db = drizzle(c.env.DB);

    const [member] = await db
      .select()
      .from(groupMembers)
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)))
      .limit(1);

    if (!member) {
      return c.json({ error: "Forbidden" }, 403);
    }

    const now = Math.floor(Date.now() / 1000);
    const postId = uuidv7();

    await db.insert(posts).values({
      id: postId,
      groupId,
      userId,
      caption: caption ?? null,
      takenAt: takenAt ?? null,
      createdAt: now,
    });

    for (let i = 0; i < (media ?? []).length; i++) {
      const m = media![i];
      await db.insert(postMedia).values({
        id: uuidv7(),
        postId,
        mediaUrl: m.key,
        mediaType: m.mediaType,
        order: i,
        createdAt: now,
      });
    }

    const [created] = await db.select().from(posts).where(eq(posts.id, postId)).limit(1);

    const mediaRows = await db
      .select()
      .from(postMedia)
      .where(eq(postMedia.postId, postId))
      .orderBy(postMedia.order);

    return c.json(
      {
        id: created!.id,
        groupId: created!.groupId,
        userId: created!.userId,
        caption: created!.caption,
        takenAt: created!.takenAt,
        createdAt: created!.createdAt,
        media: mediaRows.map((m) => ({
          id: m.id,
          mediaUrl: m.mediaUrl,
          mediaType: m.mediaType,
          order: m.order,
        })),
      },
      201
    );
  })
  .get("/", zValidator("query", listPostsSchema), async (c) => {
    const groupId = c.req.param("groupId");
    if (!groupId) return c.json({ error: "Bad request" }, 400);
    const userId = c.get("userId");
    const { cursor, limit = DEFAULT_LIMIT } = c.req.valid("query");
    const db = drizzle(c.env.DB);

    const [member] = await db
      .select()
      .from(groupMembers)
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)))
      .limit(1);

    if (!member) {
      return c.json({ error: "Forbidden" }, 403);
    }

    const conditions = [eq(posts.groupId, groupId)];
    if (cursor) {
      const [cursorPost] = await db
        .select({ createdAt: posts.createdAt })
        .from(posts)
        .where(and(eq(posts.id, cursor), eq(posts.groupId, groupId)))
        .limit(1);
      if (cursorPost) {
        conditions.push(lt(posts.createdAt, cursorPost.createdAt));
      }
    }

    const rows = await db
      .select({
        id: posts.id,
        groupId: posts.groupId,
        userId: posts.userId,
        caption: posts.caption,
        takenAt: posts.takenAt,
        createdAt: posts.createdAt,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
      })
      .from(posts)
      .innerJoin(users, eq(posts.userId, users.id))
      .where(and(...conditions))
      .orderBy(desc(posts.createdAt))
      .limit(limit + 1);

    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor = hasMore ? items[items.length - 1]?.id : null;

    const postIds = items.map((r) => r.id);
    const mediaRows =
      postIds.length > 0
        ? await db
            .select()
            .from(postMedia)
            .where(inArray(postMedia.postId, postIds))
            .orderBy(postMedia.postId, postMedia.order)
        : [];

    const replyCounts =
      postIds.length > 0
        ? await db
            .select({
              postId: replies.postId,
              count: sql<number>`count(*)`.as("count"),
            })
            .from(replies)
            .where(inArray(replies.postId, postIds))
            .groupBy(replies.postId)
        : [];

    const countByPostId = new Map(replyCounts.map((r) => [r.postId, Number(r.count)]));
    const mediaByPostId = new Map<string, typeof mediaRows>();
    for (const m of mediaRows) {
      const list = mediaByPostId.get(m.postId) ?? [];
      list.push(m);
      mediaByPostId.set(m.postId, list);
    }

    const postsWithMedia = items.map((p) => ({
      id: p.id,
      groupId: p.groupId,
      userId: p.userId,
      caption: p.caption,
      takenAt: p.takenAt,
      createdAt: p.createdAt,
      author: { displayName: p.displayName, avatarUrl: p.avatarUrl },
      media: (mediaByPostId.get(p.id) ?? []).map((m) => ({
        id: m.id,
        mediaUrl: m.mediaUrl,
        mediaType: m.mediaType,
        order: m.order,
      })),
      replyCount: countByPostId.get(p.id) ?? 0,
    }));

    return c.json({
      items: postsWithMedia,
      nextCursor: hasMore ? nextCursor : undefined,
    });
  })
  .get("/:postId", async (c) => {
    const groupId = c.req.param("groupId");
    const postId = c.req.param("postId");
    if (!groupId || !postId) return c.json({ error: "Bad request" }, 400);
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

    const [post] = await db
      .select({
        id: posts.id,
        groupId: posts.groupId,
        userId: posts.userId,
        caption: posts.caption,
        takenAt: posts.takenAt,
        createdAt: posts.createdAt,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
      })
      .from(posts)
      .innerJoin(users, eq(posts.userId, users.id))
      .where(and(eq(posts.id, postId), eq(posts.groupId, groupId)))
      .limit(1);

    if (!post) {
      return c.json({ error: "Not found" }, 404);
    }

    const mediaRows = await db
      .select()
      .from(postMedia)
      .where(eq(postMedia.postId, postId))
      .orderBy(postMedia.order);

    const [replyCount] = await db
      .select({ count: sql<number>`count(*)`.as("count") })
      .from(replies)
      .where(eq(replies.postId, postId));

    return c.json({
      id: post.id,
      groupId: post.groupId,
      userId: post.userId,
      caption: post.caption,
      takenAt: post.takenAt,
      createdAt: post.createdAt,
      author: { displayName: post.displayName, avatarUrl: post.avatarUrl },
      media: mediaRows.map((m) => ({
        id: m.id,
        mediaUrl: m.mediaUrl,
        mediaType: m.mediaType,
        order: m.order,
      })),
      replyCount: Number(replyCount?.count ?? 0),
    });
  })
  .delete("/:postId", async (c) => {
    const groupId = c.req.param("groupId");
    const postId = c.req.param("postId");
    if (!groupId || !postId) return c.json({ error: "Bad request" }, 400);
    const userId = c.get("userId");
    const db = drizzle(c.env.DB);

    const [post] = await db
      .select()
      .from(posts)
      .where(and(eq(posts.id, postId), eq(posts.groupId, groupId)))
      .limit(1);

    if (!post) {
      return c.json({ error: "Not found" }, 404);
    }

    if (post.userId !== userId) {
      return c.json({ error: "Forbidden" }, 403);
    }

    await db.delete(postMedia).where(eq(postMedia.postId, postId));
    await db.delete(replies).where(eq(replies.postId, postId));
    await db.delete(posts).where(eq(posts.id, postId));

    return c.json({ ok: true });
  })
  .route("/:postId/replies", createRepliesApp());
}

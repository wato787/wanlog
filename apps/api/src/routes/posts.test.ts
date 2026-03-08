import { describe, expect, it, beforeEach } from "vitest";
import { drizzle } from "drizzle-orm/d1";
import app from "../index";
import { users } from "../db/schema";
import { createTestD1 } from "../test-helpers/d1-mock";
import {
  createAuthCookie,
  getTestEnv,
} from "../test-helpers/auth";

describe("投稿API", () => {
  const userId = "user-001";
  let env: ReturnType<typeof getTestEnv>;
  let cookie: string;
  let groupId: string;

  beforeEach(async () => {
    const DB = createTestD1();
    env = getTestEnv(DB);
    cookie = await createAuthCookie(userId);
    const now = Math.floor(Date.now() / 1000);
    await drizzle(DB).insert(users).values({
      id: userId,
      lineId: "line-1",
      displayName: "Test User",
      createdAt: now,
    });

    const createRes = await app.request("/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ name: "My Group" }),
    }, env);
    expect(createRes.status).toBe(201);
    const data = (await createRes.json()) as { id: string };
    groupId = data.id;
  });

  describe("POST /groups/:groupId/posts", () => {
    it("認証ありで投稿作成し 201 と media を返す", async () => {
      const res = await app.request(`/groups/${groupId}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: cookie },
        body: JSON.stringify({
          caption: "Hello",
          media: [
            { key: "uploads/u1/abc.jpg", mediaType: "photo" },
            { key: "uploads/u1/def.mp4", mediaType: "video" },
          ],
        }),
      }, env);
      expect(res.status).toBe(201);
      const data = (await res.json()) as {
        id: string;
        caption: string;
        media: { mediaUrl: string; mediaType: string }[];
      };
      expect(data.caption).toBe("Hello");
      expect(data.media).toHaveLength(2);
      expect(data.media[0].mediaUrl).toBe("uploads/u1/abc.jpg");
      expect(data.media[1].mediaType).toBe("video");
    });

    it("メンバーでないグループは 403", async () => {
      const res = await app.request("/groups/other-group-id/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: cookie },
        body: JSON.stringify({
          media: [{ key: "x.jpg", mediaType: "photo" }],
        }),
      }, env);
      expect(res.status).toBe(403);
    });

    it("media が空なら 400", async () => {
      const res = await app.request(`/groups/${groupId}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: cookie },
        body: JSON.stringify({ media: [] }),
      }, env);
      expect(res.status).toBe(400);
    });
  });

  describe("GET /groups/:groupId/posts", () => {
    it("タイムラインを返す（items, author, media, replyCount）", async () => {
      await app.request(`/groups/${groupId}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: cookie },
        body: JSON.stringify({
          caption: "First",
          media: [{ key: "a.jpg", mediaType: "photo" }],
        }),
      }, env);

      const res = await app.request(`/groups/${groupId}/posts`, {
        headers: { Cookie: cookie },
      }, env);
      expect(res.status).toBe(200);
      const data = (await res.json()) as {
        items: { author: { displayName: string }; media: unknown[]; replyCount: number }[];
        nextCursor?: string;
      };
      expect(data.items).toHaveLength(1);
      expect(data.items[0].author.displayName).toBe("Test User");
      expect(data.items[0].media).toHaveLength(1);
      expect(data.items[0].replyCount).toBe(0);
    });

    it("limit 指定で nextCursor が返る", async () => {
      await app.request(`/groups/${groupId}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: cookie },
        body: JSON.stringify({ media: [{ key: "1.jpg", mediaType: "photo" }] }),
      }, env);
      await app.request(`/groups/${groupId}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: cookie },
        body: JSON.stringify({ media: [{ key: "2.jpg", mediaType: "photo" }] }),
      }, env);

      const res = await app.request(`/groups/${groupId}/posts?limit=1`, {
        headers: { Cookie: cookie },
      }, env);
      const data = (await res.json()) as { items: unknown[]; nextCursor?: string };
      expect(data.items).toHaveLength(1);
      expect(data.nextCursor).toBeDefined();
    });
  });

  describe("GET /groups/:groupId/posts/:postId", () => {
    it("投稿詳細を返す", async () => {
      const createRes = await app.request(`/groups/${groupId}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: cookie },
        body: JSON.stringify({
          caption: "Detail",
          media: [{ key: "b.jpg", mediaType: "photo" }],
        }),
      }, env);
      const { id: postId } = (await createRes.json()) as { id: string };

      const res = await app.request(`/groups/${groupId}/posts/${postId}`, {
        headers: { Cookie: cookie },
      }, env);
      expect(res.status).toBe(200);
      const data = (await res.json()) as { caption: string; replyCount: number };
      expect(data.caption).toBe("Detail");
      expect(data.replyCount).toBe(0);
    });

    it("存在しない投稿は 404", async () => {
      const res = await app.request(`/groups/${groupId}/posts/nonexistent-id`, {
        headers: { Cookie: cookie },
      }, env);
      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /groups/:groupId/posts/:postId", () => {
    it("自分の投稿は削除できる", async () => {
      const createRes = await app.request(`/groups/${groupId}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: cookie },
        body: JSON.stringify({
          media: [{ key: "c.jpg", mediaType: "photo" }],
        }),
      }, env);
      const { id: postId } = (await createRes.json()) as { id: string };

      const res = await app.request(`/groups/${groupId}/posts/${postId}`, {
        method: "DELETE",
        headers: { Cookie: cookie },
      }, env);
      expect(res.status).toBe(200);

      const getRes = await app.request(`/groups/${groupId}/posts/${postId}`, {
        headers: { Cookie: cookie },
      }, env);
      expect(getRes.status).toBe(404);
    });
  });
});

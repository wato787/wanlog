import { describe, expect, it, beforeEach } from "vitest";
import { drizzle } from "drizzle-orm/d1";
import app from "../index";
import { users } from "../db/schema";
import { createTestD1 } from "../test-helpers/d1-mock";
import { createAuthCookie, getTestEnv } from "../test-helpers/auth";

describe("リプライAPI", () => {
  const userId = "user-001";
  const otherId = "user-002";
  let env: ReturnType<typeof getTestEnv>;
  let cookie: string;
  let otherCookie: string;
  let groupId: string;
  let postId: string;

  beforeEach(async () => {
    const DB = createTestD1();
    env = getTestEnv(DB);
    cookie = await createAuthCookie(userId);
    otherCookie = await createAuthCookie(otherId);
    const now = Math.floor(Date.now() / 1000);
    await drizzle(DB)
      .insert(users)
      .values([
        { id: userId, lineId: "line-1", displayName: "User1", createdAt: now },
        { id: otherId, lineId: "line-2", displayName: "User2", createdAt: now },
      ]);

    const createGroupRes = await app.request(
      "/groups",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: cookie },
        body: JSON.stringify({ name: "Group" }),
      },
      env
    );
    groupId = ((await createGroupRes.json()) as { id: string }).id;

    const invRes = await app.request(
      `/groups/${groupId}/invitations`,
      {
        method: "POST",
        headers: { Cookie: cookie },
      },
      env
    );
    const token = ((await invRes.json()) as { token: string }).token;
    await app.request(
      `/invitations/${token}/join`,
      {
        method: "POST",
        headers: { Cookie: otherCookie },
      },
      env
    );

    const createPostRes = await app.request(
      `/groups/${groupId}/posts`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: cookie },
        body: JSON.stringify({
          media: [{ key: "x.jpg", mediaType: "photo" }],
        }),
      },
      env
    );
    postId = ((await createPostRes.json()) as { id: string }).id;
  });

  describe("GET /groups/:groupId/posts/:postId/replies", () => {
    it("認証なしは 401", async () => {
      const res = await app.request(`/groups/${groupId}/posts/${postId}/replies`, {}, env);
      expect(res.status).toBe(401);
    });

    it("グループメンバーはリプライ一覧を取得できる", async () => {
      const res = await app.request(
        `/groups/${groupId}/posts/${postId}/replies`,
        { headers: { Cookie: cookie } },
        env
      );
      expect(res.status).toBe(200);
      const data = (await res.json()) as { replies: unknown[] };
      expect(data.replies).toEqual([]);
    });

    it("メンバーでない投稿は 404", async () => {
      const res = await app.request(
        "/groups/other-group/posts/some-post/replies",
        { headers: { Cookie: cookie } },
        env
      );
      expect(res.status).toBe(404);
    });
  });

  describe("POST /groups/:groupId/posts/:postId/replies", () => {
    it("認証ありでリプライ作成し 201", async () => {
      const res = await app.request(
        `/groups/${groupId}/posts/${postId}/replies`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Cookie: cookie },
          body: JSON.stringify({ body: "Hello!" }),
        },
        env
      );
      expect(res.status).toBe(201);
      const data = (await res.json()) as {
        id: string;
        body: string;
        author: { displayName: string };
      };
      expect(data.body).toBe("Hello!");
      expect(data.author.displayName).toBe("User1");
    });

    it("body が空なら 400", async () => {
      const res = await app.request(
        `/groups/${groupId}/posts/${postId}/replies`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Cookie: cookie },
          body: JSON.stringify({ body: "" }),
        },
        env
      );
      expect(res.status).toBe(400);
    });
  });

  describe("DELETE /groups/:groupId/posts/:postId/replies/:replyId", () => {
    it("自分のリプライは削除できる", async () => {
      const createRes = await app.request(
        `/groups/${groupId}/posts/${postId}/replies`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Cookie: cookie },
          body: JSON.stringify({ body: "Bye" }),
        },
        env
      );
      const replyId = ((await createRes.json()) as { id: string }).id;

      const res = await app.request(
        `/groups/${groupId}/posts/${postId}/replies/${replyId}`,
        { method: "DELETE", headers: { Cookie: cookie } },
        env
      );
      expect(res.status).toBe(200);

      const listRes = await app.request(
        `/groups/${groupId}/posts/${postId}/replies`,
        { headers: { Cookie: cookie } },
        env
      );
      const data = (await listRes.json()) as { replies: unknown[] };
      expect(data.replies).toHaveLength(0);
    });

    it("他人のリプライは 403", async () => {
      const createRes = await app.request(
        `/groups/${groupId}/posts/${postId}/replies`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Cookie: otherCookie },
          body: JSON.stringify({ body: "Other reply" }),
        },
        env
      );
      const replyId = ((await createRes.json()) as { id: string }).id;

      const res = await app.request(
        `/groups/${groupId}/posts/${postId}/replies/${replyId}`,
        { method: "DELETE", headers: { Cookie: cookie } },
        env
      );
      expect(res.status).toBe(403);
    });
  });
});

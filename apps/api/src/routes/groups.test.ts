import { describe, expect, it, beforeEach } from "vitest";
import { drizzle } from "drizzle-orm/d1";
import app from "../index";
import { users } from "../db/schema";
import { createTestD1 } from "../test-helpers/d1-mock";
import {
  createAuthCookie,
  getTestEnv,
} from "../test-helpers/auth";

describe("グループAPI", () => {
  const userId = "user-001";
  let DB: D1Database;
  let env: ReturnType<typeof getTestEnv>;
  let cookie: string;

  beforeEach(async () => {
    DB = createTestD1();
    env = getTestEnv(DB);
    cookie = await createAuthCookie(userId);

    const now = Math.floor(Date.now() / 1000);
    const db = drizzle(DB);
    await db.insert(users).values({
      id: userId,
      lineId: "line-test-1",
      displayName: "Test User",
      createdAt: now,
    });
  });

  describe("POST /groups", () => {
    it("認証なしは 401", async () => {
      const res = await app.request("/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "My Group" }),
      }, env);
      expect(res.status).toBe(401);
    });

    it("認証ありでグループ作成し 201 と id/name/createdAt を返す", async () => {
      const res = await app.request("/groups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookie,
        },
        body: JSON.stringify({ name: "My Group" }),
      }, env);
      expect(res.status).toBe(201);
      const data = (await res.json()) as { id: string; name: string; createdAt: number };
      expect(data.name).toBe("My Group");
      expect(data.id).toBeDefined();
      expect(data.createdAt).toBeGreaterThan(0);
    });

    it("name が空なら 400", async () => {
      const res = await app.request("/groups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookie,
        },
        body: JSON.stringify({ name: "" }),
      }, env);
      expect(res.status).toBe(400);
    });
  });

  describe("GET /groups/:groupId", () => {
    it("認証なしは 401", async () => {
      const res = await app.request("/groups/some-id", {}, env);
      expect(res.status).toBe(401);
    });

    it("メンバーでないグループは 403", async () => {
      const res = await app.request("/groups/other-group-id", {
        headers: { Cookie: cookie },
      }, env);
      expect(res.status).toBe(403);
    });

    it("作成したグループは取得できる", async () => {
      const createRes = await app.request("/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: cookie },
        body: JSON.stringify({ name: "Our Group" }),
      }, env);
      expect(createRes.status).toBe(201);
      const { id } = (await createRes.json()) as { id: string };

      const getRes = await app.request(`/groups/${id}`, {
        headers: { Cookie: cookie },
      }, env);
      expect(getRes.status).toBe(200);
      const data = (await getRes.json()) as { id: string; name: string };
      expect(data.name).toBe("Our Group");
      expect(data.id).toBe(id);
    });
  });

  describe("PATCH /groups/:groupId", () => {
    it("owner のみ名前変更できる", async () => {
      const createRes = await app.request("/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: cookie },
        body: JSON.stringify({ name: "Old Name" }),
      }, env);
      const { id } = (await createRes.json()) as { id: string };

      const res = await app.request(`/groups/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Cookie: cookie },
        body: JSON.stringify({ name: "New Name" }),
      }, env);
      expect(res.status).toBe(200);
      const data = (await res.json()) as { name: string };
      expect(data.name).toBe("New Name");
    });
  });

  describe("GET /groups/:groupId/members", () => {
    it("メンバー一覧を返す", async () => {
      const createRes = await app.request("/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: cookie },
        body: JSON.stringify({ name: "Group" }),
      }, env);
      const { id } = (await createRes.json()) as { id: string };

      const res = await app.request(`/groups/${id}/members`, {
        headers: { Cookie: cookie },
      }, env);
      expect(res.status).toBe(200);
      const data = (await res.json()) as { members: unknown[] };
      expect(data.members.length).toBe(1);
      expect((data.members[0] as { displayName: string }).displayName).toBe("Test User");
      expect((data.members[0] as { role: string }).role).toBe("owner");
    });
  });

  describe("DELETE /groups/:groupId/members/:userId", () => {
    it("自分自身は削除できない", async () => {
      const createRes = await app.request("/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: cookie },
        body: JSON.stringify({ name: "Group" }),
      }, env);
      const { id } = (await createRes.json()) as { id: string };

      const res = await app.request(`/groups/${id}/members/${userId}`, {
        method: "DELETE",
        headers: { Cookie: cookie },
      }, env);
      expect(res.status).toBe(400);
      const body = (await res.json()) as { error: string };
      expect(body.error).toContain("yourself");
    });
  });

  describe("POST /groups/:groupId/invitations", () => {
    it("owner が招待トークンを発行できる", async () => {
      const createRes = await app.request("/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: cookie },
        body: JSON.stringify({ name: "Group" }),
      }, env);
      const { id } = (await createRes.json()) as { id: string };

      const res = await app.request(`/groups/${id}/invitations`, {
        method: "POST",
        headers: { Cookie: cookie },
      }, env);
      expect(res.status).toBe(201);
      const data = (await res.json()) as { token: string; groupId: string; expiresAt: number };
      expect(data.token).toBeDefined();
      expect(data.groupId).toBe(id);
      expect(data.expiresAt).toBeGreaterThan(Math.floor(Date.now() / 1000));
    });
  });
});

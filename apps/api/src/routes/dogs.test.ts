import { describe, expect, it, beforeEach } from "vitest";
import { drizzle } from "drizzle-orm/d1";
import app from "../index";
import { users } from "../db/schema";
import { createTestD1 } from "../test-helpers/d1-mock";
import { createAuthCookie, getTestEnv } from "../test-helpers/auth";

describe("犬API", () => {
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

    const createRes = await app.request(
      "/groups",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: cookie },
        body: JSON.stringify({ name: "My Group" }),
      },
      env
    );
    expect(createRes.status).toBe(201);
    groupId = ((await createRes.json()) as { id: string }).id;
  });

  describe("GET /groups/:groupId/dogs", () => {
    it("認証ありで犬一覧を取得できる（初期は空）", async () => {
      const res = await app.request(
        `/groups/${groupId}/dogs`,
        {
          headers: { Cookie: cookie },
        },
        env
      );
      expect(res.status).toBe(200);
      const data = (await res.json()) as { dogs: unknown[] };
      expect(data.dogs).toEqual([]);
    });

    it("メンバーでないグループは 403", async () => {
      const res = await app.request(
        "/groups/other-id/dogs",
        {
          headers: { Cookie: cookie },
        },
        env
      );
      expect(res.status).toBe(403);
    });
  });

  describe("POST /groups/:groupId/dogs", () => {
    it("認証ありで犬を登録し 201", async () => {
      const res = await app.request(
        `/groups/${groupId}/dogs`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Cookie: cookie },
          body: JSON.stringify({
            name: "ポチ",
            breed: "柴犬",
            birthday: "2020-05-01",
          }),
        },
        env
      );
      expect(res.status).toBe(201);
      const data = (await res.json()) as { id: string; name: string; breed: string | null };
      expect(data.name).toBe("ポチ");
      expect(data.breed).toBe("柴犬");
      expect(data.id).toBeDefined();
    });

    it("name が空なら 400", async () => {
      const res = await app.request(
        `/groups/${groupId}/dogs`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Cookie: cookie },
          body: JSON.stringify({ name: "" }),
        },
        env
      );
      expect(res.status).toBe(400);
    });
  });

  describe("PATCH /groups/:groupId/dogs/:dogId", () => {
    it("犬プロフィールを更新できる", async () => {
      const createRes = await app.request(
        `/groups/${groupId}/dogs`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Cookie: cookie },
          body: JSON.stringify({ name: "タロウ" }),
        },
        env
      );
      const dogId = ((await createRes.json()) as { id: string }).id;

      const res = await app.request(
        `/groups/${groupId}/dogs/${dogId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Cookie: cookie },
          body: JSON.stringify({ name: "タロウ（更新）", breed: "ゴールデン" }),
        },
        env
      );
      expect(res.status).toBe(200);
      const data = (await res.json()) as { name: string; breed: string | null };
      expect(data.name).toBe("タロウ（更新）");
      expect(data.breed).toBe("ゴールデン");
    });

    it("存在しない dogId は 404", async () => {
      const res = await app.request(
        `/groups/${groupId}/dogs/nonexistent-id`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Cookie: cookie },
          body: JSON.stringify({ name: "X" }),
        },
        env
      );
      expect(res.status).toBe(404);
    });
  });
});

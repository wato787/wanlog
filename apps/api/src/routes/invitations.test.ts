import { describe, expect, it, beforeEach } from "vitest";
import { drizzle } from "drizzle-orm/d1";
import app from "../index";
import { users } from "../db/schema";
import { createTestD1 } from "../test-helpers/d1-mock";
import {
  createAuthCookie,
  getTestEnv,
} from "../test-helpers/auth";

describe("招待API", () => {
  const ownerId = "user-owner";
  const otherId = "user-other";
  let DB: D1Database;
  let env: ReturnType<typeof getTestEnv>;
  let ownerCookie: string;
  let otherCookie: string;

  beforeEach(async () => {
    DB = createTestD1();
    env = getTestEnv(DB);
    ownerCookie = await createAuthCookie(ownerId);
    otherCookie = await createAuthCookie(otherId);

    const now = Math.floor(Date.now() / 1000);
    const db = drizzle(DB);
    await db.insert(users).values([
      {
        id: ownerId,
        lineId: "line-owner",
        displayName: "Owner",
        createdAt: now,
      },
      {
        id: otherId,
        lineId: "line-other",
        displayName: "Other",
        createdAt: now,
      },
    ]);
  });

  async function createGroupAndInvitation(): Promise<{ groupId: string; token: string }> {
    const createRes = await app.request("/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: ownerCookie },
      body: JSON.stringify({ name: "Test Group" }),
    }, env);
    expect(createRes.status).toBe(201);
    const { id: groupId } = (await createRes.json()) as { id: string };

    const invRes = await app.request(`/groups/${groupId}/invitations`, {
      method: "POST",
      headers: { Cookie: ownerCookie },
    }, env);
    expect(invRes.status).toBe(201);
    const { token } = (await invRes.json()) as { token: string };
    return { groupId, token };
  }

  describe("GET /invitations/:token", () => {
    it("認証不要でトークン確認できる", async () => {
      const { token } = await createGroupAndInvitation();

      const res = await app.request(`/invitations/${token}`, {}, env);
      expect(res.status).toBe(200);
      const data = (await res.json()) as { valid: boolean; groupName: string };
      expect(data.valid).toBe(true);
      expect(data.groupName).toBe("Test Group");
    });

    it("存在しないトークンは valid: false, reason: not_found", async () => {
      const res = await app.request("/invitations/nonexistent-token-12345", {}, env);
      expect(res.status).toBe(200);
      const data = (await res.json()) as { valid: boolean; reason: string };
      expect(data.valid).toBe(false);
      expect(data.reason).toBe("not_found");
    });

    it("使用済みトークンは valid: false, reason: used", async () => {
      const { token } = await createGroupAndInvitation();

      await app.request(`/invitations/${token}/join`, {
        method: "POST",
        headers: { Cookie: otherCookie },
      }, env);

      const res = await app.request(`/invitations/${token}`, {}, env);
      expect(res.status).toBe(200);
      const data = (await res.json()) as { valid: boolean; reason: string };
      expect(data.valid).toBe(false);
      expect(data.reason).toBe("used");
    });
  });

  describe("POST /invitations/:token/join", () => {
    it("認証なしは 401", async () => {
      const { token } = await createGroupAndInvitation();

      const res = await app.request(`/invitations/${token}/join`, {
        method: "POST",
      }, env);
      expect(res.status).toBe(401);
    });

    it("認証ありで参加できる", async () => {
      const { groupId, token } = await createGroupAndInvitation();

      const res = await app.request(`/invitations/${token}/join`, {
        method: "POST",
        headers: { Cookie: otherCookie },
      }, env);
      expect(res.status).toBe(201);
      const data = (await res.json()) as { ok: boolean; groupId: string };
      expect(data.ok).toBe(true);
      expect(data.groupId).toBe(groupId);

      const membersRes = await app.request(`/groups/${groupId}/members`, {
        headers: { Cookie: ownerCookie },
      }, env);
      const { members } = (await membersRes.json()) as { members: { userId: string }[] };
      expect(members.some((m) => m.userId === otherId)).toBe(true);
    });

    it("同じトークンで二重参加は 400", async () => {
      const { token } = await createGroupAndInvitation();

      await app.request(`/invitations/${token}/join`, {
        method: "POST",
        headers: { Cookie: otherCookie },
      }, env);

      const res = await app.request(`/invitations/${token}/join`, {
        method: "POST",
        headers: { Cookie: otherCookie },
      }, env);
      expect(res.status).toBe(400);
      const data = (await res.json()) as { error: string };
      expect(data.error).toMatch(/already used|Already a member/i);
    });

    it("既にメンバーなら 400", async () => {
      const { token } = await createGroupAndInvitation();

      await app.request(`/invitations/${token}/join`, {
        method: "POST",
        headers: { Cookie: ownerCookie },
      }, env);

      const res = await app.request(`/invitations/${token}/join`, {
        method: "POST",
        headers: { Cookie: ownerCookie },
      }, env);
      expect(res.status).toBe(400);
    });
  });
});

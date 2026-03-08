import { describe, expect, it, beforeEach } from "vitest";
import { drizzle } from "drizzle-orm/d1";
import app from "../index";
import { users } from "../db/schema";
import { createTestD1 } from "../test-helpers/d1-mock";
import {
  createAuthCookie,
  getTestEnv,
} from "../test-helpers/auth";

describe("アップロード presigned URL API", () => {
  const userId = "user-001";
  let env: ReturnType<typeof getTestEnv>;
  let cookie: string;

  beforeEach(async () => {
    const DB = createTestD1();
    env = getTestEnv(DB);
    cookie = await createAuthCookie(userId);
    const now = Math.floor(Date.now() / 1000);
    await drizzle(DB).insert(users).values({
      id: userId,
      lineId: "line-1",
      displayName: "Test",
      createdAt: now,
    });
  });

  it("認証なしは 401", async () => {
    const res = await app.request("/uploads/presigned-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        files: [{ contentType: "image/jpeg" }],
      }),
    }, env);
    expect(res.status).toBe(401);
  });

  it("認証ありで files を送ると 200 と urls を返す", async () => {
    const res = await app.request("/uploads/presigned-url", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
      },
      body: JSON.stringify({
        files: [
          { contentType: "image/jpeg" },
          { contentType: "image/png" },
        ],
      }),
    }, env);
    expect(res.status).toBe(200);
    const data = (await res.json()) as { urls: { key: string; url: string; expiresIn: number }[] };
    expect(data.urls).toHaveLength(2);
    expect(data.urls[0].key).toMatch(/^uploads\/user-001\/.+\.[a-z]+$/);
    expect(data.urls[0].url).toContain("X-Amz-");
    expect(data.urls[0].expiresIn).toBe(3600);
  });

  it("files が空なら 400", async () => {
    const res = await app.request("/uploads/presigned-url", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ files: [] }),
    }, env);
    expect(res.status).toBe(400);
  });

  it("許可外の contentType は 400", async () => {
    const res = await app.request("/uploads/presigned-url", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({
        files: [{ contentType: "application/pdf" }],
      }),
    }, env);
    expect(res.status).toBe(400);
  });
});

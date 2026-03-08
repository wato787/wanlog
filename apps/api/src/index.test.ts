import { describe, expect, it } from "vitest";
import app from "./index";

const mockEnv = {
  DB: {} as D1Database,
  BUCKET: {} as R2Bucket,
  LINE_CHANNEL_ID: "test",
  LINE_CHANNEL_SECRET: "test",
  JWT_SECRET: "test-secret",
  API_ORIGIN: "http://localhost:8787",
  FRONTEND_ORIGIN: "http://localhost:5173",
};

describe("API", () => {
  it("GET / returns 200 and Hello Hono!", async () => {
    const res = await app.request("/", {}, mockEnv);
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("Hello Hono!");
  });
});

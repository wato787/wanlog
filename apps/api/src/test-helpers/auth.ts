/**
 * テスト用: 有効な JWT を発行し Cookie ヘッダを返す
 */
import { sign } from "hono/jwt";
import { COOKIE_NAME } from "../auth";

const JWT_SECRET = "test-secret";

export async function createAuthCookie(userId: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const token = await sign(
    { sub: userId, iat: now, exp: now + 3600 },
    JWT_SECRET,
    "HS256",
  );
  return `${COOKIE_NAME}=${token}`;
}

export function getTestEnv(DB: D1Database) {
  return {
    DB,
    BUCKET: {} as R2Bucket,
    LINE_CHANNEL_ID: "test",
    LINE_CHANNEL_SECRET: "test",
    JWT_SECRET,
    API_ORIGIN: "http://localhost:8787",
    FRONTEND_ORIGIN: "http://localhost:5173",
    R2_ACCESS_KEY_ID: "test",
    R2_SECRET_ACCESS_KEY: "test",
    R2_ACCOUNT_ID: "test",
    R2_BUCKET_NAME: "wanlog-media",
  };
}

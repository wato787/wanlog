/**
 * JWT 検証ミドルウェア（Cookie から session を読み検証し userId をセット）
 */
import { getCookie } from "hono/cookie";
import { verify } from "hono/jwt";
import type { MiddlewareHandler } from "hono";
import { COOKIE_NAME } from "../auth";

export type AuthEnv = {
  Bindings: { JWT_SECRET: string };
  Variables: { userId: string };
};

export const requireAuth: MiddlewareHandler<AuthEnv> = async (c, next) => {
  const token = getCookie(c, COOKIE_NAME);
  if (!token) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  try {
    const payload = await verify(token, c.env.JWT_SECRET, "HS256");
    const sub = payload.sub as string;
    if (!sub) {
      return c.json({ error: "Invalid token" }, 401);
    }
    c.set("userId", sub);
    await next();
  } catch {
    return c.json({ error: "Invalid token" }, 401);
  }
};

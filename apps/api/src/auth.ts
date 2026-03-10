/**
 * 認証ルート（LINE OAuth 2.0 + JWT）
 */
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { sign } from "hono/jwt";
import { Hono } from "hono";
import { users } from "./db/schema";
import { uuidv7 } from "uuidv7";
import { requireAuth } from "./middleware/auth";

const LINE_AUTH_URL = "https://access.line.me/oauth2/v2.1/authorize";
const LINE_TOKEN_URL = "https://api.line.me/oauth2/v2.1/token";
const LINE_PROFILE_URL = "https://api.line.me/v2/profile";

const COOKIE_NAME = "session";
const STATE_COOKIE_NAME = "line_oauth_state";
const JWT_EXP_DAYS = 30;

export type AuthBindings = {
  DB: D1Database;
  LINE_CHANNEL_ID: string;
  LINE_CHANNEL_SECRET: string;
  JWT_SECRET: string;
  API_ORIGIN: string;
  FRONTEND_ORIGIN: string;
};

export type AuthVariables = { userId: string };

export function createAuthApp() {
  const app = new Hono<{
    Bindings: AuthBindings;
    Variables: AuthVariables;
  }>();

  // LINE 認証 URL へリダイレクト（state を cookie に保存）
  app.get("/line", (c) => {
    const state = crypto.randomUUID();
    const redirectUri = c.env.API_ORIGIN + "/auth/line/callback";
    const params = new URLSearchParams({
      response_type: "code",
      client_id: c.env.LINE_CHANNEL_ID,
      redirect_uri: redirectUri,
      scope: "profile",
      state,
    });
    const lineUrl = LINE_AUTH_URL + "?" + params.toString();

    setCookie(c, STATE_COOKIE_NAME, state, {
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
      maxAge: 600,
    });
    return c.redirect(lineUrl);
  });

  // LINE コールバック（GET: ブラウザが code/state 付きでリダイレクトされる）
  app.get("/line/callback", async (c) => {
    const code = c.req.query("code");
    const state = c.req.query("state");
    const stateCookie = getCookie(c, STATE_COOKIE_NAME);

    if (!code || !state || state !== stateCookie) {
      return c.json({ error: "Invalid or missing code/state" }, 400);
    }

    const redirectUri = c.env.API_ORIGIN + "/auth/line/callback";

    const tokenRes = await fetch(LINE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: c.env.LINE_CHANNEL_ID,
        client_secret: c.env.LINE_CHANNEL_SECRET,
      }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      return c.json({ error: "LINE token error", details: err }, 400);
    }

    const tokenData = (await tokenRes.json()) as { access_token: string };
    const profileRes = await fetch(LINE_PROFILE_URL, {
      headers: { Authorization: "Bearer " + tokenData.access_token },
    });

    if (!profileRes.ok) {
      return c.json({ error: "LINE profile error" }, 400);
    }

    const profile = (await profileRes.json()) as {
      userId: string;
      displayName: string;
      pictureUrl?: string;
    };

    const db = drizzle(c.env.DB);
    const now = Math.floor(Date.now() / 1000);

    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.lineId, profile.userId))
      .limit(1);

    let userId: string;
    if (existing) {
      userId = existing.id;
      await db
        .update(users)
        .set({
          displayName: profile.displayName,
          avatarUrl: profile.pictureUrl ?? null,
        })
        .where(eq(users.id, existing.id));
    } else {
      userId = uuidv7();
      await db.insert(users).values({
        id: userId,
        lineId: profile.userId,
        displayName: profile.displayName,
        avatarUrl: profile.pictureUrl ?? null,
        createdAt: now,
      });
    }

    const payload = {
      sub: userId,
      iat: now,
      exp: now + JWT_EXP_DAYS * 24 * 60 * 60,
    };
    const token = await sign(payload, c.env.JWT_SECRET, "HS256");

    setCookie(c, COOKIE_NAME, token, {
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
      secure: true,
      maxAge: JWT_EXP_DAYS * 24 * 60 * 60,
    });
    return c.redirect(c.env.FRONTEND_ORIGIN, 302);
  });

  // ログインユーザー情報取得
  app.get("/me", requireAuth, async (c) => {
    const db = drizzle(c.env.DB);
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, c.get("userId")))
      .limit(1);
    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }
    return c.json({
      id: user.id,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
    });
  });

  // ログアウト（Cookie 削除）
  app.post("/logout", (c) => {
    deleteCookie(c, COOKIE_NAME);
    return c.json({ ok: true });
  });

  return app;
}

export { COOKIE_NAME };

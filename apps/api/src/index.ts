import { Hono } from "hono";
import { cors } from "hono/cors";
import { createAuthApp } from "./auth";
import { createGroupsApp } from "./routes/groups";
import { createInvitationsApp } from "./routes/invitations";
import { createUploadsApp } from "./routes/uploads";

export type Bindings = {
  DB: D1Database;
  BUCKET: R2Bucket;
  LINE_CHANNEL_ID: string;
  LINE_CHANNEL_SECRET: string;
  JWT_SECRET: string;
  API_ORIGIN: string;
  FRONTEND_ORIGIN: string;
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;
  R2_ACCOUNT_ID: string;
  R2_BUCKET_NAME?: string;
};

export type Variables = { userId: string };

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()
  .use("*", async (c, next) => {
    const handler = cors({
      origin: c.env.FRONTEND_ORIGIN,
      credentials: true,
      allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization"],
    });
    return (handler as (c: unknown, next: () => Promise<void>) => Promise<Response | void>)(
      c,
      next
    );
  })
  .get("/", (c) => c.text("Hello Hono!"))
  .route("/auth", createAuthApp())
  .route("/groups", createGroupsApp())
  .route("/invitations", createInvitationsApp())
  .route("/uploads", createUploadsApp());

export type AppType = typeof app;
export default app;

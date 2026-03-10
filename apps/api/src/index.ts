import { Hono } from "hono";
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

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app
  .route("/", createAuthApp())
  .route("/groups", createGroupsApp())
  .route("/invitations", createInvitationsApp())
  .route("/uploads", createUploadsApp());

export type AppType = typeof app;
export default app;

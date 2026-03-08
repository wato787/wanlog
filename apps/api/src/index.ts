import { Hono } from "hono";
import { createAuthApp } from "./auth";
import { createGroupsApp } from "./routes/groups";
import { createInvitationsApp } from "./routes/invitations";

export type Bindings = {
  DB: D1Database;
  BUCKET: R2Bucket;
  LINE_CHANNEL_ID: string;
  LINE_CHANNEL_SECRET: string;
  JWT_SECRET: string;
  API_ORIGIN: string;
  FRONTEND_ORIGIN: string;
};

export type Variables = { userId: string };

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.route("/", createAuthApp());
app.route("/groups", createGroupsApp());
app.route("/invitations", createInvitationsApp());

export default app;

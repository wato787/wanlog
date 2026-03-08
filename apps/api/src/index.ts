import { Hono } from "hono";
import { createAuthApp } from "./auth";

export type Bindings = {
  DB: D1Database;
  BUCKET: R2Bucket;
  LINE_CHANNEL_ID: string;
  LINE_CHANNEL_SECRET: string;
  JWT_SECRET: string;
  API_ORIGIN: string;
  FRONTEND_ORIGIN: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.route("/", createAuthApp());

export default app;

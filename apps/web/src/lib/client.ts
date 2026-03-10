/**
 * Hono RPC クライアント（AppType に基づく型安全なクライアント）
 */
import { hc } from "hono/client";
import type { AppType } from "@wanlog/api";

export function getApiBaseUrl(): string {
  const env = import.meta.env?.VITE_API_URL ?? import.meta.env?.VITE_API_ORIGIN;
  if (env && typeof env === "string") return env;
  return "http://localhost:8787";
}

export const client = hc<AppType>(getApiBaseUrl(), {
  init: { credentials: "include" },
});
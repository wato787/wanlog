/**
 * API クライアント（BE の AppType に基づく型安全な RPC）
 */
import { client } from "./client";

export type { InferResponseType, InferRequestType } from "hono/client";
export { parseResponse } from "hono/client";

export const api = client;

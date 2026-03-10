/**
 * Hono RPC クライアント
 * BE (@wanlog/api) の AppType を利用した型安全な API クライアント
 */
import type { AppType } from "@wanlog/api";
import { hc } from "hono/client";

export type { AppType };

export type ApiClient = ReturnType<typeof hc<AppType>>;

export type CreateApiClientOptions = Parameters<typeof hc<AppType>>[1];

/**
 * 型安全な API クライアントを作成する
 * @param baseUrl API のベース URL（例: import.meta.env.VITE_API_ORIGIN）
 * @param options credentials: 'include' で Cookie 送信（デフォルトで有効）
 */
export function createApiClient(baseUrl: string, options?: CreateApiClientOptions): ApiClient {
  return hc<AppType>(baseUrl, {
    ...options,
    init: { credentials: "include", ...options?.init },
  } as CreateApiClientOptions);
}

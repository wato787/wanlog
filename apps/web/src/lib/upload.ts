/**
 * R2 へのアップロード用: presigned URL 取得 → PUT でアップロード
 */
import { api, parseResponse } from "./api";

const ALLOWED: Record<string, "image/jpeg" | "image/png" | "image/webp" | "video/mp4"> = {
  "image/jpeg": "image/jpeg",
  "image/png": "image/png",
  "image/webp": "image/webp",
  "video/mp4": "video/mp4",
};

function toContentType(file: File): "image/jpeg" | "image/png" | "image/webp" | "video/mp4" {
  return ALLOWED[file.type] ?? "image/jpeg";
}

export type UploadedMedia = { key: string; mediaType: "photo" | "video" };

export async function uploadFiles(files: File[]): Promise<UploadedMedia[]> {
  if (files.length === 0) throw new Error("ファイルを選択してください");
  const filesPayload = files.map((f) => ({ contentType: toContentType(f) }));
  const res = await api.uploads["presigned-url"].$post({ json: { files: filesPayload } });
  if (!res.ok) throw new Error("アップロードの準備に失敗しました");
  const { urls } = await parseResponse(res);
  for (let i = 0; i < files.length; i++) {
    const putRes = await fetch(urls[i].url, {
      method: "PUT",
      body: files[i],
      headers: { "Content-Type": files[i].type },
    });
    if (!putRes.ok) throw new Error("アップロードに失敗しました");
  }
  return urls.map((u, i) => ({
    key: u.key,
    mediaType: files[i].type.startsWith("video/") ? ("video" as const) : ("photo" as const),
  }));
}

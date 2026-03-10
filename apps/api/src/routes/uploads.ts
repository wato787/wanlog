/**
 * アップロード用 presigned URL API
 */
import { AwsClient } from "aws4fetch";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { uuidv7 } from "uuidv7";
import { requireAuth } from "../middleware/auth";

const PRESIGNED_EXPIRES_SEC = 3600; // 1時間
const MAX_FILES = 10;

const ALLOWED_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp", "video/mp4"] as const;

const EXT_BY_CONTENT_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "video/mp4": "mp4",
};

const requestSchema = z.object({
  files: z
    .array(
      z.object({
        contentType: z.enum(ALLOWED_CONTENT_TYPES),
      })
    )
    .min(1)
    .max(MAX_FILES),
});

type UploadsEnv = {
  Bindings: {
    R2_ACCESS_KEY_ID: string;
    R2_SECRET_ACCESS_KEY: string;
    R2_ACCOUNT_ID: string;
    R2_BUCKET_NAME?: string;
  };
  Variables: { userId: string };
};

const DEFAULT_BUCKET_NAME = "wanlog-media";

export function createUploadsApp() {
  return new Hono<UploadsEnv>()
    .use("/*", requireAuth)
    .post("/presigned-url", zValidator("json", requestSchema), async (c) => {
    const userId = c.get("userId");
    const { files } = c.req.valid("json");
    const {
      R2_ACCESS_KEY_ID,
      R2_SECRET_ACCESS_KEY,
      R2_ACCOUNT_ID,
      R2_BUCKET_NAME = DEFAULT_BUCKET_NAME,
    } = c.env;

    const client = new AwsClient({
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
      service: "s3",
      region: "auto",
    });

    const r2Url = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
    const bucket = R2_BUCKET_NAME;

    const urls: { key: string; url: string; expiresIn: number }[] = [];

    for (const f of files) {
      const ext = EXT_BY_CONTENT_TYPE[f.contentType] ?? "bin";
      const key = `uploads/${userId}/${uuidv7()}.${ext}`;
      const objectUrl = `${r2Url}/${bucket}/${key}?X-Amz-Expires=${PRESIGNED_EXPIRES_SEC}`;

      const signedRequest = await client.sign(new Request(objectUrl, { method: "PUT" }), {
        aws: { signQuery: true },
      });

      urls.push({
        key,
        url: String(signedRequest.url),
        expiresIn: PRESIGNED_EXPIRES_SEC,
      });
    }

    return c.json({ urls });
  });
}

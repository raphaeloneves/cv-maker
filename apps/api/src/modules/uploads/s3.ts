import {
  CreateBucketCommand,
  HeadBucketCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { env } from "../../env.js";

const client = new S3Client({
  endpoint: env.S3_ENDPOINT,
  region: env.S3_REGION,
  forcePathStyle: env.S3_FORCE_PATH_STYLE,
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY_ID,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY,
  },
});

let bucketEnsured = false;

/** Idempotently makes sure the configured bucket exists — local MinIO
 * doesn't provision it for us, and this avoids requiring a manual setup
 * step before the uploads module works. */
export async function ensureBucket(): Promise<void> {
  if (bucketEnsured) return;
  try {
    await client.send(new HeadBucketCommand({ Bucket: env.S3_BUCKET }));
  } catch {
    await client.send(new CreateBucketCommand({ Bucket: env.S3_BUCKET }));
  }
  bucketEnsured = true;
}

export async function putObject(params: {
  key: string;
  body: Buffer;
  contentType: string;
}): Promise<string> {
  await ensureBucket();
  await client.send(
    new PutObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: params.key,
      Body: params.body,
      ContentType: params.contentType,
    }),
  );
  return `${env.S3_PUBLIC_BASE_URL}/${params.key}`;
}

export async function deleteObject(key: string): Promise<void> {
  await client.send(new DeleteObjectCommand({ Bucket: env.S3_BUCKET, Key: key }));
}

/** Extracts the storage key from a previously-issued public URL, so a photo
 * can be deleted from S3 when it's replaced or removed. Returns null if the
 * URL doesn't look like one of ours (defensive — never throws). */
export function keyFromPublicUrl(url: string): string | null {
  if (!url.startsWith(env.S3_PUBLIC_BASE_URL)) return null;
  const key = url.slice(env.S3_PUBLIC_BASE_URL.length).replace(/^\//, "");
  return key.length > 0 ? key : null;
}

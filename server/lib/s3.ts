// server/lib/s3.ts
//
// Garage S3-compatible object storage.
// All image/video upload and delete operations go through this file.
// Nothing else in the codebase talks to storage directly.

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
} from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import { extname }    from 'path';

// ── Client ────────────────────────────────────────────────────────────────────

if (!process.env.GARAGE_ENDPOINT)   throw new Error('GARAGE_ENDPOINT is not set');
if (!process.env.GARAGE_BUCKET)     throw new Error('GARAGE_BUCKET is not set');
if (!process.env.GARAGE_ACCESS_KEY) throw new Error('GARAGE_ACCESS_KEY is not set');
if (!process.env.GARAGE_SECRET_KEY) throw new Error('GARAGE_SECRET_KEY is not set');
if (!process.env.GARAGE_PUBLIC_URL) throw new Error('GARAGE_PUBLIC_URL is not set');

export const s3 = new S3Client({
  // Garage ignores the region value but the SDK requires one
  region:   process.env.GARAGE_REGION ?? 'garage',
  endpoint: process.env.GARAGE_ENDPOINT,
  credentials: {
    accessKeyId:     process.env.GARAGE_ACCESS_KEY,
    secretAccessKey: process.env.GARAGE_SECRET_KEY,
  },
  // Required for Garage (and all non-AWS S3 providers)
  forcePathStyle: true,
});

const BUCKET = process.env.GARAGE_BUCKET;

// Strip trailing slash so URL construction is always: PUBLIC_URL + "/" + key
const PUBLIC_URL = process.env.GARAGE_PUBLIC_URL.replace(/\/$/, '');

// ── Allowed types and size limits ─────────────────────────────────────────────

const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
]);

const ALLOWED_VIDEO_TYPES = new Set([
  'video/mp4',
  'video/webm',
  'video/mov',
  'video/quicktime',
]);

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;  // 10 MB
const MAX_VIDEO_BYTES = 100 * 1024 * 1024; // 100 MB

// ── Upload ────────────────────────────────────────────────────────────────────

export interface UploadResult {
  url:  string;   // Full public URL — stored in Product.images[]
  key:  string;   // Garage object key — used for deletion
}

/**
 * Upload a buffer to Garage.
 * Returns the public URL (built from GARAGE_PUBLIC_URL + key) and the key.
 *
 * The URL format is always:  GARAGE_PUBLIC_URL/folder/uuid.ext
 * Changing GARAGE_PUBLIC_URL changes the base of all future upload URLs.
 */
export async function uploadToS3(
  buffer:        Buffer,
  mimeType:      string,
  folder:        string = 'products',
  originalName?: string,
): Promise<UploadResult> {

  const isImage = ALLOWED_IMAGE_TYPES.has(mimeType);
  const isVideo = ALLOWED_VIDEO_TYPES.has(mimeType);

  if (!isImage && !isVideo) {
    throw new Error(
      `Unsupported file type: ${mimeType}. ` +
      `Allowed: JPEG, PNG, WebP, AVIF, GIF, MP4, WebM, MOV`
    );
  }

  const maxBytes = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  if (buffer.byteLength > maxBytes) {
    throw new Error(`File too large. Maximum ${maxBytes / (1024 * 1024)} MB.`);
  }

  // Build object key: folder/uuid.ext
  const ext = originalName
    ? extname(originalName).toLowerCase()
    : mimeType === 'image/jpeg'       ? '.jpg'
    : mimeType === 'image/png'        ? '.png'
    : mimeType === 'image/webp'       ? '.webp'
    : mimeType === 'image/avif'       ? '.avif'
    : mimeType === 'image/gif'        ? '.gif'
    : mimeType === 'video/mp4'        ? '.mp4'
    : mimeType === 'video/webm'       ? '.webm'
    : mimeType === 'video/quicktime'  ? '.mov'
    : '';

  const key = `${folder}/${randomUUID()}${ext}`;

  await s3.send(new PutObjectCommand({
    Bucket:      BUCKET,
    Key:         key,
    Body:        buffer,
    ContentType: mimeType,
    // NOTE: Do NOT set ACL here — Garage does not support per-object ACLs.
    // Public access is set at the bucket level in Garage's configuration.
  }));

  // The public URL is GARAGE_PUBLIC_URL + "/" + key.
  // This is what gets stored in Product.images[] in the database.
  return {
    url: `${PUBLIC_URL}/${key}`,
    key,
  };
}

// ── Delete ────────────────────────────────────────────────────────────────────

/**
 * Delete a single object from Garage by its key.
 * Silently ignores NoSuchKey — safe to call even if already deleted.
 */
export async function deleteFromS3(key: string): Promise<void> {
  if (!key) return;
  try {
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
  } catch (err: any) {
    if (err?.Code !== 'NoSuchKey') throw err;
  }
}

/**
 * Delete multiple objects from Garage in one batch request.
 * Garage supports the S3 multi-delete API (max 1000 per call).
 */
export async function deleteMultipleFromS3(keys: string[]): Promise<void> {
  if (!keys.length) return;

  for (let i = 0; i < keys.length; i += 1000) {
    const chunk = keys.slice(i, i + 1000);
    await s3.send(new DeleteObjectsCommand({
      Bucket: BUCKET,
      Delete: {
        Objects: chunk.map(Key => ({ Key })),
        Quiet:   true,
      },
    }));
  }
}

/**
 * Extract the Garage object key from a full public URL.
 *
 * Uses GARAGE_PUBLIC_URL at runtime, so if the env var changes, this
 * function automatically works with the new URL base for new uploads.
 *
 * For old URLs stored in the DB with a different base, returns null —
 * those cannot be auto-deleted without a migration.
 */
export function urlToKey(url: string): string | null {
  if (!url) return null;
  const base = process.env.GARAGE_PUBLIC_URL?.replace(/\/$/, '') ?? PUBLIC_URL;
  if (!url.startsWith(base + '/')) return null;
  return url.slice(base.length + 1); // strip "BASE_URL/"
}

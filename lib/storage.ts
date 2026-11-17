/**
 * File storage abstraction.
 *
 * Picks the provider from STORAGE_PROVIDER env:
 *   - "vercel-blob" (default on Vercel)
 *   - "r2"          (Cloudflare R2 — recommended for Hostinger / self-host)
 *   - "s3"          (AWS S3 or any S3-compatible)
 *
 * Both R2 and S3 use the same AWS S3 client under the hood.
 */

export interface StorageProvider {
  upload(path: string, file: File | Blob, opts?: UploadOptions): Promise<{ url: string; path: string }>;
  delete(url: string): Promise<void>;
}

export interface UploadOptions {
  contentType?: string;
}

// ============================================
// Vercel Blob
// ============================================
class VercelBlobProvider implements StorageProvider {
  async upload(path: string, file: File | Blob, opts: UploadOptions = {}) {
    const { put } = await import("@vercel/blob");
    const result = await put(path, file, {
      access: "public",
      contentType: opts.contentType ?? (file as File).type,
      addRandomSuffix: true,
    });
    return { url: result.url, path: result.pathname };
  }

  async delete(url: string) {
    const { del } = await import("@vercel/blob");
    await del(url);
  }
}

// ============================================
// Cloudflare R2 / AWS S3
// ============================================
class S3CompatibleProvider implements StorageProvider {
  private async getClient() {
    const { S3Client } = await import("@aws-sdk/client-s3");
    return new S3Client({
      region: process.env.S3_REGION ?? "auto",
      endpoint: process.env.R2_ENDPOINT ?? process.env.S3_ENDPOINT,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID ?? process.env.S3_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? process.env.S3_SECRET_ACCESS_KEY!,
      },
    });
  }

  private bucket() {
    return process.env.R2_BUCKET ?? process.env.S3_BUCKET!;
  }

  private publicUrlBase() {
    return process.env.R2_PUBLIC_URL ?? process.env.S3_PUBLIC_URL!;
  }

  async upload(path: string, file: File | Blob, opts: UploadOptions = {}) {
    const { PutObjectCommand } = await import("@aws-sdk/client-s3");
    const client = await this.getClient();
    const buffer = Buffer.from(await file.arrayBuffer());
    // Random suffix to avoid collisions
    const stamp = Date.now().toString(36);
    const key = path.replace(/(\.[^.]+)?$/, `-${stamp}$1`);

    await client.send(new PutObjectCommand({
      Bucket: this.bucket(),
      Key: key,
      Body: buffer,
      ContentType: opts.contentType ?? (file as File).type,
    }));

    return {
      url: `${this.publicUrlBase().replace(/\/$/, "")}/${key}`,
      path: key,
    };
  }

  async delete(url: string) {
    const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");
    const client = await this.getClient();
    const key = url.replace(this.publicUrlBase(), "").replace(/^\//, "");
    await client.send(new DeleteObjectCommand({ Bucket: this.bucket(), Key: key }));
  }
}

// ============================================
// Provider factory
// ============================================
let provider: StorageProvider | null = null;
export function getStorage(): StorageProvider {
  if (provider) return provider;
  const name = process.env.STORAGE_PROVIDER ?? "vercel-blob";
  switch (name) {
    case "r2":
    case "s3":
      provider = new S3CompatibleProvider();
      break;
    case "vercel-blob":
    default:
      provider = new VercelBlobProvider();
  }
  return provider;
}

// ============================================
// High-level helpers (keep these stable)
// ============================================

export async function uploadSchoolLogo(schoolSlug: string, file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Logo must be an image (PNG or JPG).");
  if (file.size > 2 * 1024 * 1024) throw new Error("Logo must be under 2 MB.");
  const ext = file.name.split(".").pop() ?? "png";
  const { url } = await getStorage().upload(`schools/${schoolSlug}/logo.${ext}`, file);
  return url;
}

export async function uploadStudentPhoto(schoolSlug: string, admissionNo: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const { url } = await getStorage().upload(`schools/${schoolSlug}/students/${admissionNo}.${ext}`, file);
  return url;
}

export async function uploadActivityPhotos(schoolSlug: string, activityId: string, files: File[]): Promise<string[]> {
  const urls: string[] = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const ext = file.name.split(".").pop() ?? "jpg";
    const { url } = await getStorage().upload(
      `schools/${schoolSlug}/activities/${activityId}/${i}.${ext}`,
      file,
    );
    urls.push(url);
  }
  return urls;
}

export async function uploadAttachment(
  schoolSlug: string,
  category: "homework" | "messages" | "certificates",
  entityId: string,
  file: File,
): Promise<string> {
  const safeName = file.name.replace(/[^a-z0-9.\-_]/gi, "_");
  const { url } = await getStorage().upload(
    `schools/${schoolSlug}/${category}/${entityId}/${safeName}`,
    file,
  );
  return url;
}

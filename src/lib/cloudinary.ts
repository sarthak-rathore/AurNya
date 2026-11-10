import { createHash } from 'node:crypto';

// Signed uploads: the browser sends the picture straight to Cloudinary; our server only signs the request, so the secret never leaves the server.
export const UPLOAD_FOLDER = 'aurnya';
export const UPLOAD_FORMATS = 'jpg,jpeg,png,webp,avif';

export function cloudinaryConfig(env: Record<string, string | undefined> = process.env) {
  const cloudName = env.CLOUDINARY_CLOUD_NAME?.trim(); const apiKey = env.CLOUDINARY_API_KEY?.trim(); const apiSecret = env.CLOUDINARY_API_SECRET?.trim();
  return cloudName && apiKey && apiSecret ? { cloudName, apiKey, apiSecret } : null;
}

/** Cloudinary's rule: sort the parameters, join as a=b&c=d, append the secret, SHA-1. */
export function signParams(params: Record<string, string | number>, apiSecret: string): string {
  const s = Object.keys(params).sort().map((k) => `${k}=${params[k]}`).join('&');
  return createHash('sha1').update(s + apiSecret).digest('hex');
}

export function uploadSignature(cfg: NonNullable<ReturnType<typeof cloudinaryConfig>>, now = Date.now()) {
  const timestamp = Math.floor(now / 1000);
  const signed = { allowed_formats: UPLOAD_FORMATS, folder: UPLOAD_FOLDER, timestamp };
  return { cloudName: cfg.cloudName, apiKey: cfg.apiKey, timestamp, folder: UPLOAD_FOLDER, allowedFormats: UPLOAD_FORMATS, signature: signParams(signed, cfg.apiSecret) };
}

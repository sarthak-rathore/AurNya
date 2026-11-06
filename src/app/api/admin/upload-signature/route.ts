import { NextResponse } from 'next/server';
import { jsonError, requireAdminApi } from '@/lib/admin-auth';
import { cloudinaryConfig, uploadSignature } from '@/lib/cloudinary';

export async function POST(req: Request) {
  const a = await requireAdminApi(req); if (!a.ok) return a.res;
  const cfg = cloudinaryConfig();
  if (!cfg) return jsonError(503, 'Picture upload is not set up. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET, or paste a picture link instead.');
  return NextResponse.json(uploadSignature(cfg), { headers: { 'Cache-Control': 'no-store' } });
}

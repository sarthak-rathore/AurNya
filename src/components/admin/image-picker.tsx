'use client';
import Image from 'next/image';
import { useRef, useState } from 'react';
import { isAllowedImageUrl } from '@/lib/image-url';
import { adminFetch } from './api';
import { btnOutline, input } from './ui';

const MAX_BYTES = 8 * 1024 * 1024;
const OK_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

/** Uploads one picture straight to Cloudinary using a short-lived signature from our server. Returns its https address. */
export async function uploadPicture(file: File): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  if (!OK_TYPES.includes(file.type)) return { ok: false, error: 'Please choose a JPG, PNG, WebP or AVIF picture.' };
  if (file.size > MAX_BYTES) return { ok: false, error: 'That picture is larger than 8 MB. Please shrink it first.' };
  const sig = await adminFetch<{ cloudName: string; apiKey: string; timestamp: number; folder: string; allowedFormats: string; signature: string }>('/api/admin/upload-signature', 'POST');
  if (!sig.ok) return sig;
  const s = sig.data; const form = new FormData();
  form.append('file', file); form.append('api_key', s.apiKey); form.append('timestamp', String(s.timestamp)); form.append('folder', s.folder); form.append('allowed_formats', s.allowedFormats); form.append('signature', s.signature);
  try {
    const r = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(s.cloudName)}/image/upload`, { method: 'POST', body: form });
    const d = await r.json() as { secure_url?: string; error?: { message?: string } };
    if (!r.ok || !d.secure_url) return { ok: false, error: d.error?.message ?? 'The upload did not work. Please try again.' };
    return { ok: true, url: d.secure_url };
  } catch { return { ok: false, error: 'Could not reach the picture service. Check your connection.' }; }
}

/** Upload a picture or paste an address. Calls onPick with an address the store accepts. */
export function PictureAdder({ onPick, label = 'Add a picture' }: { onPick: (url: string) => void; label?: string }) {
  const file = useRef<HTMLInputElement>(null); const [busy, setBusy] = useState(false); const [err, setErr] = useState(''); const [link, setLink] = useState('');
  async function chosen(f: File | undefined) { if (!f) return; setBusy(true); setErr(''); const r = await uploadPicture(f); setBusy(false); if (file.current) file.current.value = ''; if (r.ok) onPick(r.url); else setErr(r.error); }
  function addLink() { const v = link.trim(); if (!isAllowedImageUrl(v)) { setErr('Use a picture uploaded here, a Cloudinary link (https://res.cloudinary.com/…), or a file in your /images folder such as /images/ring.png.'); return; } setErr(''); setLink(''); onPick(v); }
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <input ref={file} type="file" accept={OK_TYPES.join(',')} className="sr-only" id={`up-${label}`} onChange={(e) => chosen(e.target.files?.[0])} />
        <label htmlFor={`up-${label}`} className={`${btnOutline} cursor-pointer ${busy ? 'pointer-events-none opacity-50' : ''}`}>{busy ? 'Uploading…' : `⬆ ${label}`}</label>
        <span className="text-xs text-muted">or paste a link:</span>
        <input value={link} onChange={(e) => setLink(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addLink(); } }} placeholder="https://res.cloudinary.com/… or /images/ring.png" aria-label="Picture link" className={`${input} !w-auto min-w-0 flex-1`} />
        <button type="button" onClick={addLink} className={btnOutline}>Use link</button>
      </div>
      {err && <p role="alert" className="text-sm text-danger">{err}</p>}
    </div>
  );
}

export const Thumb = ({ src, alt = '', size = 64 }: { src: string; alt?: string; size?: number }) => (
  isAllowedImageUrl(src) ? <Image src={src} alt={alt} width={size} height={size} className="rounded-lg object-cover" style={{ width: size, height: size }} /> : <span className="grid place-items-center rounded-lg bg-charcoal/10 text-[10px] text-muted" style={{ width: size, height: size }}>no pic</span>
);

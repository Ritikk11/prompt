import { NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { getRequestUser, isCurrentUserAdmin } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase-admin';

type R2BucketLike = {
  put: (
    key: string,
    value: ReadableStream | ArrayBuffer | ArrayBufferView | string | Blob,
    options?: { httpMetadata?: { contentType?: string; cacheControl?: string } }
  ) => Promise<unknown>;
};

const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;
const SAFE_PRESETS = new Set(['prompt', 'thumbnail', 'reference', 'avatar', 'logo', 'aistudio']);
// Only raster formats. file.type is caller-controlled; without this allowlist,
// image/svg+xml passes the 'image/' prefix check and the uploaded file would be
// served back as active SVG (script execution on the uploads origin).
const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
};

// Header validation so a renamed text/html / SVG file can't ride through on
// a spoofed Content-Type or a tiny magic-byte prefix.
function sniffImageType(bytes: Uint8Array): string | null {
  if (bytes.length >= 33 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
    && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
    && bytes[12] === 0x49 && bytes[13] === 0x48 && bytes[14] === 0x44 && bytes[15] === 0x52) {
    const width = new DataView(bytes.buffer, bytes.byteOffset + 16, 8).getUint32(0);
    const height = new DataView(bytes.buffer, bytes.byteOffset + 16, 8).getUint32(4);
    return width > 0 && height > 0 ? 'image/png' : null;
  }
  if (bytes.length >= 10 && bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46
    && (bytes[3] === 0x38 && (bytes[4] === 0x37 || bytes[4] === 0x39) && bytes[5] === 0x61)) {
    const width = bytes[6] | (bytes[7] << 8);
    const height = bytes[8] | (bytes[9] << 8);
    return width > 0 && height > 0 ? 'image/gif' : null;
  }
  if (bytes.length >= 12) {
    if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46
      && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
      && bytes.length >= 16) {
      const chunk = String.fromCharCode(bytes[12], bytes[13], bytes[14], bytes[15]);
      return ['VP8 ', 'VP8L', 'VP8X'].includes(chunk) ? 'image/webp' : null;
    }
    if (bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70) {
      const brands = new TextDecoder('ascii').decode(bytes.slice(8, Math.min(bytes.length, 64)));
      return /\b(?:avif|avis)\b/.test(brands) ? 'image/avif' : null;
    }
  }
  if (bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    for (let i = 2; i + 9 < bytes.length;) {
      if (bytes[i] !== 0xff) return null;
      const marker = bytes[i + 1];
      if (marker === 0xd9 || marker === 0xda) break;
      const length = (bytes[i + 2] << 8) + bytes[i + 3];
      if (length < 2 || i + 2 + length > bytes.length) break;
      if ((marker >= 0xc0 && marker <= 0xc3) || (marker >= 0xc5 && marker <= 0xc7) || (marker >= 0xc9 && marker <= 0xcb) || (marker >= 0xcd && marker <= 0xcf)) {
        const height = (bytes[i + 5] << 8) + bytes[i + 6];
        const width = (bytes[i + 7] << 8) + bytes[i + 8];
        return width > 0 && height > 0 ? 'image/jpeg' : null;
      }
      i += 2 + length;
    }
    return null;
  }
  return null;
}

function isMissingTableError(error: unknown) {
  const message = typeof error === 'object' && error && 'message' in error ? String((error as any).message) : '';
  const code = typeof error === 'object' && error && 'code' in error ? String((error as any).code) : '';
  return code === '42P01' || code === 'PGRST205' || message.includes('Could not find the table') || message.includes('does not exist');
}

async function reserveUploadSlot(admin: ReturnType<typeof createAdminClient>, userId: string) {
  const windowMs = 10 * 60 * 1000;
  const since = new Date(Date.now() - windowMs).toISOString();
  const { count, error: countError } = await admin
    .from('upload_events')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', since);

  if (countError) {
    if (isMissingTableError(countError)) {
      return { error: 'Upload rate limiting is not configured. Run the security hardening migration.' };
    }
    return { error: countError.message };
  }

  if ((count || 0) >= 30) {
    return { limited: true };
  }

  const { error: insertError } = await admin
    .from('upload_events')
    .insert({ user_id: userId });
  if (insertError) {
    return { error: insertError.message };
  }

  return { ok: true };
}

function extensionFor(file: File) {
  const fromName = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '');
  const allowed = ALLOWED_IMAGE_TYPES[file.type];
  if (allowed) return allowed;
  if (fromName && Object.values(ALLOWED_IMAGE_TYPES).includes(fromName)) return fromName;
  return 'webp';
}

function randomId() {
  return `${Date.now()}-${crypto.randomUUID()}`;
}

// Sanitize a caller-supplied name into a safe slug for the object key. Never
// trust this value for path building without stripping separators etc.
function slugifyName(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function shortId() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

async function getUploadsBucket() {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const maybeEnv = env as CloudflareEnv & { UPLOADS?: R2BucketLike };
    return maybeEnv.UPLOADS || null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const admin = createAdminClient();
  const { data: globalSettingsRow } = await admin.from('settings').select('data').eq('id', 'global').maybeSingle();
  const globalSettings = (globalSettingsRow?.data || {}) as any;
  
  if (globalSettings.maintenanceMode) {
    if (!(await isCurrentUserAdmin(request))) {
      return NextResponse.json({ error: 'Service unavailable during maintenance' }, { status: 503 });
    }
  }

  const { data: { user } } = await getRequestUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const uploadSlot = await reserveUploadSlot(admin, user.id);
  if (uploadSlot.limited) {
    return NextResponse.json({ error: 'Upload limit reached. Try again in a few minutes.' }, { status: 429 });
  }
  if (uploadSlot.error) {
    return NextResponse.json({ error: uploadSlot.error }, { status: 503 });
  }

  const formData = await request.formData();
  const file = formData.get('file');
  const rawPreset = String(formData.get('preset') || 'prompt');
  const preset = SAFE_PRESETS.has(rawPreset) ? rawPreset : 'prompt';
  const rawName = formData.get('name');
  const nameSlug = typeof rawName === 'string' ? slugifyName(rawName) : '';

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Missing image file' }, { status: 400 });
  }
  if (!ALLOWED_IMAGE_TYPES[file.type]) {
    return NextResponse.json({ error: 'Only JPEG/PNG/WebP/GIF/AVIF images are allowed' }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: 'Image is too large' }, { status: 413 });
  }
  // Sniff magic bytes; a spoofed type (e.g. HTML renamed .png) is rejected.
  {
    const head = new Uint8Array(await file.slice(0, Math.min(file.size, 65536)).arrayBuffer());
    const sniffed = sniffImageType(head);
    if (!sniffed || sniffed !== file.type) {
      return NextResponse.json({ error: 'File content is not a valid image' }, { status: 400 });
    }
  }

  const bucket = await getUploadsBucket();
  if (!bucket) {
    return NextResponse.json(
      { error: 'Cloudflare R2 uploads are not configured for this environment.' },
      { status: 503 }
    );
  }

  const leaf = nameSlug ? `${nameSlug}-${shortId()}` : randomId();
  const key = `${preset}s/${leaf}.${extensionFor(file)}`;
  await bucket.put(key, file.stream(), {
    httpMetadata: {
      contentType: file.type || 'image/webp',
      cacheControl: 'public, max-age=31536000, immutable',
    },
  });

  const publicBaseUrl = (process.env.CLOUDFLARE_UPLOAD_PUBLIC_URL || 'https://uploads.aipromptmatrix.in').replace(/\/$/, '');
  return NextResponse.json({ url: `${publicBaseUrl}/${key}`, key, provider: 'cloudflare' });
}

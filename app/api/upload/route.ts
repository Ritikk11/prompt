import { NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { getRequestUser } from '@/lib/admin-auth';

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

// Magic-byte sniffing so a renamed text/html / SVG file can't ride through on
// a spoofed Content-Type. Falls back to the (allowlisted) declared type when
// the format can't be sniffed (e.g. AVIF variants).
function sniffImageType(bytes: Uint8Array): string | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'image/png';
  if (bytes.length >= 6 && bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) return 'image/gif';
  if (bytes.length >= 12) {
    if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46
      && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) return 'image/webp';
    // ISOBMFF container (AVIF/HEIC): 'ftyp' box at offset 4
    if (bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70) return 'image/avif';
  }
  return null;
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
  const { data: { user } } = await getRequestUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
    const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
    const sniffed = sniffImageType(head);
    if (!sniffed) {
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

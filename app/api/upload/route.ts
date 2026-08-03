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

function extensionFor(file: File) {
  const fromName = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (fromName) return fromName.slice(0, 8);
  if (file.type === 'image/png') return 'png';
  if (file.type === 'image/jpeg') return 'jpg';
  if (file.type === 'image/gif') return 'gif';
  if (file.type === 'image/avif') return 'avif';
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
  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Only image uploads are allowed' }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: 'Image is too large' }, { status: 413 });
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

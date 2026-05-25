import { createClient } from '@supabase/supabase-js';
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'images';
const dryRun = process.argv.includes('--dry-run');

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running this script.');
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function parseDataUrl(value) {
  if (typeof value !== 'string') return null;
  const match = value.match(/^data:([^;]+);base64,(.*)$/);
  if (!match) return null;

  const [, contentType, base64] = match;
  const bytes = Buffer.from(base64, 'base64');
  if (!bytes.length) return null;

  const extensionByType = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/svg+xml': 'svg',
    'image/avif': 'avif',
  };

  return {
    bytes,
    contentType,
    extension: extensionByType[contentType] || 'bin',
    hash: createHash('sha256').update(bytes).digest('hex').slice(0, 16),
  };
}

async function ensureBucket() {
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) throw listError;
  if (buckets?.some((item) => item.name === bucket)) return;
  if (dryRun) return;

  const { error } = await supabase.storage.createBucket(bucket, {
    public: true,
    fileSizeLimit: 10 * 1024 * 1024,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'image/avif'],
  });
  if (error) throw error;
}

async function uploadDataUrl(dataUrl, storagePath) {
  const parsed = parseDataUrl(dataUrl);
  if (!parsed) return dataUrl;

  const finalPath = `${storagePath}-${parsed.hash}.${parsed.extension}`;
  if (!dryRun) {
    const { error } = await supabase.storage
      .from(bucket)
      .upload(finalPath, parsed.bytes, {
        contentType: parsed.contentType,
        upsert: true,
      });
    if (error) throw error;
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(finalPath);
  return data.publicUrl;
}

async function migratePost(row) {
  const post = structuredClone(row.data);
  let changed = false;
  const uploads = [];

  if (parseDataUrl(post.thumbnailUrl)) {
    post.thumbnailUrl = await uploadDataUrl(post.thumbnailUrl, `migrated/posts/${row.id}/thumbnail`);
    changed = true;
    uploads.push('thumbnailUrl');
  }

  if (Array.isArray(post.images)) {
    for (let index = 0; index < post.images.length; index += 1) {
      const image = post.images[index];
      if (parseDataUrl(image?.url)) {
        image.url = await uploadDataUrl(image.url, `migrated/posts/${row.id}/images/${image.id || index}`);
        changed = true;
        uploads.push(`images.${index}.url`);
      }
    }
  }

  if (Array.isArray(post.referenceImages)) {
    for (let index = 0; index < post.referenceImages.length; index += 1) {
      if (parseDataUrl(post.referenceImages[index])) {
        post.referenceImages[index] = await uploadDataUrl(post.referenceImages[index], `migrated/posts/${row.id}/reference/${index}`);
        changed = true;
        uploads.push(`referenceImages.${index}`);
      }
    }
  }

  return { changed, data: post, uploads };
}

async function migrateSettings(row) {
  const settings = structuredClone(row.data);
  let changed = false;
  const uploads = [];

  if (parseDataUrl(settings.siteLogo)) {
    settings.siteLogo = await uploadDataUrl(settings.siteLogo, `migrated/settings/${row.id}/site-logo`);
    changed = true;
    uploads.push('siteLogo');
  }

  if (settings.toolDetails && typeof settings.toolDetails === 'object') {
    for (const [tool, details] of Object.entries(settings.toolDetails)) {
      if (parseDataUrl(details?.logo)) {
        details.logo = await uploadDataUrl(details.logo, `migrated/settings/${row.id}/tools/${tool.replace(/[^a-z0-9-]+/gi, '-').toLowerCase()}/logo`);
        changed = true;
        uploads.push(`toolDetails.${tool}.logo`);
      }
    }
  }

  return { changed, data: settings, uploads };
}

async function fetchRows(table) {
  const { data, error } = await supabase.from(table).select('id,data');
  if (error) throw error;
  return data || [];
}

async function backupRows(rowsByTable) {
  await mkdir('backups', { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const file = path.join('backups', `base64-image-migration-${stamp}.json`);
  await writeFile(file, JSON.stringify(rowsByTable, null, 2));
  return file;
}

async function main() {
  await ensureBucket();

  const rowsByTable = {
    posts: await fetchRows('posts'),
    settings: await fetchRows('settings'),
  };
  const backupFile = await backupRows(rowsByTable);

  const changed = {
    posts: [],
    settings: [],
  };

  for (const row of rowsByTable.posts) {
    const result = await migratePost(row);
    if (!result.changed) continue;
    changed.posts.push({ id: row.id, uploads: result.uploads });
    if (!dryRun) {
      const { error } = await supabase.from('posts').update({ data: result.data }).eq('id', row.id);
      if (error) throw error;
    }
  }

  for (const row of rowsByTable.settings) {
    const result = await migrateSettings(row);
    if (!result.changed) continue;
    changed.settings.push({ id: row.id, uploads: result.uploads });
    if (!dryRun) {
      const { error } = await supabase.from('settings').update({ data: result.data }).eq('id', row.id);
      if (error) throw error;
    }
  }

  console.log(JSON.stringify({ dryRun, bucket, backupFile, changed }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

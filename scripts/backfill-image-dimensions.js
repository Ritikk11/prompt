const { loadEnvConfig } = require('@next/env');
loadEnvConfig(process.cwd());

const { createClient } = require('@supabase/supabase-js');
const sharp = require('sharp');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing Supabase credentials in environment.');
  process.exit(1);
}

const DRY_RUN = process.argv.includes('--dry-run');

const client = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function resolveImageUrl(url) {
  if (!url) return '';
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  const uploadOrigin = (process.env.CLOUDFLARE_UPLOAD_PUBLIC_URL || 'https://uploads.aipromptmatrix.in').replace(/\/$/, '');
  return `${uploadOrigin}/${trimmed.replace(/^\/+/, '')}`;
}

// Reads intrinsic dimensions from the image header only (sharp does not decode
// the full raster for metadata), so this is a light one-time pass. Results are
// memoized per URL because a post's thumbnail is frequently images[0].url.
const dimsCache = new Map();
async function getDimensions(url) {
  if (!url) return undefined;
  if (dimsCache.has(url)) return dimsCache.get(url);
  let result;
  try {
    const res = await fetch(resolveImageUrl(url));
    if (!res.ok) {
      console.warn(`  fetch failed (${res.status}) for ${url}`);
    } else {
      const buf = Buffer.from(await res.arrayBuffer());
      const meta = await sharp(buf).metadata();
      if (meta.width > 0 && meta.height > 0) {
        result = { width: meta.width, height: meta.height };
      }
    }
  } catch (err) {
    console.warn(`  error reading ${url}: ${err.message}`);
  }
  dimsCache.set(url, result);
  return result;
}

async function main() {
  console.log(`Fetching posts...${DRY_RUN ? ' (dry run)' : ''}`);
  const { data: posts, error } = await client.from('posts').select('id, data');
  if (error) {
    console.error('Failed to load posts:', error.message);
    process.exit(1);
  }

  console.log(`Found ${posts.length} posts.`);
  let updated = 0;
  let alreadyComplete = 0;
  let skipped = 0;

  for (let i = 0; i < posts.length; i++) {
    const row = posts[i];
    const data = row.data || {};
    const title = data.title || row.id;
    let changed = false;

    // Per-image dims (describe each image's primary `url`).
    const images = Array.isArray(data.images) ? data.images : [];
    for (const img of images) {
      if (!img || !img.url) continue;
      if (img.width > 0 && img.height > 0) continue;
      const dims = await getDimensions(img.url);
      if (dims) {
        img.width = dims.width;
        img.height = dims.height;
        changed = true;
      }
    }

    // Standalone thumbnail dims (when thumbnailUrl is its own upload).
    if (data.thumbnailUrl && !(data.thumbnailWidth > 0 && data.thumbnailHeight > 0)) {
      const dims = await getDimensions(data.thumbnailUrl);
      if (dims) {
        data.thumbnailWidth = dims.width;
        data.thumbnailHeight = dims.height;
        changed = true;
      }
    }

    if (!changed) {
      // Either everything already had dims, or nothing could be resolved.
      const hasAny = images.some((im) => im?.width > 0) || data.thumbnailWidth > 0;
      if (hasAny) alreadyComplete++;
      else skipped++;
      continue;
    }

    if (DRY_RUN) {
      console.log(`[DRY] (${i + 1}) "${title}" would update dimensions.`);
      updated++;
      continue;
    }

    const { error: updateError } = await client
      .from('posts')
      .update({ data })
      .eq('id', row.id);

    if (updateError) {
      console.error(`[ERROR] "${title}": ${updateError.message}`);
      skipped++;
    } else {
      updated++;
      console.log(`[OK] (${updated}) "${title}"`);
    }
  }

  console.log('\n--- Backfill Summary ---');
  console.log(`Total posts:        ${posts.length}`);
  console.log(`Updated:            ${updated}`);
  console.log(`Already had dims:   ${alreadyComplete}`);
  console.log(`Skipped / no image: ${skipped}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});

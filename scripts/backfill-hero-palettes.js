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

const client = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function channelToHex(value) {
  return Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, '0');
}

function toHex(color) {
  return `#${channelToHex(color.r)}${channelToHex(color.g)}${channelToHex(color.b)}`;
}

function saturation({ r, g, b }) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return max === 0 ? 0 : (max - min) / max;
}

function luminance({ r, g, b }) {
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

function distance(a, b) {
  return Math.hypot(a.r - b.r, a.g - b.g, a.b - b.b);
}

function darken(color) {
  const light = luminance(color);
  const factor = light > 0.55 ? 0.24 : light > 0.3 ? 0.34 : 0.52;
  return { r: color.r * factor, g: color.g * factor, b: color.b * factor };
}

function paletteFromPixels(data) {
  const buckets = new Map();
  let totalR = 0;
  let totalG = 0;
  let totalB = 0;
  let totalWeight = 0;

  for (let index = 0; index < data.length; index += 4) {
    const alpha = data[index + 3] / 255;
    if (alpha < 0.5) continue;
    const r = data[index];
    const g = data[index + 1];
    const b = data[index + 2];
    const light = luminance({ r, g, b });
    if (light < 0.025 || light > 0.985) continue;

    totalR += r * alpha;
    totalG += g * alpha;
    totalWeight += alpha;

    const qr = Math.min(240, Math.round(r / 24) * 24);
    const qg = Math.min(240, Math.round(g / 24) * 24);
    const qb = Math.min(240, Math.round(b / 24) * 24);
    const key = `${qr},${qg},${qb}`;
    const current = buckets.get(key) || { r: 0, g: 0, b: 0, count: 0 };
    current.r += r;
    current.g += g;
    current.b += b;
    current.count += 1;
    buckets.set(key, current);
  }

  if (!totalWeight || buckets.size === 0) return undefined;

  const candidates = Array.from(buckets.values())
    .map(bucket => ({
      color: { r: bucket.r / bucket.count, g: bucket.g / bucket.count, b: bucket.b / bucket.count },
      count: bucket.count,
    }))
    .filter(({ color }) => luminance(color) > 0.08 && luminance(color) < 0.92)
    .sort((a, b) => {
      const score = (entry) => entry.count * (0.65 + saturation(entry.color) * 1.35);
      return score(b) - score(a);
    });

  const average = { r: totalR / totalWeight, g: totalG / totalWeight, b: totalB / totalWeight };
  const primary = candidates[0]?.color || average;
  const secondary = candidates.find(candidate => distance(primary, candidate.color) >= 72)?.color
    || candidates[1]?.color
    || average;

  return {
    primary: toHex(primary),
    secondary: toHex(secondary),
    background: toHex(darken(average)),
  };
}

function resolveImageUrl(url) {
  if (!url) return '';
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  const uploadOrigin = (process.env.CLOUDFLARE_UPLOAD_PUBLIC_URL || 'https://uploads.aipromptmatrix.in').replace(/\/$/, '');
  return `${uploadOrigin}/${trimmed.replace(/^\/+/, '')}`;
}

async function extractPaletteFromUrl(imageUrl) {
  try {
    const fullUrl = resolveImageUrl(imageUrl);
    const res = await fetch(fullUrl);
    if (!res.ok) {
      console.warn(`Failed to fetch image ${fullUrl}: HTTP ${res.status}`);
      return undefined;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    const { data } = await sharp(buf)
      .resize(48, 48, { fit: 'fill' })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    return paletteFromPixels(data);
  } catch (err) {
    console.warn(`Error processing image ${imageUrl}:`, err.message);
    return undefined;
  }
}

async function main() {
  console.log('Fetching posts from database...');
  const { data: posts, error } = await client.from('posts').select('id, data');
  if (error) {
    console.error('Failed to load posts:', error.message);
    process.exit(1);
  }

  console.log(`Found ${posts.length} total posts.`);
  let updatedCount = 0;
  let skippedCount = 0;
  let alreadyHadPalette = 0;

  for (let i = 0; i < posts.length; i++) {
    const postRow = posts[i];
    const postData = postRow.data || {};
    const title = postData.title || postRow.id;

    if (postData.heroPalette && postData.heroPalette.primary && postData.heroPalette.background) {
      alreadyHadPalette++;
      continue;
    }

    const sourceImage = postData.thumbnailUrl || postData.images?.[0]?.url;
    if (!sourceImage) {
      console.warn(`[SKIP] Post #${i + 1} "${title}" has no thumbnail or images.`);
      skippedCount++;
      continue;
    }

    const palette = await extractPaletteFromUrl(sourceImage);
    if (!palette) {
      console.warn(`[SKIP] Post #${i + 1} "${title}" could not extract palette.`);
      skippedCount++;
      continue;
    }

    const updatedData = { ...postData, heroPalette: palette };
    const { error: updateError } = await client
      .from('posts')
      .update({ data: updatedData })
      .eq('id', postRow.id);

    if (updateError) {
      console.error(`[ERROR] Failed to update post "${title}":`, updateError.message);
      skippedCount++;
    } else {
      updatedCount++;
      console.log(`[OK] (${updatedCount}) "${title}": primary=${palette.primary}, secondary=${palette.secondary}, bg=${palette.background}`);
    }
  }

  console.log('\n--- Backfill Summary ---');
  console.log(`Total posts: ${posts.length}`);
  console.log(`Updated with heroPalette: ${updatedCount}`);
  console.log(`Already had palette: ${alreadyHadPalette}`);
  console.log(`Skipped / failed: ${skippedCount}`);
}

main().catch((err) => {
  console.error('Fatal error in backfill script:', err);
  process.exit(1);
});

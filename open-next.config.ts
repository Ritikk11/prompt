import { defineCloudflareConfig } from '@opennextjs/cloudflare';
import r2IncrementalCache from '@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache';
import { withRegionalCache } from '@opennextjs/cloudflare/overrides/incremental-cache/regional-cache';
import purgeCache from '@opennextjs/cloudflare/overrides/cache-purge/index';
import doQueue from '@opennextjs/cloudflare/overrides/queue/do-queue';
import doShardedTagCache from '@opennextjs/cloudflare/overrides/tag-cache/do-sharded-tag-cache';

export default defineCloudflareConfig({
  // Serve repeat reads from the local data center instead of waiting for R2.
  // Keep tag validation enabled so admin revalidation remains authoritative.
  incrementalCache: withRegionalCache(r2IncrementalCache, {
    mode: 'short-lived',
    bypassTagCacheOnCacheHit: true,
  }),
  // revalidatePath/revalidateTag need a real tag cache; without one they are
  // silent no-ops and pages only refresh when their ISR TTL expires.
  tagCache: doShardedTagCache({ baseShardSize: 12 }),
  // Re-renders stale ISR pages in the background when a request hits them.
  queue: doQueue,
  // Cache interception bypasses the Next handler for cacheable responses so
  // the Worker serves them straight from the R2 incremental cache. cachePurge
  // also invalidates the Cloudflare edge cache on revalidatePath/revalidateTag
  // so on-demand revalidation is visible immediately, not after the edge TTL.
  enableCacheInterception: true,
  cachePurge: purgeCache({ type: 'direct' }),
});

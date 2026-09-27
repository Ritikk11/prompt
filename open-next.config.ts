import { defineCloudflareConfig } from '@opennextjs/cloudflare';
import r2IncrementalCache from '@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache';
import { withRegionalCache } from '@opennextjs/cloudflare/overrides/incremental-cache/regional-cache';
import purgeCache from '@opennextjs/cloudflare/overrides/cache-purge/index';
import doQueue from '@opennextjs/cloudflare/overrides/queue/do-queue';
import doShardedTagCache from '@opennextjs/cloudflare/overrides/tag-cache/do-sharded-tag-cache';

export default defineCloudflareConfig({
  // Serve repeat reads directly from the local data center (BOM/DEL/MAA/BLR in India).
  // bypassTagCacheOnCacheHit: true prevents blocking on a cross-continental RPC round-trip
  // to the US Durable Object on every regional cache hit, delivering instant ~15ms responses.
  // Direct cache purge (cachePurge below) handles on-demand admin revalidations immediately.
  incrementalCache: withRegionalCache(r2IncrementalCache, {
    mode: 'long-lived',
    defaultLongLivedTtlSec: 2592000,
    bypassTagCacheOnCacheHit: true,
  }),
  // revalidatePath/revalidateTag need a real tag cache; without one they are
  // silent no-ops and pages only refresh when their ISR TTL expires.
  tagCache: doShardedTagCache({
    baseShardSize: 12,
    regionalCache: true,
    regionalCacheTtlSec: 10,
    regionalCacheDangerouslyPersistMissingTags: true,
  }),
  // Re-renders stale ISR pages in the background when a request hits them.
  queue: doQueue,
  // Cache interception bypasses the Next handler for cacheable responses so
  // the Worker serves them straight from the R2 incremental cache. cachePurge
  // also invalidates the Cloudflare edge cache on revalidatePath/revalidateTag
  // so on-demand revalidation is visible immediately, not after the edge TTL.
  enableCacheInterception: true,
  cachePurge: purgeCache({ type: 'direct' }),
});

import { defineCloudflareConfig } from '@opennextjs/cloudflare';
import r2IncrementalCache from '@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache';
import doQueue from '@opennextjs/cloudflare/overrides/queue/do-queue';
import doShardedTagCache from '@opennextjs/cloudflare/overrides/tag-cache/do-sharded-tag-cache';

export default defineCloudflareConfig({
  incrementalCache: r2IncrementalCache,
  // revalidatePath/revalidateTag need a real tag cache; without one they are
  // silent no-ops and pages only refresh when their ISR TTL expires.
  tagCache: doShardedTagCache({ baseShardSize: 12 }),
  // Re-renders stale ISR pages in the background when a request hits them.
  queue: doQueue,
});

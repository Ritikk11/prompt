# Navigation and cache changes — 13 September 2026

## Findings

- Public navigation had `prefetch={false}` throughout. This delays route loading until the click.
- Next 16.3.5's installed `links.js` reschedules visible links when the router tree, next URL, or cache invalidation changes. There is no application `router.prefetch` polling loop in the inspected code. The original production loop is not conclusively reproduced because the deployed version already disables prefetch.
- The live `/tool/Gemini` URL returns a 301 to `/tool/gemini`, including for RSC requests. Generated discovery links used display-name casing, introducing an unnecessary round trip and separate client cache identities.
- Individual live samples from this machine: homepage HTML first byte 1.92s (`x-nextjs-cache: HIT`), blog 2.19s (`x-opennext-cache: HIT`), guides 4.41s (`x-opennext-cache: HIT`), lowercase Gemini RSC 1.95s (`x-opennext-cache: HIT`). These include network latency and are samples, not a benchmark or attribution of time to R2 alone. No CDN `cf-cache-status` header was present on these responses.
- The application reads its incremental cache through an R2 binding. Cache Reserve does not automatically accelerate that binding. Cloudflare also excludes transformed image variants and public R2 custom-domain requests from Reserve; eligible responses need at least 10 hours of freshness and a Content-Length header. The sampled HTML/RSC responses were chunked without Content-Length.

## Implemented

- `PrefetchLink` keeps Next's navigation and router cache, but controls prefetch scheduling itself. Public content links prefetch after a short viewport dwell. Header/footer links warm on hover, keyboard focus, or touch.
- One shared policy deduplicates URLs across cards, remounts, and routes. Viewport warming happens at most once per URL per document, with a 48-URL document budget; further links still warm on intent. Intent entries are bounded to 256 URLs.
- Fresh prefetches are reused for five minutes, matching the configured static client cache TTL. Invalidation only marks an entry stale: it never schedules another request. A new intent can retry after a 30-second minimum cooldown.
- Prefetch respects offline, hidden-tab, data-saver, and 2G conditions. Private/action routes, external destinations, downloads, new-tab targets, and the current page are skipped.
- Tool/tag links use lowercase encoded paths and preserve query strings/fragments. Other route names remain unchanged.
- OpenNext now uses its supported short-lived regional cache wrapper in front of R2. Tag checks stay enabled, and existing purge/queue configuration remains in place. This removes foreground R2 reads on regional hits; tag-store latency and background R2 refreshes can remain.

Next can make more than one RSC request for a single prefetch (route discovery plus payload). The guarantee here is bounded scheduling without a continuous re-prefetch cycle, not exactly one HTTP request for every route. Intent after cache expiration can legitimately fetch again.

## Validation and rollout

- Nine policy regression tests: `node --test tests/prefetch-policy.test.mjs` (Node 22.18+ or 24).
- TypeScript check, focused ESLint, and production Next build.
- Browser checks use the production build, since prefetch is intentionally disabled in development.
- Deploy through the normal OpenNext build/deploy workflow, then compare navigation and response timings from the same location. Regional cache performance and cross-region admin invalidation must be verified on Cloudflare; a local Next server cannot measure them.
- No Cloudflare account settings were changed. No production deployment was performed.

## Sources

- [Next.js prefetching](https://nextjs.org/docs/app/guides/prefetching)
- [OpenNext performance](https://opennext.js.org/cloudflare/perf)
- [OpenNext caching](https://opennext.js.org/cloudflare/caching)
- [Cloudflare Cache Reserve eligibility and limits](https://developers.cloudflare.com/cache/advanced-configuration/cache-reserve/)

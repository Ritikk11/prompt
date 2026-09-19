# AI PromptMatrix security audit — 12 September 2026

**Overall assessment: urgent remediation required.** A live, unauthenticated credential disclosure is confirmed. The homepage exposes integration credentials, and the public database API exposes additional credentials. This audit also reproduced authorization, script injection, redirect, and abuse-control defects locally.

Website: https://aipromptmatrix.in. Repository revision: `24d36d53897371e1029f32377a8015f083b5e439`. Scope: the Next.js application, its 14 API route files, supplied Supabase schema/migrations, Cloudflare/OpenNext configuration, deployment workflow, dependency lockfile, targeted secret/history checks, and bounded live requests.

Application code, production data, connections, and credentials were not changed. Live testing used public reads and empty unauthenticated requests to protected endpoints. Destructive actions, uploads, account changes, and exploit payloads were tested only with local fixtures and mocked external services. Credential values are excluded from this report and saved evidence.

## Findings and priority

Severity reflects impact; the confirmation column distinguishes live exposure from local reproduction and deployment-dependent risk.

| ID | Severity | Finding | Confirmation |
|---|---|---|---|
| F01 | Critical | Public integration credentials in settings and rendered pages | Live |
| F02 | High | Stored script injection through JSON-LD and raw Markdown | Actual page/component rendering reproduced locally |
| F03 | High | Pinterest callback can replace the connection without login or OAuth state | Actual route reproduced with mocked provider |
| F04 | High | Submissions can overwrite existing posts without an owner | Actual route reproduced; submissions currently disabled |
| F05 | High priority; critical upstream advisories | Outdated dependencies, including Next.js | Lockfile and current advisory checks; production exploitability conditional |
| F06 | Medium | Upload limit stored in user-editable metadata | Actual route reproduced with mocked storage |
| F07 | Medium | Submission fields allow forged moderation/activity data | Actual route reproduced; submissions currently disabled |
| F08 | Medium | Login redirect allows external destinations | Actual helper reproduced locally |
| F09 | Medium | Anonymous, repeatable like/view writes | Actual route reproduced with mocked database |
| F10 | Low | Legacy user activity identities readable publicly | Live |

### F01 — Public credentials: close this exposure first

**Evidence.** An anonymous request to Supabase's `settings` row returned nonempty `imgbbApiKey`, `pinterestSettings.appSecret`, `pinterestSettings.accessToken`, and `pinterestSettings.refreshToken`, as well as the administrator email list. No signed-in account or service-role credential was used: the request used the public anonymous key already shipped by the application.

The ordinary homepage HTML contained the same ImgBB key, Pinterest app secret, and Pinterest access token. These values were also found in `/admin`, `/auth/callback`, and ordinary 404 HTML. The current refresh-token value was confirmed through the database response, but did not match the sampled cached HTML. Token validity and provider permissions were not exercised.

**Cause.** [Public settings serialization](/C:/Promptmatrix/prompt-repo/lib/data.ts:730) removes only `adminEmails`; all other fields survive the object spread. [The root layout](/C:/Promptmatrix/prompt-repo/app/layout.tsx:266) passes settings into a client component. Independently, [the database policy](/C:/Promptmatrix/prompt-repo/supabase-rls-lockdown.sql:18) allows public reads of complete settings rows. Removing fields from page props alone will not close the database path.

There are also hardcoded secrets in [the Pinterest module](/C:/Promptmatrix/prompt-repo/lib/pinterest.ts:4) and [default settings](/C:/Promptmatrix/prompt-repo/lib/data.ts:146). A client component imports the Pinterest secret constant. Targeted history inspection found the Pinterest secret addition in commit `b41e597`; repository access is not required to obtain the live exposed values.

**Impact.** Visitors can obtain credentials intended for integrations. If still valid, they may exercise the granted Pinterest/ImgBB permissions. This is confirmed disclosure, not proof that a third party has already used the credentials.

**Remediation order.** Move integration secrets and administrator configuration into server-only storage; use an explicit public-settings allowlist. Remove secrets from public database rows, source defaults, and client imports. Deploy the correction and purge both Cloudflare HTML/CDN caches and OpenNext ISR caches. Then revoke/rotate the exposed Pinterest and ImgBB credentials, reconnect Pinterest using the corrected flow, and check provider activity logs. Check staging/older deployments and repository history too. Rotating credentials while continuing to publish them will expose their replacements.

**Retest.** An anonymous database request and homepage/404/auth-page responses must contain none of the private fields or their new values. Verify previously cached responses and client bundles, not just a fresh local render.

### F02 — Stored script injection in two content renderers

**JSON-LD.** [The prompt page](/C:/Promptmatrix/prompt-repo/app/[slug]/page.tsx:365) places `JSON.stringify()` output directly inside a script element. A title containing a closing script tag and a harmless marker script caused the actual page component to emit three executable marker-script elements in the local HTML parser test. The database and unrelated display components were mocked; the actual page's schema-building and rendering code ran. Similar serializers exist in the layout, article, and SEO-page components.

**Markdown.** [MarkdownRenderer](/C:/Promptmatrix/prompt-repo/components/MarkdownRenderer.tsx:291) enables raw HTML without sanitization. Rendering a fixture containing an `iframe` with script-bearing `srcdoc` preserved the executable content and omitted a sandbox. User-controlled extended descriptions reach this renderer in [PostContent](/C:/Promptmatrix/prompt-repo/components/PostContent.tsx:1600); admin AI output also uses Markdown rendering.

**Impact and conditions.** Malicious content reaching these renderers can execute in the site's origin, including in a signed-in user's browser. User submissions and automatic approval were disabled at audit time, so the ordinary visitor submission path is currently gated. Administrator publication, imported content, or future enabling of submissions remains relevant. This was not a browser exploit against the live site and does not establish existing malicious content.

**Fix.** Escape `<` to `\u003c` in every JSON-LD serializer before embedding it in HTML, following [Next.js JSON-LD guidance](https://nextjs.org/docs/app/guides/json-ld). Disable raw Markdown HTML or apply a restrictive sanitization schema after raw parsing; remove scripts, frames, `srcdoc`, event attributes, and unsafe URLs. The [react-markdown security guidance](https://github.com/remarkjs/react-markdown#security) recommends sanitizing when plugins affect safety. Add an appropriate Content Security Policy as an additional layer; no page-level CSP was present in sampled live HTML.

### F03 — Pinterest callback lacks authentication and state validation

[The callback](/C:/Promptmatrix/prompt-repo/app/api/pinterest/callback/route.ts:16) accepts a `code`, exchanges it, and updates global settings using service-role access. It neither checks an administrator session nor validates a session-bound OAuth `state`. [Authorization URL generation](/C:/Promptmatrix/prompt-repo/lib/pinterest.ts:26) does not create state either.

In the actual route test, a request with no cookies, authorization header, or state replaced the connection and returned a redirect when the mocked provider accepted the supplied code. A real attack requires a valid authorization code for this application; obtaining/using one was not attempted.

**Impact.** An attacker able to authorize the application against another Pinterest account could replace the website's connection, disrupt publishing, or redirect future publishing to that account.

**Fix/retest.** Bind the initiation to an administrator; generate cryptographically random, expiring, single-use state and bind it to that administrator's session. Validate state and session ownership before exchanging a code or writing settings. Use a configured callback origin. Requests with missing/wrong/replayed state or a non-admin session must produce no provider exchange and no database writes.

### F04 — Submissions can claim existing ownerless posts

[The ownership check](/C:/Promptmatrix/prompt-repo/app/api/posts/route.ts:137) rejects an existing record only when `authorId` is truthy and different. Existing records with no author are therefore treated as available for overwrite. The submission then writes a new `authorId` and upserts the live post.

The local test replaced an existing editorial fixture and changed its status from published to pending using an ordinary user's submission. A control fixture owned by a different user correctly returned 409. All **17 anonymously readable live posts lacked `authorId`**. Live `userProfiles` and `userSubmissions` settings were false, so this attack path is currently disabled.

**Impact.** Enabling submissions in the current implementation would expose these posts to unauthorized replacement or removal from public listings, even when approval is required.

**Fix/retest.** Reject every existing ID unless the requester is its positively verified owner and editing is intended. Reserve editorial records explicitly. Prefer server-generated IDs and insert-only submission creation. Keep pending edits out of published rows until approval. Enforce ownership atomically to avoid check-then-upsert races. Verify ownerless, other-owner, and concurrent submissions cannot replace a published record.

### F05 — Dependency advisories require an update

`npm audit` reported **13 flagged dependency entries: 1 critical, 8 high, 2 moderate, 2 low**. With development dependencies omitted, it reported **8: 1 critical, 4 high, 1 moderate, 2 low**. Entries include inherited dependency chains and do not represent 13 independently exploitable application bugs.

The lockfile and installed tree contain Next.js **15.5.22**, React/React DOM **19.2.5**, Supabase SSR **0.3.0**, Sharp **0.34.5**, and Wrangler **4.119.0**. Top-level PostCSS is 8.5.25, but a separately nested Next.js PostCSS copy is flagged.

Next.js 15.5.22 falls within two critical advisory ranges fixed in 15.5.24: [Windows-hosted remote code execution](https://github.com/vercel/next.js/security/advisories/GHSA-p293-qw3h-jr36) and [AVIF image-optimization remote code execution](https://github.com/vercel/next.js/security/advisories/GHSA-2xp9-vwfh-vxw4). The repository is configured for Cloudflare Workers, so the Windows-specific condition is not established for production. The local workspace is Windows; any exposed Windows Next.js server should be updated promptly.

The live `/_next/image` endpoint returned an image despite `images.unoptimized: true`. However, the installed OpenNext adapter uses a Cloudflare Images binding or returns original image bytes; it does not use Sharp in that handler, and the supplied configuration has no Images binding. This substantially limits the applicability of the Sharp advisory to the described production path. The live deployed dependency versions were not independently attested, and no RCE payload was attempted.

**Fix.** Update Next.js to a compatible patched release at least 15.5.24, refresh affected transitive dependencies and Cloudflare tooling, and migrate the old Supabase SSR package with authentication regression checks. Confirm the resulting lockfile and deployed build. Run audit, types, security fixtures, OAuth/session checks, and a Cloudflare staging build before deployment. Do not blindly apply forced major-version upgrades. Full package paths and advisory URLs are in the dependency evidence.

### F06 — Users can reset upload throttling

[Upload throttling](/C:/Promptmatrix/prompt-repo/app/api/upload/route.ts:107) stores its timestamps in `user.user_metadata.upload_times`. Supabase users can modify their own user metadata; it is unsuitable for security decisions, as explained in [Supabase's RLS guidance](https://supabase.com/docs/guides/database/postgres/row-level-security).

The actual route returned 429 for a fixture with 30 timestamps, then 200 after that user-editable field was cleared. Storage was mocked. Uploads also remained available to the signed-in fixture while user profiles/submissions were disabled. Counter updates are not atomic and returned update errors are not checked. Form data is parsed before the size and rate checks.

**Impact.** A registered user can bypass the intended 30-upload limit, increasing storage and request costs. An account is still required; anonymous live upload requests returned 401.

**Fix/retest.** Use an atomic counter in server-controlled storage keyed by verified user identity, with quotas and request-body limits enforced early. Explicitly decide whether uploads should be available when user content features are disabled. Clearing metadata or making concurrent requests must not reset/bypass the quota.

### F07 — Submissions preserve fields the server should own

[Submission construction](/C:/Promptmatrix/prompt-repo/app/api/posts/route.ts:142) spreads the supplied object into the record. The actual route preserved a fixture's forged approved comment, another user's claimed comment identity, and arbitrarily supplied likes/views, despite comments requiring approval. Broad runtime shape/length validation is also absent; type assertions provide no runtime protection.

**Conditions.** Submissions are currently disabled. With approval enabled, this data would await approval with the rest of the post; with automatic approval, it becomes public immediately. It is still a bypass of the separately enforced comment workflow.

**Fix/retest.** Allowlist submission content fields. Initialize counters, comment lists, identity lists, moderation status, and timestamps on the server. Validate array/object types, lengths, content sizes, and URLs before writing. Preserve user activity in separate tables. Reject forged activity/moderation fields and malformed JSON shapes.

### F08 — Login redirect accepts off-site destinations

[getSafeNextPath](/C:/Promptmatrix/prompt-repo/lib/auth-redirect.ts:8) checks leading slashes before browser URL normalization. It accepts a slash followed by a backslash, encoded backslashes, and control-character variations. The local tests showed these resolve to an external origin. [The callback](/C:/Promptmatrix/prompt-repo/app/auth/callback/page.tsx:52) assigns the result to `window.location.href` after sign-in.

**Impact.** Crafted sign-in links can bounce a successfully signed-in user to a phishing destination. Automatic token disclosure was not demonstrated.

**Fix/retest.** Normalize using the URL parser, require exact equality with the intended site origin, reject backslashes/control characters, and return only the validated relative path/query/fragment. Test encoded and double-encoded variations alongside valid internal destinations.

### F09 — Anonymous counter manipulation and unsafe whole-record updates

[Like/view handling](/C:/Promptmatrix/prompt-repo/app/api/posts/route.ts:309) permits unauthenticated likes and increments/decrements the counter regardless of whether a unique like changed. Two identical anonymous fixture requests increased likes from 5 to 7. Neither action has a server-enforced rate limit or deduplication. Hiding counts in the UI does not disable these writes.

The handler also reads the complete post and [writes the entire JSON object back](/C:/Promptmatrix/prompt-repo/app/api/posts/route.ts:329). Concurrent content edits or moderation changes can therefore be overwritten by a stale counter request; this race was identified in code but not exercised against production.

**Fix/retest.** Derive likes from unique authenticated records or enforce a deliberate anonymous abuse-control design; make repeated requests idempotent. Update counters atomically without rewriting content. Apply bounded view-event deduplication/rate limits. Concurrent counter traffic must not alter titles, content, ownership, or visibility.

### F10 — Legacy activity identifiers bypass page sanitization

One of the 17 anonymously readable post records contained a nonempty legacy `likedBy` array. The public database API returns complete `posts.data`, while [page sanitization](/C:/Promptmatrix/prompt-repo/lib/data.ts:793) removes activity lists only after fetching. No nonempty bookmark arrays or unapproved legacy comments were observed in that sample.

**Impact.** User identifiers and their association with a liked post are exposed without login. The sample does not establish a broader bookmark/comment leak.

**Fix/retest.** Finish migrating private activity out of publicly readable JSON, remove legacy arrays, and expose a public projection that includes only intended fields. Keep full records private; a security-invoker view alone does not redact fields from an independently readable underlying table.

## Additional hardening observations

- Upload signature checks accept a non-image fixture beginning with `GIF`, and generic `ftyp` containers as AVIF. Use real decoding/re-encoding or stronger validation. Because raster content types are forced, this test alone does **not** establish executable uploaded-file XSS.
- Server image fetches use a restrictive HTTPS host allowlist, redirect rejection, and timeout. However, nonstandard ports are accepted and generation routes buffer responses before checking size. Restrict ports and enforce streaming byte limits. These generation routes require admin access.
- Wildcard HTTP/HTTPS `remotePatterns` remain configured. The OpenNext image endpoint can fetch remote images even when normal Next Image optimization is disabled. Restrict it to intended image origins to reduce proxy abuse. Private-network fetching was not attempted; the Worker enables `global_fetch_strictly_public`.
- `/admin` and `/auth/callback` returned shared-cache directives. Their unauthenticated HTML is currently a shell, so this alone does not prove authenticated user-data leakage. Use explicit private/no-store behavior on authentication and personalized routes and keep public cache rules narrowly scoped.
- Public profile metadata resolves user records before the page's feature-disabled check. Align metadata generation with the same privacy/feature checks and avoid listing up to 1,000 auth users for public username lookup.
- Builds skip TypeScript/lint errors, and the deployment workflow deploys after install without a dedicated security/test gate. Restore meaningful release checks and add dependency/secret scanning. TypeScript passed during this audit.

## Controls that worked in the checks

- Live unauthenticated GET requests to admin data, profiles, image listing, and Pinterest status returned 401.
- Live empty unauthenticated POST requests to admin mutations, all four AI endpoints, Pinterest publishing, IndexNow, and uploads returned 401.
- Sampled HTML served HSTS, MIME-sniffing protection, same-origin framing protection, a referrer policy, and a permissions policy.
- Requests for `.env`, `.env.local`, and `.git/config` returned 404 rather than those files. Their error pages still had the F01 serialization leak.
- Anonymous queries returned no private/pending posts, submissions, private activity-table rows, newsletter rows, or unapproved comments. Empty results are useful observations but cannot prove every policy is correct when tables may be empty.
- Local environment files were not tracked in the inspected repository/history paths. A targeted scan of tracked source found the two literal-secret locations described in F01 and no matching service-role JWT/private-key patterns. This was a targeted pattern scan, not exhaustive secret detection.
- Admin API authorization checks Supabase-verified users and a server-read admin list. Client UI visibility is not the sole authorization boundary.

## Validation, evidence, and limits

The audit inventoried 230 tracked files, reviewed the security-sensitive application paths, performed 27 bounded live checks, and ran 15 offline fixture checks. TypeScript passed with `--noEmit --incremental false`. Dependency advisories were retrieved on the audit date. Offline reproduction proves the identified code behavior; it does not substitute for authenticated production testing.

Evidence is saved in [the audit evidence directory](/C:/Promptmatrix/prompt-repo/security-audit-evidence/2026-09-12/README.md), including redacted live results, offline results, source/dependency summaries, and audit output. The local fixture runner is retained for reproducibility. No provider secrets or personal identity values were saved in these evidence files.

This was not a forensic investigation or a guarantee that no other vulnerabilities exist. Cloudflare account/WAF settings and access logs, deployed Supabase policy introspection, provider activity logs, backup recovery, production MFA/auth settings, authenticated multi-user browser flows, and load testing were not inspected. Consequently, this report cannot determine whether the disclosed credentials have already been abused. Reviewing integration activity and access logs is part of the F01 response.

## Recommended sequence

1. Close F01 in both database access and rendered output, purge cached output, then rotate/revoke exposed integration credentials and review activity.
2. Fix F02/F03 and update dependencies. Validate in staging before deploying.
3. Fix F04/F07 before enabling submissions; preserve the current disabled settings until then.
4. Fix upload throttling, redirect validation, and counter writes; remove legacy activity data from public rows.
5. Re-run the fixture and live checks, add security gates to deployment, and complete the privileged configuration/log review listed above.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPrefetchPolicy, getPrefetchHref, normalizeDiscoveryHref } from '../lib/prefetch-policy.ts';

test('discovery links bypass casing redirects and keep query/hash semantics', () => {
  assert.equal(normalizeDiscoveryHref('/tool/Gemini'), '/tool/gemini');
  assert.equal(normalizeDiscoveryHref('/tag/AI%20Art?q=UPPER#Example'), '/tag/ai%20art?q=UPPER#Example');
  assert.equal(normalizeDiscoveryHref('/blog/SomeArticle'), '/blog/SomeArticle');
  assert.equal(normalizeDiscoveryHref('https://elsewhere.test/tool/Gemini'), 'https://elsewhere.test/tool/Gemini');
  assert.equal(getPrefetchHref('/tool/Gemini', 'https://aipromptmatrix.in/tool/gemini'), null);
});

test('duplicate cards, remounts and repeated viewport entries share one prefetch', () => {
  const policy = createPrefetchPolicy();
  assert.equal(typeof policy.claim('/tool/Gemini', 'viewport', 0), 'function');
  for (let i = 1; i <= 100; i++) {
    assert.equal(policy.claim('/tool/Gemini', 'viewport', i * 60_000), null);
  }
});

test('hover, keyboard focus and touch reuse a fresh viewport prefetch', () => {
  const policy = createPrefetchPolicy();
  policy.claim('/blog/article', 'viewport', 0);
  assert.equal(policy.claim('/blog/article', 'intent', 1), null);
  assert.equal(policy.claim('/blog/article', 'intent', 299_999), null);
  assert.equal(typeof policy.claim('/blog/article', 'intent', 300_000), 'function');
});

test('invalidation does not rearm viewport prefetch or cause immediate retries', () => {
  const policy = createPrefetchPolicy();
  const invalidate = policy.claim('/guides/article', 'viewport', 0);
  invalidate();
  assert.equal(policy.claim('/guides/article', 'viewport', 600_000), null);
  assert.equal(policy.claim('/guides/article', 'intent', 29_999), null);
  assert.equal(typeof policy.claim('/guides/article', 'intent', 30_000), 'function');
});

test('an old invalidation callback cannot invalidate a newer prefetch', () => {
  const policy = createPrefetchPolicy();
  const oldInvalidate = policy.claim('/blog', 'intent', 0);
  policy.claim('/blog', 'intent', 300_000);
  oldInvalidate();
  assert.equal(policy.claim('/blog', 'intent', 340_000), null);
});

test('long galleries have a viewport budget, but intentional navigation still warms', () => {
  const policy = createPrefetchPolicy();
  for (let i = 0; i < 48; i++) assert.ok(policy.claim(`/post-${i}`, 'viewport', i));
  assert.equal(policy.claim('/post-49', 'viewport', 50), null);
  assert.ok(policy.claim('/post-49', 'intent', 50));
});

test('viewport history survives eviction from the bounded intent cache', () => {
  const policy = createPrefetchPolicy();
  policy.claim('/tool/Gemini', 'viewport', 0);
  for (let i = 0; i < 300; i++) policy.claim(`/post-${i}`, 'intent', i);
  assert.equal(policy.claim('/tool/Gemini', 'viewport', 600_000), null);
});

test('fragments deduplicate, query strings stay distinct and same-page links are skipped', () => {
  const current = 'https://aipromptmatrix.in/blog';
  assert.equal(getPrefetchHref('/guides/a#example', current), '/guides/a');
  assert.equal(getPrefetchHref('/search?q=gemini#top', current), '/search?q=gemini');
  assert.equal(getPrefetchHref('#top', current), null);
  assert.equal(getPrefetchHref('/blog', current), null);
});

test('external URLs, non-web schemes and private/action routes never prefetch', () => {
  const current = 'https://aipromptmatrix.in/';
  for (const href of ['https://example.com/a', '//example.com/a', 'mailto:a@b.com',
    'javascript:alert(1)', '/api/posts', '/admin', '/profile?setup=true', '/login',
    '/submit', '/auth/callback', '/user/123', '/test']) {
    assert.equal(getPrefetchHref(href, current), null, href);
  }
});

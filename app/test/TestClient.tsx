'use client';

import { Fragment, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import type { Post, PostSummary, Section, SiteSettings } from '@/lib/types';
import GlmBackground from './GlmBackground';
import GlmHeader from './GlmHeader';
import HeroLandingSearchFocus from './HeroSearchFocus';
import { REVEAL_CSS } from './GlmReveal';

// Everything below the fold is code-split with next/dynamic. ssr stays at its
// default (true), so the server-rendered HTML/SEO content is unchanged — only
// the JS delivery splits into separate chunks instead of one eager bundle.
// Same pattern the live homepage uses for its hero variants; this is what
// brings /test First Load JS from ~221 kB down to parity with live / (~131 kB).
const GlmFooter = dynamic(() => import('./GlmFooter'));
const GlmFeaturedSlider = dynamic(() => import('./GlmFeaturedSlider'));
const GlmLinkBlocks = dynamic(() => import('./GlmLinkBlocks'));
const GlmHowItWorks = dynamic(() => import('./GlmHowItWorks'));
const GlmReviewProcess = dynamic(() => import('./GlmReviewProcess'));
const GlmSupportedTools = dynamic(() => import('./GlmSupportedTools'));
const GlmCreativeDirections = dynamic(() => import('./GlmCreativeDirections'));
const GlmGuides = dynamic(() => import('./GlmGuides'));
const GlmBlog = dynamic(() => import('./GlmBlog'));
const GlmCreatorFeedback = dynamic(() => import('./GlmCreatorFeedback'));
const GlmPromptOfDay = dynamic(() => import('./GlmPromptOfDay'));
const GlmPromptSection = dynamic(() => import('./GlmPromptSections'));

/*
 * Sandbox-scoped CSS. This is server-rendered below (a plain <style> tag, like
 * REVEAL_CSS) and NOT a <style jsx global> block, which is what it used to be.
 * styled-jsx ships its CSS inside the client JS chunk and injects it at
 * hydration, so none of these rules existed on the first paint: the global
 * layout's chrome and ad slots had nothing hiding them, and every PostCard
 * painted with its raw v2 surface (flat bg-surface-50 / bg-surface-900 slab)
 * instead of the glass frame — while REVEAL_CSS, which IS server-rendered, was
 * already holding the content inside those cards at opacity 0. The result was
 * a first paint of flat empty blocks. Server-rendering both keeps them in sync.
 */
const SANDBOX_CSS = `
/* Complete isolation for the test sandbox — hides the global layout Header,
   progress bar, Footer and ad slots. */
html:has(#test-sandbox-root) .fixed.inset-x-0.top-0.z-\\[9999\\],
html:has(#test-sandbox-root) .fixed.inset-x-0.z-40,
body:has(#test-sandbox-root) .fixed.inset-x-0.top-0.z-\\[9999\\],
body:has(#test-sandbox-root) .fixed.inset-x-0.z-40,
html:has(#test-sandbox-root) header:not(#test-sandbox-root header),
body:has(#test-sandbox-root) header:not(#test-sandbox-root header),
html:has(#test-sandbox-root) footer:not(#test-sandbox-root footer),
body:has(#test-sandbox-root) footer:not(#test-sandbox-root footer),
html:has(#test-sandbox-root) [data-ad-slot],
body:has(#test-sandbox-root) [data-ad-slot] {
  display: none !important;
}

/* PostCard frame — the site renders card style v2, which already has its own
   frame (p-2 padding + border). Restyle that SAME frame to the glassCard
   recipe used by the blog/guides cards and thin it on the top/sides while
   keeping the bottom. The card body, image and text are untouched — no extra
   wrapper. Because the frame is now real glass it must never be
   opacity-faded (frost flash): the rail reveal fades the card's inner content
   instead (rules below) and the masonry uses the plain rise variant. */
#test-sandbox-root .glm-post-card > a {
  background: rgba(255, 255, 255, 0.6);
  border-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px) saturate(1.6);
  -webkit-backdrop-filter: blur(20px) saturate(1.6);
  box-shadow: 0 4px 12px -2px rgba(15, 23, 42, 0.08);
  padding: 6px 6px 10px; /* thinner top/sides, kept bottom */
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}
.dark #test-sandbox-root .glm-post-card > a {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 12px -2px rgba(0, 0, 0, 0.35);
}
#test-sandbox-root .glm-post-card:hover > a {
  border-color: rgba(66, 133, 244, 0.5);
  box-shadow: 0 8px 24px -4px rgba(15, 23, 42, 0.16);
}
.dark #test-sandbox-root .glm-post-card:hover > a {
  border-color: rgba(96, 165, 250, 0.5);
  box-shadow: 0 8px 24px -4px rgba(2, 6, 23, 0.55);
}

/* Rail reveal: the glass frame stays put; fade the card's inner content
   (image + footer) so the frost is never caught mid-fade. Armed by the same
   <html> class as the rest of the reveal model, so a load where JS never
   arrives cannot strand the card contents blank. */
#test-sandbox-root .glm-reveal.glm-stagger-fade:not(.glm-revealed) > .glm-post-card {
  opacity: 1;
}
#test-sandbox-root .glm-reveal.glm-stagger-fade.glm-revealed > .glm-post-card {
  animation: none;
}
.glm-reveal-armed #test-sandbox-root .glm-reveal.glm-stagger-fade:not(.glm-revealed) > .glm-post-card > a > * {
  opacity: 0;
}
#test-sandbox-root .glm-reveal.glm-stagger-fade.glm-revealed > .glm-post-card > a > * {
  animation: glm-reveal-fade-in 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) backwards;
  animation-delay: calc(var(--glm-delay, 0ms) + 100ms);
}
#test-sandbox-root .glm-reveal.glm-stagger-fade.glm-revealed > .glm-post-card:nth-child(2) > a > * { animation-delay: calc(var(--glm-delay, 0ms) + 200ms); }
#test-sandbox-root .glm-reveal.glm-stagger-fade.glm-revealed > .glm-post-card:nth-child(3) > a > * { animation-delay: calc(var(--glm-delay, 0ms) + 300ms); }
#test-sandbox-root .glm-reveal.glm-stagger-fade.glm-revealed > .glm-post-card:nth-child(4) > a > * { animation-delay: calc(var(--glm-delay, 0ms) + 400ms); }
#test-sandbox-root .glm-reveal.glm-stagger-fade.glm-revealed > .glm-post-card:nth-child(n+5) > a > * { animation-delay: calc(var(--glm-delay, 0ms) + 500ms); }

/* Accent scrollbars — the site-wide scrollbar in globals.css is neutral
   gray; the redesign uses the Google-blue accent everywhere, so the
   scrollbar follows. Scoped to the sandbox page via :has(). The page
   scrollbar gets the vertical brand gradient; inner scroll areas (the
   prompt rails) get the same thumb horizontally. */
html:has(#test-sandbox-root) {
  scrollbar-width: thin;
  scrollbar-color: #4285f4 rgba(66, 133, 244, 0.08);
}
html:has(#test-sandbox-root)::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
html:has(#test-sandbox-root)::-webkit-scrollbar-track {
  background: transparent;
}
html:has(#test-sandbox-root)::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #4285f4, #1a73e8);
  border-radius: 9999px;
}
html:has(#test-sandbox-root)::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, #5a93f6, #2b7de8);
}
html:has(#test-sandbox-root)::-webkit-scrollbar-corner {
  background: transparent;
}
#test-sandbox-root *::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
#test-sandbox-root *::-webkit-scrollbar-track {
  background: transparent;
}
#test-sandbox-root *::-webkit-scrollbar-thumb {
  background: linear-gradient(90deg, #4285f4, #1a73e8);
  border-radius: 9999px;
}
#test-sandbox-root * {
  scrollbar-width: thin;
  scrollbar-color: #4285f4 rgba(66, 133, 244, 0.08);
}
`;

export default function TestClient({
  allPosts,
  featuredPosts,
  settings,
  homepageOrder,
  homepageSections,
  sectionPosts,
  promptOfDayPost,
}: {
  allPosts: PostSummary[];
  featuredPosts: PostSummary[];
  settings?: SiteSettings;
  homepageOrder: string[];
  homepageSections: Section[];
  sectionPosts: { sectionId: string; posts: Post[] }[];
  promptOfDayPost?: Post;
}) {
  const features = settings?.features;
  const sectionsById = new Map(homepageSections.map(section => [section.id, section]));
  const postsBySection = new Map(sectionPosts.map(entry => [entry.sectionId, entry.posts]));

  // Same feature-flag gating as app/page.tsx: a block disabled in admin
  // doesn't render. `?? true` matches main (undefined flag = enabled).
  const homepageBlocks: Record<string, ReactNode> = {
    howTo: (features?.showHomepageHowTo ?? true) ? <GlmHowItWorks settings={settings} /> : null,
    reviewProcess: (features?.showHomepageReviewProcess ?? true) ? <GlmReviewProcess settings={settings} /> : null,
    promptOfDay: (features?.showHomepagePromptOfDay ?? true) ? <GlmPromptOfDay post={promptOfDayPost} settings={settings} /> : null,
    supportedTools: (features?.showHomepageSupportedTools ?? true) ? <GlmSupportedTools posts={allPosts} settings={settings} /> : null,
    creativeDirections: (features?.showHomepageCreativeDirections ?? true) ? <GlmCreativeDirections posts={allPosts} settings={settings} /> : null,
    guides: (features?.showHomepageGuides ?? true) ? <GlmGuides settings={settings} /> : null,
    blog: (features?.showHomepageBlog ?? true) ? <GlmBlog settings={settings} /> : null,
    creatorFeedback: (features?.showHomepageCreatorFeedback ?? true) ? <GlmCreatorFeedback settings={settings} /> : null,
  };

  return (
    <div id="test-sandbox-root" className="relative min-h-screen text-slate-900 dark:text-slate-100 selection:bg-primary-500/30 selection:text-white font-sans">
      {/* Blocking theme script — must stay the sandbox's first node. The global
          ThemeProvider applies the stored theme in useEffect (AFTER first
          paint), so dark-mode users would otherwise see every glass panel and
          the background flash bright/light, then transition to dark (the
          background even animates it over 500ms). This inline script runs at
          HTML parse time — before any glass content below is even parsed — so
          the stored theme is in place for the very first paint. Mirrors
          ThemeProvider's logic exactly (key 'pv-theme', default = light). */}
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){try{var t=localStorage.getItem('pv-theme');if(t==='dark'){document.documentElement.classList.add('dark')}else if(t==='light'){document.documentElement.classList.remove('dark')}}catch(e){}})();`,
        }}
      />
      {/* Arms the scroll-reveal hidden states. REVEAL_CSS is server-rendered so
          `.glm-reveal` content is opacity:0 from the first paint, but only JS
          ever clears it (.glm-revealed) — so a load where the chunk is blocked,
          fails, or is simply very slow left every section painted but empty.
          Gating those rules behind this class means they apply only when JS is
          alive to undo them: no script, nothing hidden. The timer is the
          bounded escape hatch — if hydration hasn't registered a single reveal
          node by then, drop the class and show everything. GlmReveal notices the
          class is gone and adopts the content in place rather than animating it,
          so there is no second reveal. Runs at parse time like the theme script
          above, so the armed class is set before any reveal content is parsed. */}
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){var d=document.documentElement;d.classList.add('glm-reveal-armed');setTimeout(function(){if(!window.__glmRevealReady){d.classList.remove('glm-reveal-armed')}},4000)})();`,
        }}
      />
      {/* Reveal CSS server-rendered (not injected at hydration): `.glm-reveal`
          must be opacity:0 from the first paint, otherwise content paints
          fully visible, then blinks out when the observer CSS injects, then
          animates back in — the visible "style change" flash. */}
      <style id="glm-reveal-css" dangerouslySetInnerHTML={{ __html: REVEAL_CSS }} />
      {/* Sandbox isolation + PostCard glass frame — server-rendered for the
          same reason as the reveal CSS above; see SANDBOX_CSS. */}
      <style id="glm-sandbox-css" dangerouslySetInnerHTML={{ __html: SANDBOX_CSS }} />

      {/* GLM Animated Cyber-Glassmorphism Background */}
      <GlmBackground />

      {/* Redesigned Compact Floating Glassmorphic Header */}
      <GlmHeader />

      {/* GLM hero — gated by the same feature flag as main's library hero.
          Main additionally checks heroStyle !== 'v9', but that belongs to the
          legacy v1–v9 variant system which gets dropped when this hero is
          merged in, so only the feature flag applies here. */}
      <main className="relative z-10 pt-12 sm:pt-14">
        {(settings?.features?.showHomepageLibraryHero ?? true) && (
          <HeroLandingSearchFocus
            featuredPosts={featuredPosts}
            settings={settings}
            postCount={allPosts.length}
          />
        )}
      </main>

      {/* Homepage blocks in admin-defined order — glassmorphic adaptations of
          the main-site sections, each gated by its feature flag like main.
          Each block handles its own GlmReveal entrance animations. */}
      <div className="relative z-10">
        {/* Featured slider — below the hero so never LCP; not reveal-wrapped
            (same rule as main: above-the-fold-ish content stays in the HTML). */}
        {settings?.heroEnabled !== false && (
          <GlmFeaturedSlider featuredPosts={featuredPosts} settings={settings} />
        )}

        <GlmLinkBlocks settings={settings} />

        {homepageOrder.map(token => {
          if (token.startsWith('block:')) {
            const key = token.replace('block:', '');
            if (!homepageBlocks[key]) return null;
            return <Fragment key={token}>{homepageBlocks[key]}</Fragment>;
          }
          const sectionId = token.replace('section:', '');
          const section = sectionsById.get(sectionId);
          if (!section) return null;
          return (
            <GlmPromptSection
              key={token}
              section={section}
              posts={postsBySection.get(sectionId) || []}
              settings={settings}
            />
          );
        })}
      </div>

      {/* Redesigned Glassmorphic Footer */}
      <GlmFooter settings={settings} />
    </div>
  );
}

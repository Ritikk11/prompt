import type { ReactNode } from 'react';

/** Frosted-glass SURFACE recipe with no corner radius and no shadow — the
 * single source of truth for the fill / border / blur. Panels that need a
 * non-default radius or their own shadow compose this with their own classes
 * (see the How-It-Works detail panel) instead of re-hardcoding the fill, so a
 * tweak here can never silently miss a panel again.
 *
 * Kept translucent on purpose so the frosted "glass blur" look survives. The
 * color-drift that translucent glass can show is controlled at the source —
 * the background orbs in GlmBackground float very slowly with a small
 * amplitude — rather than by making these panels opaque. The bg alphas below
 * are only a small stability margin above bare glass; raise them for a steadier
 * (flatter) panel, lower them for more background show-through.
 *
 * `transform-gpu` + `backface-visibility:hidden` promote each panel to its own
 * compositing layer so backdrop-filter is applied by the compositor from the very
 * first painted frame. Without this, a freshly painted panel shows its flat
 * background-color for a frame before the blur kicks in — a flash that reads as
 * "background bleeds, then own-bg paints" in dark and the reverse in light. */
export const glassSurface =
  'border border-white/75 bg-white/40 backdrop-blur-md backdrop-saturate-[115%] dark:border-white/10 dark:bg-white/[0.04] transform-gpu [backface-visibility:hidden]';

/** Shared glass-card recipe — matches the hero's frosted panels. */
export const glassCard = `rounded-2xl shadow-lg shadow-slate-900/5 ${glassSurface}`;

/** Google-blue gradient used for Playfair accent words in section titles. */
export const accentGradient =
  'bg-gradient-to-r from-primary-800 via-primary-600 to-primary-500 dark:from-primary-200 dark:via-primary-300 dark:to-primary-400 bg-clip-text text-transparent';

/**
 * Centered section header: glass badge pill + black sans title with an
 * optional Playfair-italic gradient accent word + supporting description.
 */
export function GlmSectionHeader({
  icon,
  badge,
  title,
  accentWord,
  description,
}: {
  icon: ReactNode;
  badge: string;
  title: string;
  accentWord?: string;
  description?: string;
}) {
  let titleNode: ReactNode = title;
  if (accentWord) {
    const index = title.toLowerCase().indexOf(accentWord.toLowerCase());
    if (index >= 0) {
      titleNode = (
        <>
          {title.slice(0, index)}
          <span className={`font-serif-italic font-bold px-1 ${accentGradient}`}>
            {title.slice(index, index + accentWord.length)}
          </span>
          {title.slice(index + accentWord.length)}
        </>
      );
    }
  }

  return (
    <div className="mx-auto mb-10 max-w-2xl text-center">
      {/* No backdrop-blur: this pill is animated on reveal (it sits inside
          the sliding header content) and a frosted surface whose ancestor
          animates flashes its raw backdrop for a frame. */}
      <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/75 px-4 py-2 text-xs font-bold text-primary-700 shadow-sm dark:border-white/10 dark:bg-white/[0.14] dark:text-primary-200">
        {icon}
        {badge}
      </div>
      <h2 className="text-3xl font-black tracking-tight text-surface-950 dark:text-white sm:text-4xl">
        {titleNode}
      </h2>
      {description && (
        <p className="mt-3 text-base leading-7 text-surface-600 dark:text-surface-300">{description}</p>
      )}
    </div>
  );
}

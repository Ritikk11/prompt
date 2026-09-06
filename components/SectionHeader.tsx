import type { ReactNode } from 'react';

/**
 * Wraps the first case-insensitive occurrence of `accentWord` in an
 * italic-serif gradient span. Exported because blocks with their own heading
 * layout (the left-aligned review-process column) need the same treatment
 * without the centered wrapper below.
 */
export function accentTitle(title: string, accentWord?: string): ReactNode {
  if (!accentWord) return title;
  const index = title.toLowerCase().indexOf(accentWord.toLowerCase());
  if (index < 0) return title;
  return (
    <>
      {title.slice(0, index)}
      <span className="font-serif-italic font-bold px-1 accent-gradient">
        {title.slice(index, index + accentWord.length)}
      </span>
      {title.slice(index + accentWord.length)}
    </>
  );
}

/**
 * Centered homepage-section header: badge pill + heading with an optional
 * italic-serif gradient accent word + supporting line.
 *
 * Its own file rather than a helper inside one of the blocks because eight of
 * the ten homepage blocks are server components — hanging it off a `'use
 * client'` module (HomeSection) would drag all eight into the client bundle for
 * the sake of a heading. The alternative, inlining the markup, duplicates the
 * accent-word split in every block.
 *
 * The glass fill / border / blur recipe lives in globals.css as `.glass-card`
 * and `.glass-surface`; this component only uses `.accent-gradient`.
 */
export default function SectionHeader({
  icon,
  badge,
  title,
  accentWord,
  description,
}: {
  icon: ReactNode;
  badge: string;
  title: string;
  /** First case-insensitive occurrence in `title` gets the serif gradient */
  accentWord?: string;
  description?: string;
}) {
  return (
    <div className="mx-auto mb-10 max-w-2xl text-center">
      {/* No backdrop-blur on this pill: it sits inside the sliding header
          content, and a frosted surface whose ancestor animates flashes its
          raw backdrop for a frame. */}
      <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/75 px-4 py-2 text-xs font-bold text-primary-700 shadow-sm dark:border-white/10 dark:bg-white/[0.14] dark:text-primary-200">
        {icon}
        {badge}
      </div>
      <h2 className="text-3xl font-black tracking-tight text-surface-950 dark:text-white sm:text-4xl">
        {accentTitle(title, accentWord)}
      </h2>
      {description && (
        <p className="mt-3 text-base leading-7 text-surface-600 dark:text-surface-300">{description}</p>
      )}
    </div>
  );
}

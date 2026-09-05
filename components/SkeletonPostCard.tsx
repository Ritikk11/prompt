/**
 * Loading placeholder shaped like whichever card style is actually active, so the
 * layout does not visibly re-shuffle when the real cards replace it:
 *  - v1 is a bare full-bleed thumbnail with a tool badge and a prompt-count
 *    pill floating on it, and no text rows below the image.
 *  - v2 is a glass frame around an inset thumbnail with title/meta rows under it.
 *
 * `break-inside-avoid` matters because the grids that render these use CSS
 * multi-column (`columns-1` / `md:columns-4`), where a tall child is otherwise
 * free to split across a column boundary. Multi-column also ignores `row-gap`,
 * so the vertical rhythm has to come from the card's own margin.
 *
 * The v2 frame is glass but is NOT part of the pulse — `animate-pulse` drives
 * opacity, and a backdrop-filter surface does not compute its frost while
 * faded, so pulsing the frame would strobe the background through it. Only the
 * opaque blocks inside pulse.
 */
export default function SkeletonPostCard({ cardStyle = 'v2' }: { cardStyle?: 'v1' | 'v2' }) {
  const block = 'bg-black/[0.07] dark:bg-white/[0.09] animate-pulse';
  const chip = 'bg-black/[0.10] dark:bg-white/[0.14]';

  if (cardStyle === 'v1') {
    return (
      <div className="mb-3 w-full break-inside-avoid overflow-hidden rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] sm:mb-4">
        <div className={`relative w-full ${block}`} style={{ paddingTop: '133%' }}>
          <div className={`absolute left-3 top-3 h-5 w-20 rounded-full ${chip}`} />
          <div className={`absolute bottom-2.5 left-2.5 h-6 w-24 rounded-full ${chip}`} />
        </div>
      </div>
    );
  }

  return (
    <div className="mb-3 w-full break-inside-avoid overflow-hidden rounded-[20px] border border-white/80 bg-white/60 px-1.5 pb-2.5 pt-1.5 shadow-[0_4px_12px_-2px_rgba(15,23,42,0.08)] backdrop-blur-[16px] backdrop-saturate-[120%] dark:border-white/10 dark:bg-white/[0.08] dark:shadow-[0_4px_12px_-2px_rgba(0,0,0,0.35)] sm:mb-4">
      {/* Thumbnail */}
      <div className={`relative w-full overflow-hidden rounded-[12px] ${block}`} style={{ paddingTop: '133%' }}>
        <div className={`absolute left-2.5 top-2.5 h-5 w-20 rounded-full ${chip}`} />
      </div>

      <div className="flex flex-col gap-2 px-1 pb-1 pt-3">
        <div className={`h-4 w-3/4 rounded ${block}`} />
        <div className={`h-3 w-5/6 rounded ${block}`} />
        <div className="mt-1 flex items-center justify-between">
          <div className={`h-2.5 w-14 rounded ${block}`} />
          <div className="flex gap-2">
            <div className={`h-2.5 w-8 rounded ${block}`} />
            <div className={`h-2.5 w-8 rounded ${block}`} />
          </div>
        </div>
      </div>
    </div>
  );
}

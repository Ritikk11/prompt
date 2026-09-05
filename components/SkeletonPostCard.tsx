/**
 * Loading placeholder shaped like the v2 card: a glass frame around a tinted
 * thumbnail block.
 *
 * The frame is glass but is NOT part of the pulse — `animate-pulse` drives
 * opacity, and a backdrop-filter surface does not compute its frost while
 * faded, so pulsing the frame would strobe the background through it. Only the
 * opaque blocks inside pulse.
 */
export default function SkeletonPostCard() {
  const block = 'bg-black/[0.07] dark:bg-white/[0.09] animate-pulse';

  return (
    <div className="w-full overflow-hidden rounded-[20px] border border-white/80 bg-white/60 px-1.5 pb-2.5 pt-1.5 shadow-[0_4px_12px_-2px_rgba(15,23,42,0.08)] backdrop-blur-[16px] backdrop-saturate-[120%] dark:border-white/10 dark:bg-white/[0.08] dark:shadow-[0_4px_12px_-2px_rgba(0,0,0,0.35)]">
      {/* Thumbnail */}
      <div className={`relative w-full overflow-hidden rounded-[12px] ${block}`} style={{ paddingTop: '140%' }}>
        <div className="absolute left-2.5 top-2.5 h-6 w-16 rounded-lg bg-black/[0.08] dark:bg-white/[0.12]" />
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

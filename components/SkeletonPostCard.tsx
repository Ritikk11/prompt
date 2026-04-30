export default function SkeletonPostCard() {
  return (
    <div className="rounded-[18px] overflow-hidden bg-surface-50 dark:bg-surface-800 border-2 border-surface-200 dark:border-surface-700 w-full animate-pulse">
      {/* Image Skeleton */}
      <div className="w-full relative bg-surface-200 dark:bg-surface-700" style={{ paddingTop: '100%' }}>
        <div className="absolute top-3 left-3 w-8 h-8 rounded-lg bg-surface-300 dark:bg-surface-600" />
      </div>

      <div className="p-4 sm:p-5 flex flex-col gap-3">
        {/* Title */}
        <div className="h-5 bg-surface-200 dark:bg-surface-700 rounded w-3/4" />
        
        {/* Description / Prompt line */}
        <div className="h-3 bg-surface-200 dark:bg-surface-700 rounded w-full" />
        <div className="h-3 bg-surface-200 dark:bg-surface-700 rounded w-5/6" />

        <div className="mt-2 flex items-center justify-between pt-4 border-t border-surface-200 dark:border-surface-700">
          <div className="flex gap-2">
            <div className="w-8 h-8 bg-surface-200 dark:bg-surface-700 rounded-lg" />
            <div className="w-8 h-8 bg-surface-200 dark:bg-surface-700 rounded-lg" />
          </div>
          <div className="w-16 h-8 bg-surface-200 dark:bg-surface-700 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

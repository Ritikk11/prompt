// Shown instantly when navigating to a prompt page while it renders. Without
// this route-level loading boundary, Next keeps the previous page on screen
// until the new one is fully ready, so a tap felt like it did nothing. With it,
// the tap leaves the old page immediately and shows this spinner, which Next
// swaps for the real content the moment it's ready (no lingering overlay).
export default function Loading() {
  return (
    <div
      className="flex min-h-[70vh] w-full items-center justify-center"
      role="status"
      aria-label="Loading prompt"
    >
      <span className="h-10 w-10 animate-spin rounded-full border-[3px] border-primary-500/30 border-t-primary-500" />
    </div>
  );
}

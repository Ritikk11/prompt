// Tracks whether the most recent navigation was a browser Back/Forward (a
// `popstate`), so views can restore saved scroll/state only then — and start
// fresh (top) on ordinary link/URL navigations. A single global listener arms
// the flag; the consuming view reads-and-clears it once per navigation.
let armed = false;

if (typeof window !== 'undefined') {
  window.addEventListener('popstate', () => {
    armed = true;
  });
}

export function consumeBackNav(): boolean {
  const wasBack = armed;
  armed = false;
  return wasBack;
}

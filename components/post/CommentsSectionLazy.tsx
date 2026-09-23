'use client';
import dynamic from 'next/dynamic';

// The comments island sits at the very bottom of the post page and is purely
// interactive (not SEO content), so we skip SSR and defer its hydration until
// after the initial render. That keeps react + the comments tree out of the
// first hydration pass, cutting Total Blocking Time on load.
const CommentsSection = dynamic(() => import('@/components/post/CommentsSection'), {
  ssr: false,
  loading: () => null,
});

export default CommentsSection;

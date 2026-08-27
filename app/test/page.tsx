import type { Metadata } from 'next';
import { fetchPostSummaries, fetchSections, fetchSettings, getPostsForSection } from '@/lib/data';
import TestClient from './TestClient';

export const metadata: Metadata = {
  title: 'Test Homepage Preview | AI PromptMatrix',
  description: 'Preview test homepage with GLM cyber-glassmorphism background and showcase hero.',
  robots: {
    index: false,
    follow: false,
  },
};

const defaultHomepageBlockOrder = [
  'howTo',
  'reviewProcess',
  'promptOfDay',
  'supportedTools',
  'creativeDirections',
  'guides',
  'blog',
  'creatorFeedback',
];

function normalizeBlockToken(key: string) {
  return key.startsWith('block:') || key.startsWith('section:') ? key : `block:${key}`;
}

export default async function TestHomePage() {
  // Same parallel homepage reads as app/page.tsx (settings, sections, posts).
  const [sections, settings, allPosts] = await Promise.all([
    fetchSections(),
    fetchSettings(),
    fetchPostSummaries(),
  ]);

  const featuredPosts = allPosts.filter(
    (p) => p.featured && (p.status === 'published' || !p.status) && p.visibility !== 'private'
  );

  // Homepage sections + their posts, computed exactly like main so the test
  // page honors admin visibility/order/limits.
  const homepageSections = sections
    .filter((s) => s.visible && (s.location || 'homepage') === 'homepage')
    .sort((a, b) => a.order - b.order);

  const pinnedPromptOfDayId = settings.homepageContent?.promptOfDay?.pinnedPostId;
  const promptOfDayPost =
    allPosts.find((post) => post.id === pinnedPromptOfDayId || post.slug === pinnedPromptOfDayId) ||
    featuredPosts[0] ||
    allPosts[0];

  const sectionPostsData = await Promise.all(
    homepageSections.map((section) => getPostsForSection(section, settings, allPosts))
  );
  const sectionPosts = homepageSections.map((section, index) => ({
    sectionId: section.id,
    posts: sectionPostsData[index],
  }));

  // Block/section order: saved admin order first (validated), then defaults.
  const homepageSectionIds = new Set(homepageSections.map((section) => section.id));
  const defaultHomepageOrder = [
    ...defaultHomepageBlockOrder.map((key) => `block:${key}`),
    ...homepageSections.map((section) => `section:${section.id}`),
  ];
  const savedHomepageOrder = (settings.homepageBlockOrder || []).map(normalizeBlockToken);
  const homepageOrder = [
    ...savedHomepageOrder.filter((token) => {
      if (token.startsWith('block:')) return defaultHomepageBlockOrder.includes(token.replace('block:', ''));
      if (token.startsWith('section:')) return homepageSectionIds.has(token.replace('section:', ''));
      return false;
    }),
    ...defaultHomepageOrder.filter((token) => !savedHomepageOrder.includes(token)),
  ];

  return (
    <TestClient
      allPosts={allPosts}
      featuredPosts={featuredPosts}
      settings={settings}
      homepageOrder={homepageOrder}
      homepageSections={homepageSections}
      sectionPosts={sectionPosts}
      promptOfDayPost={promptOfDayPost}
    />
  );
}

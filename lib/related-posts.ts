import type { Post } from './types';

// Stop words to ignore during title and keyword tokenization
const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'as', 'at',
  'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
  'could', 'did', 'do', 'does', 'doing', 'down', 'during',
  'each', 'few', 'for', 'from', 'further', 'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers',
  'herself', 'him', 'himself', 'his', 'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself',
  'just', 'me', 'more', 'most', 'my', 'myself', 'no', 'nor', 'not', 'now', 'of', 'off', 'on', 'once',
  'only', 'or', 'other', 'our', 'ours', 'ourselves', 'out', 'over', 'own',
  'same', 'she', 'should', 'so', 'some', 'such', 'than', 'that', 'the', 'their', 'theirs', 'them',
  'themselves', 'then', 'there', 'these', 'they', 'this', 'those', 'through', 'to', 'too', 'under',
  'until', 'up', 'very', 'was', 'we', 'were', 'what', 'when', 'where', 'which', 'while', 'who', 'whom',
  'why', 'with', 'would', 'you', 'your', 'yours', 'yourself', 'yourselves',
  // Domain generic terms
  'prompt', 'prompts', 'image', 'images', 'ai', 'generate', 'generator', 'generated', 'art', 'artwork', 'look', 'style',
]);

function tokenize(text?: string): string[] {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .split(/\s+/)
    .map(w => w.trim())
    .filter(w => w.length > 2 && !STOP_WORDS.has(w));
}

/**
 * Positional weight for current post's tags:
 * Index 0 (Primary tag): 24 points
 * Index 1 (Secondary tag): 16 points
 * Index 2 (Tertiary tag): 12 points
 * Index 3+: 8 points down to 5
 */
function getTagWeight(index: number): number {
  if (index === 0) return 24;
  if (index === 1) return 16;
  if (index === 2) return 12;
  return Math.max(5, 8 - (index - 3));
}

function isPublic(post: Post): boolean {
  return (post.status === 'published' || !post.status) && post.visibility !== 'private';
}

/**
 * Calculate multi-factor relevance score between currentPost and a candidate post.
 */
export function scorePostRelevance(currentPost: Post, candidate: Post): number {
  if (candidate.id === currentPost.id || !isPublic(candidate)) return -1;

  let score = 0;

  // 1. Positional Tag Overlap & Starting-Tag Synergy
  const currentTags = (currentPost.tags || []).map(t => t.trim().toLowerCase()).filter(Boolean);
  const candidateTags = (candidate.tags || []).map(t => t.trim().toLowerCase()).filter(Boolean);

  for (let i = 0; i < currentTags.length; i++) {
    const tag = currentTags[i];
    const candidateIdx = candidateTags.indexOf(tag);
    if (candidateIdx !== -1) {
      // Base positional weight based on current post's tag position
      score += getTagWeight(i);

      // Synergy bonus if the candidate ALSO features this tag early
      if (candidateIdx === 0) {
        score += 12; // Candidate's #1 primary tag matches!
        if (i === 0) score += 12; // Both share the EXACT same #1 primary tag!
      } else if (candidateIdx === 1) {
        score += 6;
      }
    }
  }

  // 2. Category Alignment
  const curCat = (currentPost.category || currentPost.categories?.[0] || '').trim().toLowerCase();
  const candCat = (candidate.category || candidate.categories?.[0] || '').trim().toLowerCase();
  if (curCat && candCat && curCat === candCat) {
    score += 16;
  }

  const curCategories = (currentPost.categories || []).map(c => c.trim().toLowerCase());
  const candCategories = (candidate.categories || []).map(c => c.trim().toLowerCase());
  const sharedCategories = curCategories.filter(c => candCategories.includes(c));
  if (sharedCategories.length > 0) {
    score += Math.min(12, sharedCategories.length * 6);
  }

  // 3. AI Tool Compatibility
  const curTools = (currentPost.aiTools || []).map(t => t.trim().toLowerCase());
  const candTools = (candidate.aiTools || []).map(t => t.trim().toLowerCase());
  if (curTools.length > 0 && candTools.length > 0) {
    if (curTools[0] === candTools[0]) {
      score += 8; // Same primary AI generator
    } else if (curTools.some(t => candTools.includes(t))) {
      score += 5;
    }
  }

  // 4. Title & SEO Keywords Token Overlap
  const curTokens = new Set([
    ...tokenize(currentPost.title),
    ...(currentPost.seoKeywords || []).flatMap(k => tokenize(k)),
  ]);
  const candTokens = [
    ...tokenize(candidate.title),
    ...(candidate.seoKeywords || []).flatMap(k => tokenize(k)),
  ];

  let tokenMatches = 0;
  for (const token of candTokens) {
    if (curTokens.has(token)) {
      tokenMatches++;
    }
  }
  score += Math.min(20, tokenMatches * 5);

  // 5. Engagement / Quality Tie-Breaker (0 to 5 points)
  const views = candidate.views || 0;
  const likes = candidate.likes || 0;
  const engagementBonus = Math.min(5, Math.log10(likes + 1) * 1.2 + Math.log10(views + 1) * 0.4);
  score += engagementBonus;

  return score;
}

/**
 * Returns highly relevant related posts with front-loaded starting tag weighting,
 * category/tool synergy, and a cascading fallback to guarantee full grids.
 */
export function getRelatedPosts(
  currentPost: Post,
  allPosts: Post[],
  options?: { limit?: number }
): Post[] {
  const limit = options?.limit ?? 16;
  const eligible = allPosts.filter(p => p.id !== currentPost.id && isPublic(p));

  // Score each eligible candidate
  const scored = eligible
    .map(post => ({ post, score: scorePostRelevance(currentPost, post) }))
    .filter(item => item.score > 5) // Minimum relevance threshold
    .sort((a, b) => b.score - a.score);

  const selectedIds = new Set<string>();
  const results: Post[] = [];

  for (const item of scored) {
    if (results.length >= limit) break;
    results.push(item.post);
    selectedIds.add(item.post.id);
  }

  // Fallback Tier 1: Same category, sorted by engagement
  if (results.length < limit) {
    const curCat = (currentPost.category || currentPost.categories?.[0] || '').trim().toLowerCase();
    if (curCat) {
      const categoryFallbacks = eligible
        .filter(p => !selectedIds.has(p.id))
        .filter(p => (p.category || p.categories?.[0] || '').trim().toLowerCase() === curCat)
        .sort((a, b) => (b.likes || 0) + (b.views || 0) - ((a.likes || 0) + (a.views || 0)));

      for (const p of categoryFallbacks) {
        if (results.length >= limit) break;
        results.push(p);
        selectedIds.add(p.id);
      }
    }
  }

  // Fallback Tier 2: Same primary AI Tool
  if (results.length < limit) {
    const curTool = (currentPost.aiTools?.[0] || '').trim().toLowerCase();
    if (curTool) {
      const toolFallbacks = eligible
        .filter(p => !selectedIds.has(p.id))
        .filter(p => (p.aiTools || []).some(t => t.trim().toLowerCase() === curTool))
        .sort((a, b) => (b.likes || 0) + (b.views || 0) - ((a.likes || 0) + (a.views || 0)));

      for (const p of toolFallbacks) {
        if (results.length >= limit) break;
        results.push(p);
        selectedIds.add(p.id);
      }
    }
  }

  // Fallback Tier 3: Highest engagement site-wide
  if (results.length < limit) {
    const globalFallbacks = eligible
      .filter(p => !selectedIds.has(p.id))
      .sort((a, b) => (b.likes || 0) + (b.views || 0) - ((a.likes || 0) + (a.views || 0)));

    for (const p of globalFallbacks) {
      if (results.length >= limit) break;
      results.push(p);
      selectedIds.add(p.id);
    }
  }

  return results.slice(0, limit);
}

/**
 * Returns complementary "You Might Also Like" suggestions (excluding current post and related posts)
 * to encourage broader discovery without duplicate cards.
 */
export function getRecommendedPosts(
  currentPost: Post,
  allPosts: Post[],
  relatedPosts: Post[] = [],
  options?: { limit?: number }
): Post[] {
  const limit = options?.limit ?? 4;
  const excludeIds = new Set([currentPost.id, ...relatedPosts.map(p => p.id)]);

  const eligible = allPosts.filter(p => !excludeIds.has(p.id) && isPublic(p));

  // Prioritize featured posts, then highest engagement posts
  return eligible
    .sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return (b.likes || 0) * 2 + (b.views || 0) - ((a.likes || 0) * 2 + (a.views || 0));
    })
    .slice(0, limit);
}

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

/**
 * Fast word scanner without intermediate string arrays or regex overhead.
 */
export function addTokensToSet(text: string | undefined, targetSet: Set<string>): void {
  if (!text) return;
  const lower = text.toLowerCase();
  let start = -1;
  const len = lower.length;
  for (let i = 0; i <= len; i++) {
    const code = i < len ? lower.charCodeAt(i) : 32;
    // a-z (97-122), 0-9 (48-57), hyphen (45)
    const isWordChar = (code >= 97 && code <= 122) || (code >= 48 && code <= 57) || code === 45;
    if (isWordChar) {
      if (start === -1) start = i;
    } else if (start !== -1) {
      const wordLen = i - start;
      if (wordLen > 2) {
        const word = lower.slice(start, i);
        if (!STOP_WORDS.has(word)) {
          targetSet.add(word);
        }
      }
      start = -1;
    }
  }
}

/**
 * Fast match counter scanning text tokens directly against a pre-built Set without string splits.
 */
export function countTokenMatches(text: string | undefined, curTokens: Set<string>): number {
  if (!text || curTokens.size === 0) return 0;
  const lower = text.toLowerCase();
  let matches = 0;
  let start = -1;
  const len = lower.length;
  for (let i = 0; i <= len; i++) {
    const code = i < len ? lower.charCodeAt(i) : 32;
    const isWordChar = (code >= 97 && code <= 122) || (code >= 48 && code <= 57) || code === 45;
    if (isWordChar) {
      if (start === -1) start = i;
    } else if (start !== -1) {
      const wordLen = i - start;
      if (wordLen > 2) {
        const word = lower.slice(start, i);
        if (curTokens.has(word)) {
          matches++;
        }
      }
      start = -1;
    }
  }
  return matches;
}

export function tokenize(text?: string): string[] {
  const set = new Set<string>();
  addTokensToSet(text, set);
  return Array.from(set);
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

export interface PreparedPostContext {
  id: string;
  tags: string[];
  primaryTag?: string;
  category: string;
  categories: string[];
  tools: string[];
  primaryTool?: string;
  tokens: Set<string>;
}

export function preparePostContext(post: Post): PreparedPostContext {
  const tokens = new Set<string>();
  addTokensToSet(post.title, tokens);
  if (post.seoKeywords) {
    for (let i = 0; i < post.seoKeywords.length; i++) {
      addTokensToSet(post.seoKeywords[i], tokens);
    }
  }

  const tags = (post.tags || []).map(t => t.trim().toLowerCase()).filter(Boolean);
  const categories = (post.categories || []).map(c => c.trim().toLowerCase()).filter(Boolean);
  const category = (post.category || categories[0] || '').trim().toLowerCase();
  const tools = (post.aiTools || []).map(t => t.trim().toLowerCase()).filter(Boolean);

  return {
    id: post.id,
    tags,
    primaryTag: tags[0],
    category,
    categories,
    tools,
    primaryTool: tools[0],
    tokens,
  };
}

export function scorePostWithContext(cur: PreparedPostContext, candidate: Post): number {
  if (candidate.id === cur.id || !isPublic(candidate)) return -1;

  let score = 0;

  // 1. Positional Tag Overlap & Starting-Tag Synergy
  const candidateTags = candidate.tags;
  if (candidateTags && candidateTags.length > 0 && cur.tags.length > 0) {
    for (let i = 0; i < cur.tags.length; i++) {
      const tag = cur.tags[i];
      let candidateIdx = -1;
      for (let j = 0; j < candidateTags.length; j++) {
        if (candidateTags[j].trim().toLowerCase() === tag) {
          candidateIdx = j;
          break;
        }
      }
      if (candidateIdx !== -1) {
        score += getTagWeight(i);
        if (candidateIdx === 0) {
          score += 12;
          if (i === 0) score += 12;
        } else if (candidateIdx === 1) {
          score += 6;
        }
      }
    }
  }

  // 2. Category Alignment
  const candCat = (candidate.category || candidate.categories?.[0] || '').trim().toLowerCase();
  if (cur.category && candCat && cur.category === candCat) {
    score += 16;
  }

  if (cur.categories.length > 0 && candidate.categories && candidate.categories.length > 0) {
    let sharedCount = 0;
    for (let i = 0; i < candidate.categories.length; i++) {
      const c = candidate.categories[i].trim().toLowerCase();
      if (cur.categories.includes(c)) {
        sharedCount++;
      }
    }
    if (sharedCount > 0) {
      score += Math.min(12, sharedCount * 6);
    }
  }

  // 3. AI Tool Compatibility
  if (cur.tools.length > 0 && candidate.aiTools && candidate.aiTools.length > 0) {
    const candPrimaryTool = candidate.aiTools[0].trim().toLowerCase();
    if (cur.primaryTool && cur.primaryTool === candPrimaryTool) {
      score += 8;
    } else {
      for (let i = 0; i < candidate.aiTools.length; i++) {
        if (cur.tools.includes(candidate.aiTools[i].trim().toLowerCase())) {
          score += 5;
          break;
        }
      }
    }
  }

  // 4. Title & SEO Keywords Token Overlap
  let tokenMatches = countTokenMatches(candidate.title, cur.tokens);
  if (candidate.seoKeywords && candidate.seoKeywords.length > 0) {
    for (let i = 0; i < candidate.seoKeywords.length; i++) {
      tokenMatches += countTokenMatches(candidate.seoKeywords[i], cur.tokens);
    }
  }
  if (tokenMatches > 0) {
    score += Math.min(20, tokenMatches * 5);
  }

  // 5. Engagement / Quality Tie-Breaker (0 to 5 points)
  const views = candidate.views || 0;
  const likes = candidate.likes || 0;
  if (views > 0 || likes > 0) {
    const engagementBonus = Math.min(5, Math.log10(likes + 1) * 1.2 + Math.log10(views + 1) * 0.4);
    score += engagementBonus;
  }

  return score;
}

/**
 * Calculate multi-factor relevance score between currentPost and a candidate post.
 */
export function scorePostRelevance(currentPost: Post, candidate: Post): number {
  const curContext = preparePostContext(currentPost);
  return scorePostWithContext(curContext, candidate);
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
  const cur = preparePostContext(currentPost);

  // Score each eligible candidate in a single fast pass
  const scored: { post: Post; score: number }[] = [];
  const unselected: Post[] = [];

  for (let i = 0; i < allPosts.length; i++) {
    const post = allPosts[i];
    if (post.id === cur.id || !isPublic(post)) continue;

    const score = scorePostWithContext(cur, post);
    if (score > 5) {
      scored.push({ post, score });
    } else {
      unselected.push(post);
    }
  }

  scored.sort((a, b) => b.score - a.score);

  const selectedIds = new Set<string>();
  const results: Post[] = [];

  for (let i = 0; i < scored.length; i++) {
    if (results.length >= limit) break;
    results.push(scored[i].post);
    selectedIds.add(scored[i].post.id);
  }

  if (results.length >= limit) {
    return results;
  }

  // Fallback Tier 1: Same category, sorted by engagement
  if (cur.category) {
    const categoryFallbacks: Post[] = [];
    for (let i = 0; i < unselected.length; i++) {
      const p = unselected[i];
      if (selectedIds.has(p.id)) continue;
      const pCat = (p.category || p.categories?.[0] || '').trim().toLowerCase();
      if (pCat === cur.category) {
        categoryFallbacks.push(p);
      }
    }
    categoryFallbacks.sort((a, b) => (b.likes || 0) + (b.views || 0) - ((a.likes || 0) + (a.views || 0)));
    for (let i = 0; i < categoryFallbacks.length; i++) {
      if (results.length >= limit) break;
      results.push(categoryFallbacks[i]);
      selectedIds.add(categoryFallbacks[i].id);
    }
  }

  // Fallback Tier 2: Same primary AI Tool
  if (results.length < limit && cur.primaryTool) {
    const toolFallbacks: Post[] = [];
    for (let i = 0; i < unselected.length; i++) {
      const p = unselected[i];
      if (selectedIds.has(p.id)) continue;
      if (p.aiTools && p.aiTools.some(t => t.trim().toLowerCase() === cur.primaryTool)) {
        toolFallbacks.push(p);
      }
    }
    toolFallbacks.sort((a, b) => (b.likes || 0) + (b.views || 0) - ((a.likes || 0) + (a.views || 0)));
    for (let i = 0; i < toolFallbacks.length; i++) {
      if (results.length >= limit) break;
      results.push(toolFallbacks[i]);
      selectedIds.add(toolFallbacks[i].id);
    }
  }

  // Fallback Tier 3: Highest engagement site-wide
  if (results.length < limit) {
    const globalFallbacks: Post[] = [];
    for (let i = 0; i < unselected.length; i++) {
      const p = unselected[i];
      if (!selectedIds.has(p.id)) {
        globalFallbacks.push(p);
      }
    }
    globalFallbacks.sort((a, b) => (b.likes || 0) + (b.views || 0) - ((a.likes || 0) + (a.views || 0)));
    for (let i = 0; i < globalFallbacks.length; i++) {
      if (results.length >= limit) break;
      results.push(globalFallbacks[i]);
      selectedIds.add(globalFallbacks[i].id);
    }
  }

  return results;
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
  const excludeIds = new Set<string>();
  excludeIds.add(currentPost.id);
  for (let i = 0; i < relatedPosts.length; i++) {
    excludeIds.add(relatedPosts[i].id);
  }

  const eligible: Post[] = [];
  for (let i = 0; i < allPosts.length; i++) {
    const p = allPosts[i];
    if (!excludeIds.has(p.id) && isPublic(p)) {
      eligible.push(p);
    }
  }

  // Prioritize featured posts, then highest engagement posts
  eligible.sort((a, b) => {
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    return (b.likes || 0) * 2 + (b.views || 0) - ((a.likes || 0) * 2 + (a.views || 0));
  });

  return eligible.slice(0, limit);
}

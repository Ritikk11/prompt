// Central home for every admin Auto-write (magic wand) prompt.
// All wands share SITE_PREAMBLE so brand voice changes happen in one place.

// Shared across every generation path (wands, post/article generators, AI
// Studio). The model names and the "only 4 tools" rule must be identical
// everywhere or generated content drifts back to generic internet knowledge.
export const TOOLS_MODELS_RULES = `SUPPORTED TOOLS & MODELS (strict — never deviate):
- This site supports ONLY these AI image tools: ChatGPT, Gemini, Grok, Qwen.
- Current models, name them exactly like this:
  - ChatGPT → "GPT Image 2" (never "DALL-E", "DALL-E 3", or "GPT-4o image")
  - Gemini → "Nano Banana 2" or "Nano Banana Pro" (never "Imagen")
  - Grok → "Grok Imagine"
  - Qwen → "Qwen-Image"
- NEVER mention or recommend any other AI tool or model — no Midjourney, DALL-E, Stable Diffusion, Claude, Leonardo, Ideogram, Flux, Firefly, Perplexity, Imagen, etc. Not in prose, examples, comparisons, tables, :::model callouts, FAQs, or tags.
- If existing content or the instruction mentions an unsupported tool, silently swap it for the closest supported tool instead of repeating it.`;

export const SITE_PREAMBLE = `You are the in-house copywriter for 'AI PromptMatrix' (aipromptmatrix.in), a curated gallery of AI image-generation prompts for tools like ChatGPT, Gemini, Grok, and Qwen. Visitors browse ready-to-use prompts with real example images. The tone is confident, practical, and human — never robotic. Avoid generic AI filler words like "Delve", "Explore", "Unleash", "Elevate", or "A collection of".

${TOOLS_MODELS_RULES}`;

export const RAW_ONLY = `Return ONLY the requested text — no quotes, no markdown fences, no conversational filler.`;

export const CALLOUT_RULES = `Article bodies support custom markdown callouts: :::tip, :::creative, :::model, :::prompt, :::warning, :::info, :::note, :::important — plus inline highlights {mark:...}, {primary:...}, {green:...}, {red:...}, {kbd:...}. The word after ::: only sets the block color and is never shown as a label. Either add a short, specific title on the same line (e.g. ":::tip Lock the pose with a reference") or leave the block untitled; NEVER title a block with the bare words "Tip", "Warning", "Note", etc. Close each block with ::: on its own line. Never use H1 (#); start at H2 (##).`;

const META_TITLE_RULES = `Strict SEO title, max 60 characters, front-load the main keyword.`;
const META_DESC_RULES = `Strict SEO meta description, 140-160 characters, natural sentence with a reason to click.`;

// ---------- Posts tab (existing wands, migrated) ----------

export const postPrompts = {
  title: (tagsStr: string) =>
    `${SITE_PREAMBLE}\nWrite a single catchy, highly clickable, human-sounding title (max 60 chars) for a new AI prompt post with these tags: ${tagsStr || 'various ai tools'}. ${RAW_ONLY}`,
  description: (title: string) =>
    `${SITE_PREAMBLE}\nWrite a short, punchy 1-2 sentence summary for the AI prompt post titled "${title}". Focus on the visual aesthetic and what the prompt achieves. ${RAW_ONLY}`,
  extendedDescription: (title: string) =>
    `${SITE_PREAMBLE}\n${CALLOUT_RULES}\nWrite a detailed, Markdown-formatted article about the AI prompt post titled "${title}". Make it conversational and focused on art direction, visual style, and practical tips for using the prompt. Use H2/H3 structure and the custom callouts where genuinely useful — don't overuse them. ${RAW_ONLY}`,
  seoTitle: (title: string) =>
    `${SITE_PREAMBLE}\n${META_TITLE_RULES}\nWrite it for an AI prompt post titled "${title}", using high-volume search keywords for AI art and the visual subject. ${RAW_ONLY}`,
  seoDescription: (title: string) =>
    `${SITE_PREAMBLE}\n${META_DESC_RULES}\nWrite it for an AI prompt post titled "${title}", weaving in keywords for AI prompts and the visual aesthetic. ${RAW_ONLY}`,
  tags: (title: string) =>
    `${SITE_PREAMBLE}\nGenerate 5-8 highly relevant, lowercase, comma-separated tags (concrete nouns for subject, style, aesthetic) for an AI prompt post titled "${title}". ${RAW_ONLY}`,
  category: (title: string) =>
    `${SITE_PREAMBLE}\nSuggest a single broad category (e.g. Anime, Realism, Photography, UI/UX, 3D Render) for an AI prompt post titled "${title}". ${RAW_ONLY}`,
  faqs: (title: string, tagsStr: string) =>
    `${SITE_PREAMBLE}\nBased on the tags "${tagsStr}" and title "${title}", generate 3 highly relevant FAQs (with answers) about using this specific AI prompt or recreating this art style. Return ONLY valid JSON: [{"question": "...", "answer": "..."}]`,
};

// ---------- Articles tab (existing wand, migrated) ----------

export const articlePrompts = {
  metaDescription: (title: string) =>
    `${SITE_PREAMBLE}\n${META_DESC_RULES}\nWrite it for an article titled "${title}". ${RAW_ONLY}`,
};

// ---------- General settings ----------

export const generalPrompts = {
  siteDescription: (siteTitle: string) =>
    `${SITE_PREAMBLE}\n${META_DESC_RULES}\nWrite the sitewide default meta description for "${siteTitle || 'AI PromptMatrix'}" — what the site is (curated AI image prompt gallery with real examples) and why to visit. ${RAW_ONLY}`,
};

// ---------- Discovery settings ----------

const TOKEN_RULES = (tokens: string[]) =>
  `You MUST include these placeholder tokens literally, exactly as written (they are replaced at render time): ${tokens.join(', ')}. Do not translate, reword, or wrap them in quotes.`;

export const discoveryPrompts = {
  exploreHeading: () =>
    `${SITE_PREAMBLE}\nWrite a short, energetic H1 heading (max 45 chars) for the Explore page, where visitors browse every prompt with filters. ${RAW_ONLY}`,
  exploreDescription: () =>
    `${SITE_PREAMBLE}\nWrite a 1-2 sentence intro for the Explore page, telling visitors they can filter every prompt by tool, tag, and style. ${RAW_ONLY}`,
  exploreMetaTitle: () =>
    `${SITE_PREAMBLE}\n${META_TITLE_RULES}\nWrite it for the Explore page (browse all AI image prompts with filters). ${RAW_ONLY}`,
  exploreMetaDescription: () =>
    `${SITE_PREAMBLE}\n${META_DESC_RULES}\nWrite it for the Explore page (browse all AI image prompts with filters). ${RAW_ONLY}`,
  toolTitle: () =>
    `${SITE_PREAMBLE}\nWrite a page heading template for per-tool listing pages. ${TOKEN_RULES(['%tool%'])} Example shape: "%tool% Prompts That Actually Work". Max 55 chars. ${RAW_ONLY}`,
  toolDescription: () =>
    `${SITE_PREAMBLE}\nWrite a 1-2 sentence intro template for per-tool listing pages. ${TOKEN_RULES(['%tool%', '%count%'])} It should mention browsing %count% curated prompts for %tool%. ${RAW_ONLY}`,
  toolMetaTitle: () =>
    `${SITE_PREAMBLE}\n${META_TITLE_RULES}\nWrite a meta title template for per-tool listing pages. ${TOKEN_RULES(['%tool%'])} ${RAW_ONLY}`,
  toolMetaDescription: () =>
    `${SITE_PREAMBLE}\n${META_DESC_RULES}\nWrite a meta description template for per-tool listing pages. ${TOKEN_RULES(['%tool%', '%count%'])} ${RAW_ONLY}`,
  tagTitle: () =>
    `${SITE_PREAMBLE}\nWrite a page heading template for per-tag listing pages. ${TOKEN_RULES(['%tag%'])} Example shape: "%tag% AI Prompts". Max 55 chars. ${RAW_ONLY}`,
  tagDescription: () =>
    `${SITE_PREAMBLE}\nWrite a 1-2 sentence intro template for per-tag listing pages. ${TOKEN_RULES(['%tag%', '%count%'])} It should mention browsing %count% curated %tag% prompts. ${RAW_ONLY}`,
  tagMetaTitle: () =>
    `${SITE_PREAMBLE}\n${META_TITLE_RULES}\nWrite a meta title template for per-tag listing pages. ${TOKEN_RULES(['%tag%'])} ${RAW_ONLY}`,
  tagMetaDescription: () =>
    `${SITE_PREAMBLE}\n${META_DESC_RULES}\nWrite a meta description template for per-tag listing pages. ${TOKEN_RULES(['%tag%', '%count%'])} ${RAW_ONLY}`,
};

// ---------- Homepage blocks ----------

const homepageBlockContext: Record<string, string> = {
  howTo: 'the "How it works" block: 3 steps showing visitors how to find a prompt, copy it, and generate their own image',
  reviewProcess: 'the "Review process" block: cards explaining how prompts are curated and quality-checked before publishing',
  promptOfDay: 'the "Prompt of the day" block: a daily featured prompt pick',
  supportedTools: 'the "Supported tools" block: which AI generators (ChatGPT, Gemini, Grok, Qwen, etc.) the prompts work with',
  guides: 'the "Guides" block: long-form how-to articles about AI image prompting',
  blog: 'the "Blog" block: latest articles and prompt news',
  creatorFeedback: 'the "Creator feedback" block: testimonials from people using the prompts',
  creativeDirections: 'the "Browse by style" block: style/aesthetic categories visitors can jump into',
};

export const homepagePrompts = {
  blockHeading: (blockKey: string) =>
    `${SITE_PREAMBLE}\nWrite a short, punchy section heading (max 40 chars) for ${homepageBlockContext[blockKey] || `the "${blockKey}" homepage section`}. ${RAW_ONLY}`,
  blockDescription: (blockKey: string) =>
    `${SITE_PREAMBLE}\nWrite a 1-2 sentence supporting line for ${homepageBlockContext[blockKey] || `the "${blockKey}" homepage section`}. ${RAW_ONLY}`,
  blockCards: (blockKey: string, cardShape: string, count: number) =>
    `${SITE_PREAMBLE}\nWrite content for ${homepageBlockContext[blockKey] || `the "${blockKey}" homepage section`}. Generate exactly ${count} cards. Return ONLY valid JSON: an array of objects shaped like ${cardShape}. Keep titles under 40 chars and descriptions under 140 chars.`,
  sectionHeroDescription: (sectionName: string, filterTags: string) =>
    `${SITE_PREAMBLE}\nWrite a 1-2 sentence hero description for the "${sectionName}" section page${filterTags ? ` (it collects prompts tagged: ${filterTags})` : ''}. Focus on what visitors will find there. ${RAW_ONLY}`,
  sectionSeoTitle: (sectionName: string) =>
    `${SITE_PREAMBLE}\n${META_TITLE_RULES}\nWrite it for the "${sectionName}" section page of the prompt gallery. ${RAW_ONLY}`,
  sectionSeoDescription: (sectionName: string, filterTags: string) =>
    `${SITE_PREAMBLE}\n${META_DESC_RULES}\nWrite it for the "${sectionName}" section page${filterTags ? ` (prompts tagged: ${filterTags})` : ''}. ${RAW_ONLY}`,
  sectionIntroContent: (sectionName: string, filterTags: string) =>
    `${SITE_PREAMBLE}\nWrite a short Markdown intro (2-3 short paragraphs, no headings) for the "${sectionName}" section page${filterTags ? ` (prompts tagged: ${filterTags})` : ''}. Explain what the style is and how to get the best results. ${RAW_ONLY}`,
  quickCardTitle: (existingTitle: string) =>
    `${SITE_PREAMBLE}\nWrite a short link-card title (max 30 chars) for a homepage quick-links card${existingTitle ? ` currently titled "${existingTitle}"` : ''} that points visitors to a popular area of the prompt gallery. ${RAW_ONLY}`,
  quickCardDescription: (cardTitle: string) =>
    `${SITE_PREAMBLE}\nWrite a one-line description (max 90 chars) for a homepage quick-links card titled "${cardTitle}". ${RAW_ONLY}`,
};

// ---------- AI Tools tab ----------

export const aiToolPrompts = {
  description: (tool: string) =>
    `${SITE_PREAMBLE}\nWrite a concise 2-sentence description for the AI generation tool "${tool}". Focus on its main capabilities and visual generation strengths. ${RAW_ONLY}`,
  badge: (tool: string) =>
    `${SITE_PREAMBLE}\nWrite a tiny badge label (2-4 words, max 22 chars) for the AI tool "${tool}" — its standout trait, e.g. "Best for realism" or "Fast & free". ${RAW_ONLY}`,
  statsHighlights: (tool: string) =>
    `${SITE_PREAMBLE}\nWrite 3 short stat highlights for the AI tool "${tool}". One per line, each in the exact format "Label: value" (e.g. "Strength: photoreal detail"). Labels max 12 chars, values max 25 chars. No bullets or numbering. ${RAW_ONLY}`,
  capabilities: (tool: string) =>
    `${SITE_PREAMBLE}\nList 4 concrete capabilities of the AI tool "${tool}" for image generation. One per line, each max 45 chars, no bullets or numbering. ${RAW_ONLY}`,
};

// ---------- Features tab ----------

export const featurePrompts = {
  keepExploringTitle: () =>
    `${SITE_PREAMBLE}\nWrite a short heading (max 35 chars) for the "Keep exploring" block shown at the bottom of pages, nudging visitors to browse more prompts. ${RAW_ONLY}`,
  keepExploringDescription: () =>
    `${SITE_PREAMBLE}\nWrite a one-sentence supporting line for the "Keep exploring" block, nudging visitors toward more prompts, tools, and styles. ${RAW_ONLY}`,
};

// ---------- Static pages tab ----------

const staticPageBriefs: Record<string, string> = {
  about: 'the About page: what AI PromptMatrix is, its mission (make AI image prompting easy to understand, test, reuse), what makes it different (curation, tool context, visual examples, editorial review), and how to get in touch',
  contact: 'the Contact page: what kinds of messages are welcome (corrections, copyright, submissions, partnerships, feedback) and what to include; the contact email is contact@aipromptmatrix.in',
  privacy: 'the Privacy Policy: what information is collected (directly provided, usage, technical), how it is used (operate site, review submissions, improve content, respond, protect platform), cookies/analytics/ads, and how to raise privacy questions',
  terms: 'the Terms of Service: responsible/lawful use, content is for creative and informational use, AI output varies, acceptable-use rules, and that terms may change',
  dmca: 'the DMCA page: respect for IP, what a takedown notice must include (the work, the URL, contact info, good-faith statement, signature), and that the Contact page is the channel',
  disclaimer: 'the Disclaimer: content is for general creative/informational purposes, AI results vary between models and sessions, no guarantee of reproducing results, third-party links are not our responsibility',
  cookies: 'the Cookies Policy: what cookies/similar tech are used for (function, preferences, analytics, advertising), the cookie types, and how visitors can manage them in their browser',
};

const LEGAL_PAGE_KEYS = new Set(['privacy', 'terms', 'dmca', 'disclaimer', 'cookies']);

export const staticPagePrompts = {
  heroSubtitle: (pageKey: string, pageLabel: string) =>
    `${SITE_PREAMBLE}\nWrite a one-sentence hero subtitle (max 140 chars) for ${staticPageBriefs[pageKey] || `the ${pageLabel} page`}. ${RAW_ONLY}`,
  metaTitle: (pageKey: string, pageLabel: string) =>
    `${SITE_PREAMBLE}\n${META_TITLE_RULES}\nWrite it for ${staticPageBriefs[pageKey] || `the ${pageLabel} page`} on AI PromptMatrix. ${RAW_ONLY}`,
  metaDescription: (pageKey: string, pageLabel: string) =>
    `${SITE_PREAMBLE}\n${META_DESC_RULES}\nWrite it for ${staticPageBriefs[pageKey] || `the ${pageLabel} page`} on AI PromptMatrix. ${RAW_ONLY}`,
  body: (pageKey: string, pageLabel: string) => {
    const legalNote = LEGAL_PAGE_KEYS.has(pageKey)
      ? ` Write in plain English a site visitor can understand — this is a general template, not legal advice, and the site owner must review it before relying on it. Do not invent specific legal claims, jurisdictions, company registration details, or dates.`
      : '';
    return `${SITE_PREAMBLE}\n${CALLOUT_RULES}\nWrite the full Markdown body for ${staticPageBriefs[pageKey] || `the ${pageLabel} page`}.${legalNote} Start with an H1 (#) matching the page purpose, then use H2 sections. Keep it scannable with short paragraphs and lists. ${RAW_ONLY}`;
  },
};

// ---------- SEO tab ----------

export const seoPrompts = {
  globalTitleTemplate: () =>
    `${SITE_PREAMBLE}\nWrite a sitewide meta-title template for prompt post pages. ${TOKEN_RULES(['%post_title%'])} Shape: "%post_title% | short brand tail". Total should fit ~60 chars with a typical title. ${RAW_ONLY}`,
  globalMetaDescription: () =>
    `${SITE_PREAMBLE}\n${META_DESC_RULES}\nWrite the sitewide fallback meta description used when a page has no custom one. ${RAW_ONLY}`,
  pageHeading: (slug: string, tags: string) =>
    `${SITE_PREAMBLE}\nWrite an H1 heading (max 55 chars) for a curated SEO landing page at "/${slug}"${tags ? ` collecting prompts tagged: ${tags}` : ''}. ${RAW_ONLY}`,
  pageSeoTitle: (slug: string, tags: string) =>
    `${SITE_PREAMBLE}\n${META_TITLE_RULES}\nWrite it for a curated landing page at "/${slug}"${tags ? ` (prompts tagged: ${tags})` : ''}. ${RAW_ONLY}`,
  pageMetaDescription: (slug: string, tags: string) =>
    `${SITE_PREAMBLE}\n${META_DESC_RULES}\nWrite it for a curated landing page at "/${slug}"${tags ? ` (prompts tagged: ${tags})` : ''}. ${RAW_ONLY}`,
  pageIntroContent: (slug: string, tags: string) =>
    `${SITE_PREAMBLE}\nWrite a short Markdown intro (2-3 short paragraphs, no headings) for a curated landing page at "/${slug}"${tags ? ` (prompts tagged: ${tags})` : ''}. Explain what visitors will find and how to use the prompts. ${RAW_ONLY}`,
};

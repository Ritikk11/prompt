import { GoogleGenAI, Type } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { fetchSettings } from "@/lib/data";
import { TOOLS_MODELS_RULES, HUMAN_WRITING_RULES } from "@/lib/admin/wandPrompts";

export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// Site context for standalone articles (blogs/guides), as opposed to prompt
// posts. Grounds the AI in this site's structure and markdown conventions.
// ---------------------------------------------------------------------------
const getSiteContext = (siteTools: string) => `SITE CONTEXT (read this before writing anything):
- This is aipromptmatrix.in, a gallery/library of AI image-generation prompts (for tools like ${siteTools}). Visitors come to find ready-to-use prompts and see the example images those prompts produce.
- ${TOOLS_MODELS_RULES}
- ${HUMAN_WRITING_RULES}
- An "article" is a standalone long-form page, separate from prompt posts. Category "blog" articles are editorial/news/opinion pieces; category "guide" articles are practical how-to tutorials about prompt writing and AI image tools.
- Articles should genuinely help this audience: people trying to write better prompts and get better results out of AI image tools.
- "tags" are short, lowercase, search/filter keywords - concrete nouns describing the topic. Reuse one of the site's EXISTING TAGS below when it genuinely fits instead of inventing a near-duplicate.
- "description" is used for search previews and article cards (strict 140-160 characters).
- "body" is the full article rendered as Markdown and supports this site's custom callout syntax (see field rules below).`;

// ---------------------------------------------------------------------------
// Field registry - what each field means, its JSON schema shape, and the
// phrases used to detect "only generate X" in the user's instruction.
// ---------------------------------------------------------------------------
type FieldKey = 'title' | 'description' | 'tags' | 'body';

const FIELD_ORDER: FieldKey[] = ['title', 'description', 'tags', 'body'];

const FIELD_INSTRUCTIONS: Record<FieldKey, string> = {
  title: `"title": A catchy, highly clickable, human-like article title. Do NOT use generic AI words like "Delve", "Explore", "Unleash", or "A Comprehensive Guide to". Make it sound natural and specific.`,
  description: `"description": A strict 140-160 character description for search previews and article cards. No quotes around it.`,
  tags: `"tags": An array of 4-7 relevant tags (strings). See tag rules in SITE CONTEXT above.`,
  body: `"body": The full article as Markdown. Aim for a genuinely useful, well-structured piece (roughly 800-1500 words) with short paragraphs, concrete examples, and actionable advice. Do not use H1 (#) as the title is already displayed. Prefer H2 (##) and H3 (###) headings. Use the site's custom markdown callout blocks where they add value:
- :::tip for practical advice, :::creative for art direction and visual style notes, :::model for model-specific behavior, :::prompt for reusable prompt snippets, :::warning only for real cautions.
- CALLOUT TITLE RULE: the word after ::: only picks the block's color/purpose and is NEVER shown as a label. Either write a short, specific title after the type on the same line (e.g. ":::tip Start from a full-body reference" or ":::warning Negative prompts are not filters") or leave it untitled (just ":::tip" on its own line) when the content speaks for itself. Never title a block with the bare words "Tip", "Warning", "Note", etc., and never repeat the same title twice.
- Close every callout with ::: on its own line.
- Inline highlights like {mark:important phrase}, {primary:key style}, {green:recommended}, or {red:avoid this} sparingly.
Keep custom blocks concise and mobile-friendly. Do not repeat the title as a heading.`,
};

// Detection phrases per field. body aliases are checked so "rewrite the body"
// or "just the article content" doesn't trigger a full regeneration.
const FIELD_ALIASES: Record<FieldKey, RegExp[]> = {
  body: [/\bbody\b/i, /\barticle[\s-]?(text|content)\b/i, /\bmain[\s-]?content\b/i, /\blong[\s-]?form\b/i],
  description: [/\bdescriptions?\b/i, /\bmeta[\s-]?description\b/i, /\bseo[\s-]?description\b/i],
  title: [/\btitles?\b/i],
  tags: [/\btags?\b/i],
};

function detectRequestedFields(instruction: string): FieldKey[] {
  if (!instruction || !instruction.trim()) return [];
  const lower = instruction.toLowerCase();

  // Explicit "everything / all fields" phrasing always means full generation.
  if (/\b(everything|all fields|all details|full article|entire article|whole article)\b/.test(lower)) {
    return [];
  }

  const matched: FieldKey[] = [];
  for (const key of FIELD_ORDER) {
    if (FIELD_ALIASES[key].some((re) => re.test(instruction))) {
      matched.push(key);
    }
  }
  return matched;
}

function buildResponseSchema(fields: FieldKey[]) {
  const properties: Record<string, any> = {};
  for (const field of fields) {
    if (field === 'tags') {
      properties.tags = { type: Type.ARRAY, items: { type: Type.STRING } };
    } else {
      properties[field] = { type: Type.STRING };
    }
  }
  return {
    type: Type.OBJECT,
    properties,
    required: fields,
  };
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (auth.error) return auth.error;

    const { topic, category, promptInstruction, existingArticles, existingTags, currentFields } = await req.json();

    const safeTopic = String(topic || '').slice(0, 300).trim();
    const safeInstruction = String(promptInstruction || '').slice(0, 2000).trim();

    if (!safeTopic && !safeInstruction) {
      return NextResponse.json({ error: 'Provide a working title or an instruction describing the article.' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API Key is missing.' },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const safeCategory = category === 'guide' ? 'guide' : 'blog';

    const safeExistingArticles = Array.isArray(existingArticles) ? existingArticles.slice(0, 15) : [];
    const existingArticlesText = safeExistingArticles.length
      ? `\nHere are titles and descriptions of the site's existing articles (match their tone; do NOT duplicate their topics):\n` +
        safeExistingArticles.map((a: any) => `- Title: ${String(a?.title || '').slice(0, 180)}\n  Description: ${String(a?.description || '').slice(0, 300)}`).join('\n')
      : '';

    const safeTags = Array.isArray(existingTags) ? Array.from(new Set(existingTags.filter(Boolean))).slice(0, 100) : [];
    const taxonomyText = `\nEXISTING TAGS on the site (reuse where they fit): ${safeTags.length ? safeTags.join(', ') : '(none yet)'}\n`;

    const requestedFields = detectRequestedFields(safeInstruction);
    const fieldsToGenerate = requestedFields.length > 0 ? requestedFields : FIELD_ORDER;
    const isPartial = requestedFields.length > 0;

    const fieldInstructionsText = fieldsToGenerate
      .map((key, idx) => `${idx + 1}. ${FIELD_INSTRUCTIONS[key]}`)
      .join('\n');

    const customInstructionText = safeInstruction
      ? `\nSpecial User Instructions: ${safeInstruction}\n`
      : '';

    const focusNotice = isPartial
      ? `\nThe user has asked you to generate ONLY the following field(s): ${fieldsToGenerate.join(', ')}. The response schema below only contains these fields - do not attempt to add any others.\n`
      : '';

    const currentFieldsText = currentFields
      ? `\nCURRENT FIELD VALUES (for context; if rewriting, use these as a starting point):\n${JSON.stringify(currentFields, null, 2).slice(0, 8000)}\n`
      : '';

    const topicText = safeTopic
      ? `The article's working title / topic is: "${safeTopic}".`
      : `No working title was given - derive the topic from the Special User Instructions above.`;

    const settings = await fetchSettings();
    const siteTools = settings.aiTools && settings.aiTools.length > 0 ? settings.aiTools.join(', ') : 'ChatGPT, Gemini, Grok, Qwen';
    const SITE_CONTEXT = getSiteContext(siteTools);

    const systemPrompt = `You are an expert content writer and SEO specialist working on articles for this specific site.

${SITE_CONTEXT}
${taxonomyText}${existingArticlesText}${customInstructionText}${focusNotice}${currentFieldsText}
You are writing a "${safeCategory}" article. ${topicText}

Generate the following field(s) in JSON format:
${fieldInstructionsText}

Output JSON only, no markdown formatting (like \`\`\`json).
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: systemPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: buildResponseSchema(fieldsToGenerate),
      }
    });

    const text = response.text || "{}";
    const data = JSON.parse(text);

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error generating article:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

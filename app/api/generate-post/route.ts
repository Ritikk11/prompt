import { GoogleGenAI, Type } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// Site context â€” this is what grounds the AI in *this specific site's*
// structure so it doesn't treat every field as generic blog copy.
// ---------------------------------------------------------------------------
const SITE_CONTEXT = `SITE CONTEXT (read this before writing anything):
- This is aipromptmatrix.in, a gallery/library of AI image-generation prompts (for tools like ChatGPT/DALL-E, Gemini, Grok, Qwen, Midjourney, etc). Visitors come to find ready-to-use prompts and see the example images those prompts produce.
- A "post" bundles one or more images generated from a text prompt, plus editorial content around it.
- "tags" are short, lowercase, search/filter keywords used for "related posts" â€” not generic blog hashtags. Stick to concrete nouns describing subject, style, or tool present in the images/prompts (e.g. "anime portrait", "gemini", "retro saree", "couple photography"). Reuse one of the site's EXISTING TAGS below when it genuinely fits instead of inventing a near-duplicate.
- "category" is one single broad grouping shared across many posts. Reuse one of the EXISTING CATEGORIES below if the post fits; only invent a new one if none apply.
- "extendedDescription" is the long-form article body rendered under the post, and supports this site's custom markdown callout syntax (see below).
- "faqs" render as an accordion under the post for SEO/rich-snippet purposes.
- "schemaType" controls the Schema.org structured data emitted for the post.`;

// ---------------------------------------------------------------------------
// Field registry â€” single source of truth for: what each field means, its
// JSON schema shape, and the phrases used to detect "only generate X".
// ---------------------------------------------------------------------------
type FieldKey = 'title' | 'seoTitle' | 'description' | 'seoDescription' | 'extendedDescription' | 'tags' | 'category' | 'schemaType' | 'faqs';

const FIELD_ORDER: FieldKey[] = ['title', 'seoTitle', 'description', 'seoDescription', 'extendedDescription', 'tags', 'category', 'schemaType', 'faqs'];

const FIELD_INSTRUCTIONS: Record<FieldKey, string> = {
  title: `"title": A catchy, highly clickable, and human-like title. Do NOT use generic AI words like "Delve", "Explore", or "A collection of". Make it sound natural.`,
  seoTitle: `"seoTitle": An SEO-optimized title (different from main title, max 60 chars).`,
  description: `"description": A short, engaging summary (1-2 sentences).`,
  seoDescription: `"seoDescription": An SEO-optimized meta description (max 160 chars) weaving in high-volume visual keywords.`,
  extendedDescription: `"extendedDescription": A longer, detailed Markdown-formatted article about these prompts, the style they create, the vibe, and tips for using them. Make it conversational and engaging, using paragraphs and bullet points if needed. Do not use H1 (#) as the main title is already displayed. Prefer H2 (##), H3 (###), H4 (####), and occasional H5 (#####) headings. Use the site's custom markdown callout blocks when useful:
- :::tip for practical advice, :::creative for art direction and visual style notes, :::model for model-specific behavior, :::prompt for reusable prompt snippets, :::warning only for real cautions.
- CALLOUT TITLE RULE: the word after ::: only picks the block's color/purpose and is NEVER shown as a label. Either write a short, specific title after the type on the same line (e.g. ":::tip Lock the pose with a reference" or ":::warning Style stacking backfires here") or leave it untitled (just ":::tip" on its own line) when the content speaks for itself. Never title a block with the bare words "Tip", "Warning", "Note", etc., and never repeat the same title twice.
- Close every callout with ::: on its own line.
- Inline highlights like {mark:important phrase}, {primary:key style}, {green:recommended}, or {red:avoid this} sparingly.
Keep custom blocks concise and mobile-friendly.`,
  tags: `"tags": An array of 5-8 relevant tags (strings). See tag rules in SITE CONTEXT above.`,
  category: `"category": A single, broad category for these images. See category rules in SITE CONTEXT above.`,
  schemaType: `"schemaType": Select the most appropriate Schema.org type from: "Article", "HowTo", or "CreativeWork".`,
  faqs: `"faqs": An array of 2 to 3 frequently asked questions (and answers) relevant to this specific image style, prompt technique, or subject. Format: [{"question": "...", "answer": "..."}].`,
};

// Detection phrases per field. Order/specificity matters: seoTitle/seoDescription
// and extendedDescription are checked before the plainer title/description so
// "seo title" doesn't also trigger a bare "title" match, etc.
const FIELD_ALIASES: Record<FieldKey, RegExp[]> = {
  seoTitle: [/\bseo[\s-]?title\b/i, /\bmeta[\s-]?title\b/i],
  seoDescription: [/\bseo[\s-]?description\b/i, /\bmeta[\s-]?description\b/i],
  extendedDescription: [/\bextended[\s-]?description\b/i, /\blong[\s-]?description\b/i, /\barticle[\s-]?body\b/i, /\bmain[\s-]?content\b/i, /\bbody[\s-]?text\b/i],
  title: [/(?<!seo[\s-])(?<!meta[\s-])\btitles?\b/i],
  description: [/(?<!seo[\s-])(?<!meta[\s-])(?<!extended[\s-])(?<!long[\s-])\bdescriptions?\b/i],
  tags: [/\btags?\b/i],
  category: [/\bcategor(y|ies)\b/i],
  schemaType: [/\bschema([\s-]?type)?\b/i, /schema\.org/i],
  faqs: [/\bfaqs?\b/i, /frequently asked questions/i],
};

function detectRequestedFields(instruction: string): FieldKey[] {
  if (!instruction || !instruction.trim()) return [];
  const lower = instruction.toLowerCase();

  // Explicit "everything / all fields" phrasing always means full generation.
  if (/\b(everything|all fields|all details|full post|entire post)\b/.test(lower)) {
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
    switch (field) {
      case 'tags':
        properties.tags = { type: Type.ARRAY, items: { type: Type.STRING } };
        break;
      case 'faqs':
        properties.faqs = {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              answer: { type: Type.STRING },
            },
            required: ['question', 'answer'],
          },
        };
        break;
      case 'schemaType':
        properties.schemaType = { type: Type.STRING, enum: ['Article', 'HowTo', 'CreativeWork'] };
        break;
      default:
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

    const { images, existingPosts, promptInstruction, existingCategories, existingTags } = await req.json();

    if (!Array.isArray(images) || images.length === 0 || images.length > 12) {
      return NextResponse.json({ error: 'Invalid image prompt count' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API Key is missing.' },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const formattedImages = images
      .map((img: any, idx: number) => `Image ${idx + 1} Prompt: ${String(img?.prompt || '').slice(0, 4000)}`)
      .join('\n');
    const safeExistingPosts = Array.isArray(existingPosts) ? existingPosts.slice(0, 30) : [];
    const recentPostsText = safeExistingPosts.length
      ? `\nHere are some titles and descriptions from my existing posts to understand my style (use humanized, engaging language):\n` +
        safeExistingPosts.map((p: any) => `- Title: ${String(p?.title || '').slice(0, 180)}\n  Description: ${String(p?.description || '').slice(0, 500)}`).join('\n')
      : '';

    const safeCategories = Array.isArray(existingCategories) ? Array.from(new Set(existingCategories.filter(Boolean))).slice(0, 60) : [];
    const safeTags = Array.isArray(existingTags) ? Array.from(new Set(existingTags.filter(Boolean))).slice(0, 150) : [];
    const taxonomyText = `\nEXISTING CATEGORIES on the site: ${safeCategories.length ? safeCategories.join(', ') : '(none yet)'}\nEXISTING TAGS on the site (reuse where they fit): ${safeTags.length ? safeTags.join(', ') : '(none yet)'}\n`;

    // Determine which fields are actually being requested. An empty
    // instruction, or one that doesn't reference any specific field, means
    // "generate the full post" (all fields) â€” same as before.
    const requestedFields = detectRequestedFields(promptInstruction);
    const fieldsToGenerate = requestedFields.length > 0 ? requestedFields : FIELD_ORDER;
    const isPartial = requestedFields.length > 0;

    const fieldInstructionsText = fieldsToGenerate
      .map((key, idx) => `${idx + 1}. ${FIELD_INSTRUCTIONS[key]}`)
      .join('\n');

    const customInstructionText = promptInstruction
      ? `\nSpecial User Instructions: ${String(promptInstruction).slice(0, 2000)}\n`
      : '';

    const focusNotice = isPartial
      ? `\nThe user has asked you to generate ONLY the following field(s): ${fieldsToGenerate.join(', ')}. The response schema below only contains these fields â€” do not attempt to add any others.\n`
      : '';

    const systemPrompt = `You are an expert copywriter and SEO specialist working on posts for this specific site.

${SITE_CONTEXT}
${taxonomyText}${recentPostsText}${customInstructionText}${focusNotice}
Here are the text prompts the user used to create the images:
${formattedImages}

Please visually analyze the attached images (lighting, composition, art style, subject matter) and combine that with the text prompts to generate the following field(s) in JSON format:
${fieldInstructionsText}

Output JSON only, no markdown formatting (like \`\`\`json).
`;

    // Fetch up to 3 images to send to Gemini Vision
    const imageParts: any[] = [];
    const imagesToFetch = images.filter((img: any) => img.url).slice(0, 3);

    for (const img of imagesToFetch) {
      try {
        const imgRes = await fetch(img.url);
        if (imgRes.ok) {
          const arrayBuffer = await imgRes.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const base64Data = buffer.toString('base64');
          const mimeType = imgRes.headers.get('content-type') || 'image/jpeg';

          imageParts.push({
            inlineData: {
              data: base64Data,
              mimeType
            }
          });
        }
      } catch (err) {
        console.error('Failed to fetch image for AI analysis:', img.url, err);
      }
    }

    const contents = [systemPrompt, ...imageParts];

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: buildResponseSchema(fieldsToGenerate),
      }
    });

    const text = response.text || "{}";
    const data = JSON.parse(text);

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error generating post:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

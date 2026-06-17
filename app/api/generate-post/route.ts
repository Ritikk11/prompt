import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";


export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (auth.error) return auth.error;

    const { images, existingPosts, promptInstruction } = await req.json();

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

    const customInstructionText = promptInstruction 
      ? `\nSpecial User Instructions: ${String(promptInstruction).slice(0, 2000)}\n`
      : '';

    const systemPrompt = `You are an expert copywriter and SEO specialist for an AI image prompt gallery.
Your task is to write the details for a new post based on the image prompts provided by the user.

${recentPostsText}${customInstructionText}
Here are the image prompts the user has created:
${formattedImages}

Please generate the following fields in JSON format:
1. "title": A catchy, humanized, and engaging title for this collection.
2. "seoTitle": An SEO-optimized title (different from main title, max 60 chars).
3. "description": A short, engaging summary (1-2 sentences).
4. "seoDescription": An SEO-optimized meta description (max 160 chars).
5. "extendedDescription": A longer, detailed Markdown-formatted article about these prompts, the style they create, the vibe, and tips for using them. Make it conversational and engaging, using paragraphs and bullet points if needed. Do not use H1 (#) as the main title is already displayed. Prefer H2 (##), H3 (###), H4 (####), and occasional H5 (#####) headings. Use the site's custom markdown styles when useful:
- :::tip ... ::: for practical advice.
- :::creative ... ::: for art direction and visual style notes.
- :::model ... ::: for model-specific behavior.
- :::prompt ... ::: for reusable prompt snippets.
- :::warning ... ::: only for real cautions.
- Inline highlights like {mark:important phrase}, {primary:key style}, {green:recommended}, or {red:avoid this} sparingly.
Keep custom blocks concise and mobile-friendly.
6. "tags": An array of 5-8 relevant comma-separated tags (strings).
7. "category": A single, broad category for these images.

Output JSON only, no markdown formatting (like \`\`\`json).
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: systemPrompt,
      config: {
        responseMimeType: "application/json",
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

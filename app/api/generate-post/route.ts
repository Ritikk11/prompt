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
Your task is to write the details for a new post based on the image prompts provided by the user. I have also attached the actual generated images for you to visually analyze.

${recentPostsText}${customInstructionText}
Here are the text prompts the user used to create the images:
${formattedImages}

Please visually analyze the attached images (lighting, composition, art style, subject matter) and combine that with the text prompts to generate the following fields in JSON format:
1. "title": A catchy, highly clickable, and human-like title. Do NOT use generic AI words like "Delve", "Explore", or "A collection of". Make it sound natural.
2. "seoTitle": An SEO-optimized title (different from main title, max 60 chars).
3. "description": A short, engaging summary (1-2 sentences).
4. "seoDescription": An SEO-optimized meta description (max 160 chars) weaving in high-volume visual keywords.
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
8. "schemaType": Select the most appropriate Schema.org type from: "Article", "HowTo", or "CreativeWork".
9. "faqs": An array of 2 to 3 frequently asked questions (and answers) relevant to this specific image style, prompt technique, or subject. Format: [{"question": "...", "answer": "..."}].

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

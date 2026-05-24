export const runtime = 'edge';
import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";


export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    const { images, existingPosts, promptInstruction } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API Key is missing.' },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const formattedImages = images.map((img: any, idx: number) => `Image ${idx + 1} Prompt: ${img.prompt}`).join('\n');
    const recentPostsText = existingPosts?.length 
      ? `\nHere are some titles and descriptions from my existing posts to understand my style (use humanized, engaging language):\n` + 
        existingPosts.map((p: any) => `- Title: ${p.title}\n  Description: ${p.description}`).join('\n')
      : '';

    const customInstructionText = promptInstruction 
      ? `\nSpecial User Instructions: ${promptInstruction}\n`
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
5. "extendedDescription": A longer, detailed Markdown-formatted article about these prompts, the style they create, the vibe, and tips for using them. Make it conversational and engaging, using paragraphs and bullet points if needed. Do not use H1 (#) as the main title is already displayed. Use H2 (##) or H3 (###) if you need headers.
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

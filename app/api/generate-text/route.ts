import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (auth.error) return auth.error;

    const { prompt, systemContext, imageUrl } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API Key is missing.' },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    let fullPrompt = prompt;
    if (systemContext) {
      fullPrompt = `System Context:\n${systemContext}\n\nUser Prompt:\n${prompt}\n\nPlease respond with just the raw text output requested, with no conversational filler like "Here is the text:" or surrounding markdown quotes unless markdown formatting is explicitly requested.`;
    }

    const contents: any[] = [{ text: fullPrompt }];

    if (imageUrl) {
      try {
        const imgRes = await fetch(imageUrl);
        if (imgRes.ok) {
          const arrayBuffer = await imgRes.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const base64Data = buffer.toString('base64');
          const mimeType = imgRes.headers.get('content-type') || 'image/jpeg';
          contents.push({
            inlineData: {
              data: base64Data,
              mimeType
            }
          });
        }
      } catch (err) {
        console.error('Failed to fetch image for AI Studio:', err);
      }
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contents,
    });

    const text = response.text || "";

    return NextResponse.json({ text: text.trim() });
  } catch (error: any) {
    console.error('Error generating text:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

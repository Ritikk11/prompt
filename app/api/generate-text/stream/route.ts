import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = 'force-dynamic';

interface IncomingMessage {
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
}

// Convert a data-URL / remote image into a Gemini inlineData part.
async function imagePart(imageUrl: string) {
  if (imageUrl.startsWith('data:')) {
    const match = imageUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
    if (match) return { inlineData: { mimeType: match[1], data: match[2] } };
    return null;
  }
  try {
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) return null;
    const buffer = Buffer.from(await imgRes.arrayBuffer());
    return {
      inlineData: {
        data: buffer.toString('base64'),
        mimeType: imgRes.headers.get('content-type') || 'image/jpeg',
      },
    };
  } catch {
    return null;
  }
}

// Streaming text endpoint for AI Studio. Multi-turn history is sent as a real
// `contents` array (roles user/model) rather than a concatenated string, and
// tokens are streamed back as plain text via a Web ReadableStream — natively
// supported on the Node runtime / workerd (OpenNext Cloudflare) deployment.
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (auth.error) return auth.error;

    const { messages, systemContext, model: requestedModel } = await req.json() as {
      messages: IncomingMessage[];
      systemContext?: string;
      model?: string;
    };

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'messages array is required' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Gemini API Key is missing.' }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const validModels = ['gemini-2.5-flash', 'gemini-2.5-flash-lite'];
    const targetModel = validModels.includes(requestedModel || '') ? requestedModel! : 'gemini-2.5-flash';

    // Build multi-turn contents. Only the latest user message carries an image
    // attachment (older turns keep just their text to stay light).
    const contents: any[] = [];
    for (let i = 0; i < messages.length; i += 1) {
      const m = messages[i];
      const parts: any[] = [{ text: m.content }];
      if (m.imageUrl && i === messages.length - 1) {
        const part = await imagePart(m.imageUrl);
        if (part) parts.push(part);
      }
      contents.push({ role: m.role === 'assistant' ? 'model' : 'user', parts });
    }

    const config = systemContext ? { systemInstruction: systemContext } : undefined;

    // Try the requested model; on failure fall back to flash-lite. The fallback
    // happens before the first token, so the client always sees a clean stream.
    let streamResult;
    try {
      streamResult = await ai.models.generateContentStream({ model: targetModel, contents, config });
    } catch (modelErr: any) {
      console.warn(`Stream model ${targetModel} failed (${modelErr?.message}), falling back to flash-lite...`);
      streamResult = await ai.models.generateContentStream({ model: 'gemini-2.5-flash-lite', contents, config });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const chunk of streamResult) {
            const text = chunk.text ?? '';
            if (text) controller.enqueue(encoder.encode(text));
          }
        } catch (streamErr: any) {
          controller.enqueue(
            encoder.encode(`\n\n⚠️ Stream interrupted: ${streamErr?.message || 'unknown error'}`)
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error: any) {
    console.error('Error streaming text:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

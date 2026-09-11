import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { safeFetchImage, MAX_IMAGE_BYTES } from "@/lib/safe-fetch";
import { isMaasConfigured, isMaasModel, callMaasWithFallback, DEFAULT_POST_ARTICLE_FALLBACKS, getMaasDefaultModel } from "@/lib/admin/maas-client";

// Only inert raster types — same allowlist as the upload route. Without this
// check a caller could pass data:image/svg+xml (or any other active MIME) and
// have it forwarded to Gemini inside inlineData.
const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif',
]);

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (auth.error) return auth.error;

    const { prompt, systemContext, imageUrl, json, model: requestedModel, generateImage, enableSearch } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    if (!isMaasConfigured() && !process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'AI API Key is missing (neither MAAS_API_KEY nor GEMINI_API_KEY configured).' },
        { status: 500 }
      );
    }

    // Handle Image Generation requests
    if (generateImage || requestedModel === 'imagen-3.0-generate-002') {
      if (process.env.GEMINI_API_KEY) {
        try {
          const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
          const imageResponse = await ai.models.generateImages({
            model: 'imagen-3.0-generate-002',
            prompt: prompt,
            config: {
              numberOfImages: 1,
              outputMimeType: 'image/jpeg',
              aspectRatio: '1:1',
            },
          });

          const imageBytes = imageResponse.generatedImages?.[0]?.image?.imageBytes;
          if (imageBytes) {
            const generatedDataUrl = `data:image/jpeg;base64,${imageBytes}`;
            return NextResponse.json({
              text: `Generated image for prompt: "${prompt}"`,
              generatedImageUrl: generatedDataUrl,
              isImage: true,
            });
          }
        } catch (err: any) {
          console.warn('Imagen 3 API failed or not enabled on key, falling back to FLUX/Pollinations:', err.message);
        }
      }

      // Fallback to high quality FLUX / Pollinations URL
      const seed = Math.floor(Math.random() * 1000000);
      const fallbackUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&seed=${seed}&nologo=true&model=flux`;
      return NextResponse.json({
        text: `Generated image for prompt: "${prompt}"`,
        generatedImageUrl: fallbackUrl,
        isImage: true,
      });
    }

    // 1. If requested model is a MaaS model (DeepSeek, Qwen, etc.) or MaaS is configured
    if (isMaasConfigured() && (isMaasModel(requestedModel) || !requestedModel)) {
      try {
        const maasMessages: any[] = [];
        if (systemContext) {
          maasMessages.push({
            role: 'system',
            content: `${systemContext}\n\nPlease respond with clear, well-formatted markdown. If writing code, enclose code in proper markdown backticks with language tags (e.g. \`\`\`typescript ... \`\`\`).`,
          });
        }
        maasMessages.push({ role: 'user', content: prompt });

        const targetModel = requestedModel || getMaasDefaultModel();
        const result = await callMaasWithFallback({
          models: [targetModel, ...DEFAULT_POST_ARTICLE_FALLBACKS],
          messages: maasMessages,
          json: Boolean(json),
          enableSearch: Boolean(enableSearch),
        });

        return NextResponse.json({ text: result.content });
      } catch (maasErr: any) {
        console.warn(`MaaS text generation failed, falling back to Gemini:`, maasErr?.message);
        if (!process.env.GEMINI_API_KEY) {
          throw maasErr;
        }
      }
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API Key is missing.' },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // Determine model (fallback to gemini-2.5-flash)
    const validModels = ['gemini-2.5-flash', 'gemini-2.5-flash-lite'];
    const targetModel = validModels.includes(requestedModel) ? requestedModel : 'gemini-2.5-flash';
    
    let fullPrompt = prompt;
    if (systemContext) {
      fullPrompt = `System Context:\n${systemContext}\n\nUser Prompt:\n${prompt}\n\nPlease respond with clear, well-formatted markdown. If writing code, enclose code in proper markdown backticks with language tags (e.g. \`\`\`typescript ... \`\`\`).`;
    }

    const contents: any[] = [{ text: fullPrompt }];

    if (imageUrl) {
      try {
        if (imageUrl.startsWith('data:')) {
          const match = imageUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
          // Guard: reject non-raster MIME types (e.g. image/svg+xml) from data URLs.
          if (match && ALLOWED_IMAGE_MIME_TYPES.has(match[1])) {
            contents.push({
              inlineData: {
                mimeType: match[1],
                data: match[2],
              },
            });
          }
        } else {
          const imgRes = await safeFetchImage(imageUrl);
          if (imgRes && imgRes.ok) {
            const arrayBuffer = await imgRes.arrayBuffer();
            // Guard: skip oversized images to avoid exhausting Worker memory.
            if (arrayBuffer.byteLength <= MAX_IMAGE_BYTES) {
              const buffer = Buffer.from(arrayBuffer);
              const base64Data = buffer.toString('base64');
              const mimeType = imgRes.headers.get('content-type') || 'image/jpeg';
              contents.push({
                inlineData: {
                  data: base64Data,
                  mimeType,
                },
              });
            }
          }
        }
      } catch (err) {
        console.error('Failed to process image for AI Studio:', err);
      }
    }

    let response;
    try {
      response = await ai.models.generateContent({
        model: targetModel,
        contents: contents,
        ...(json ? { config: { responseMimeType: "application/json" } } : {}),
      });
    } catch (modelErr: any) {
      console.warn(`Primary model ${targetModel} failed (${modelErr.message}), falling back to gemini-2.5-flash-lite...`);
      response = await ai.models.generateContent({
        model: "gemini-2.5-flash-lite",
        contents: contents,
        ...(json ? { config: { responseMimeType: "application/json" } } : {}),
      });
    }

    const text = response.text || "";
    return NextResponse.json({ text: text.trim() });
  } catch (error: any) {
    console.error('Error generating text:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

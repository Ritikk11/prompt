import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { safeFetchImage, MAX_IMAGE_BYTES } from "@/lib/safe-fetch";
import { fetchSettings } from "@/lib/data";
import { isMaasConfigured, isMaasModel, callMaasWithFallback, DEFAULT_POST_ARTICLE_FALLBACKS, getMaasDefaultModel } from "@/lib/admin/maas-client";
import { getActiveAiProvider, getGeminiModel, getMaasModel, GEMINI_FALLBACKS } from "@/lib/ai-config";

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

    const settings = await fetchSettings();
    const preferredProvider = getActiveAiProvider(settings);

    // Determine target provider:
    // If a specific model was requested, match its provider; otherwise use the admin's preferred provider.
    let targetProvider: 'gemini' | 'maas' = preferredProvider;
    if (requestedModel) {
      if (isMaasModel(requestedModel)) {
        targetProvider = 'maas';
      } else {
        targetProvider = 'gemini';
      }
    }

    async function executeMaaS(): Promise<string | null> {
      if (!isMaasConfigured()) return null;
      const maasMessages: any[] = [];
      if (systemContext) {
        maasMessages.push({
          role: 'system',
          content: `${systemContext}\n\nPlease respond with clear, well-formatted markdown. If writing code, enclose code in proper markdown backticks with language tags (e.g. \`\`\`typescript ... \`\`\`).`,
        });
      }
      maasMessages.push({ role: 'user', content: prompt });

      const model = requestedModel && isMaasModel(requestedModel)
        ? requestedModel
        : getMaasModel(settings);

      const modelsToTry = Array.from(new Set([model, ...DEFAULT_POST_ARTICLE_FALLBACKS]));
      const result = await callMaasWithFallback({
        models: modelsToTry,
        messages: maasMessages,
        json: Boolean(json),
        enableSearch: Boolean(enableSearch),
      });

      return result.content;
    }

    async function executeGemini(): Promise<string | null> {
      if (!process.env.GEMINI_API_KEY) return null;
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

      const model = requestedModel && !isMaasModel(requestedModel)
        ? requestedModel
        : getGeminiModel(settings);

      let fullPrompt = prompt;
      if (systemContext) {
        fullPrompt = `System Context:\n${systemContext}\n\nUser Prompt:\n${prompt}\n\nPlease respond with clear, well-formatted markdown. If writing code, enclose code in proper markdown backticks with language tags (e.g. \`\`\`typescript ... \`\`\`).`;
      }

      const contents: any[] = [{ text: fullPrompt }];

      if (imageUrl) {
        try {
          if (imageUrl.startsWith('data:')) {
            const match = imageUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
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
              if (arrayBuffer.byteLength <= MAX_IMAGE_BYTES) {
                const buffer = Buffer.from(arrayBuffer);
                contents.push({
                  inlineData: {
                    data: buffer.toString('base64'),
                    mimeType: imgRes.headers.get('content-type') || 'image/jpeg',
                  },
                });
              }
            }
          }
        } catch (err) {
          console.error('Failed to process image for Gemini:', err);
        }
      }

      const modelsToTry = Array.from(new Set([model, ...GEMINI_FALLBACKS]));
      for (const m of modelsToTry) {
        try {
          const res = await ai.models.generateContent({
            model: m,
            contents: contents,
            ...(json ? { config: { responseMimeType: 'application/json' } } : {}),
          });
          const txt = res.text || '';
          if (txt) return txt;
        } catch (err: any) {
          console.warn(`Gemini model ${m} failed for text generation:`, err?.message);
        }
      }
      return null;
    }

    let generatedText: string | null = null;
    if (targetProvider === 'gemini') {
      try {
        generatedText = await executeGemini();
      } catch (err: any) {
        console.warn('Gemini execution error, falling back to MaaS:', err?.message);
      }
      if (!generatedText && isMaasConfigured()) {
        try {
          generatedText = await executeMaaS();
        } catch (err: any) {
          console.warn('Fallback to MaaS also failed:', err?.message);
        }
      }
    } else {
      try {
        generatedText = await executeMaaS();
      } catch (err: any) {
        console.warn('MaaS execution error, falling back to Gemini:', err?.message);
      }
      if (!generatedText && process.env.GEMINI_API_KEY) {
        try {
          generatedText = await executeGemini();
        } catch (err: any) {
          console.warn('Fallback to Gemini also failed:', err?.message);
        }
      }
    }

    if (!generatedText) {
      return NextResponse.json({ error: 'AI generation failed across all available providers and fallback models.' }, { status: 500 });
    }

    return NextResponse.json({ text: generatedText.trim() });
  } catch (error: any) {
    console.error('Error generating text:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

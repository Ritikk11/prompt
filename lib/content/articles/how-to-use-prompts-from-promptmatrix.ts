import type { Article } from '../types';

const article: Article = {
  slug: 'how-to-use-prompts-from-promptmatrix',
  title: 'How to Use PromptSoul: From Browsing to Your First Masterpiece',
  seoTitle: 'How to Use PromptSoul: Step-by-Step AI Prompting Guide',
  seoDescription:
    'A masterclass walkthrough of PromptSoul: discover verified prompts, inspect prompt cards with real output photos, copy exact syntax, and generate stunning AI art in ChatGPT or Gemini.',
  description:
    'A complete visual walkthrough of PromptSoul: find verified prompts, inspect real output examples, copy exact syntax, and generate flawless AI imagery in ChatGPT and Gemini.',
  category: 'guide',
  tags: ['getting started', 'promptsoul', 'copy prompts', 'beginners', 'ai art', 'workflow'],
  readMinutes: 9,
  datePublished: '2026-03-10',
  dateModified: '2026-09-19',
  icon: 'book',
  featured: true,
  thumbnailUrl: '/thumbnails/how-to-use-prompts-from-promptmatrix.webp',
  body: `
**PromptSoul** is an open, curated library of tested, copy-ready prompts for state-of-the-art AI image generators — including ChatGPT (DALL-E 3 & GPT-4o), Google Gemini (Imagen 3), Grok Imagine, Midjourney, and Qwen Image. 

Every single entry in our library is paired with **real visual proof**: unedited sample images generated using the exact prompt text shown on the card. You never have to guess whether a prompt actually works, wonder which model generated it, or waste credits on broken syntax.

This masterclass guide takes you through the full workflow: discovering the right prompt, decoding card metadata, executing flawless photo-edit transformations, and surgically refining your outputs into breathtaking digital art.

---

## Step 1: Discover Tested Prompts on the Explore Page

Your creative journey begins at the [explore page](/explore), where the entire prompt archive is organized into an intuitive visual grid. Each prompt card showcases the primary output thumbnail, the prompt title, the underlying AI tool, and relevant aesthetic tags.

![80s Bollywood Rainy Cinema Portrait](https://uploads.aipromptmatrix.in/thumbnails/80s-bollywood-rainy-cinema-portrait-mtvwnq24kzn6.webp "Verified prompt showcase: '80s Bollywood Rainy Cinema Portrait', tested in ChatGPT with authentic 35mm film grain.")

### Filter by AI Generator Tool
Different AI models interpret text through entirely different architectural lenses. A prompt packed with Midjourney-style weighting parameters (\`--ar 16:9 --v 6.0 --s 250\`) will confuse ChatGPT, while a natural-language photo transformation written for Gemini won't function inside a pure text-to-image engine.

If you have an active subscription or preference for a specific tool, jump straight to its dedicated collection:
- [ChatGPT Image Prompts](/tool/chatgpt) — Natural language, conversational instructions, and narrative cinematic portraits.
- [Gemini Image Prompts](/tool/gemini) — High-fidelity realism, complex lighting physics, and reference photo editing.
- [Midjourney Prompts](/tool/midjourney) — Stylized aesthetic rendering, parameter-driven lighting, and artistic concept art.
- [Grok Prompts](/tool/grok) — Fast, candid, unfiltered artistic and meme styles.

:::tip Match the Model First
If you are using a free account with Gemini or ChatGPT, always start by filtering for that specific tool. Using prompts confirmed to work on your chosen model eliminates frustrating trial-and-error.
:::

---

## Step 2: Decode the Prompt Card & Input Requirements

Clicking any card opens the complete prompt post. Before tapping the copy button, take thirty seconds to review the card layout. Each card provides critical details that determine your generation success:

![80s Indian Fashion Saree Portrait](https://uploads.aipromptmatrix.in/thumbnails/80s-indian-fashion-saree-portrait-mtwoh5jrhy2j.webp "Photo-edit transformation showcase: '80s Indian Fashion Saree Portrait', designed to keep your facial identity 100% intact while restyling retro wardrobe.")

### The Two Types of Prompts on PromptSoul

1. **Pure Text-to-Image (T2I):**
   The prompt synthesizes a completely new subject from scratch. No reference photo is needed. You simply paste the prompt into the chat box and send it.
2. **Photo-Edit & Identity Preservation (I2I):**
   The prompt is engineered to transform a real person's photo — restyling their outfit, hairstyle, era, or lighting while strictly locking their facial features. These prompts explicitly state: *"Use the uploaded photo as the ONLY identity reference. Preserve exact facial identity..."*

:::info How to Tell the Difference Immediately
Look at the prompt instructions. If it references *"this uploaded photo"*, *"preserve facial identity"*, or *"dress the subject in"*, you **must** attach your selfie or portrait. Running a photo-edit prompt without an attachment causes the AI to invent a random stranger. Read our guide on [reference images vs. text prompts](/blog/reference-images-vs-text-prompts) for an in-depth breakdown.
:::

---

## Step 3: Copy the Exact Syntax Without Alteration

On the prompt block, click the **Copy** button. This copies the exact tested prompt string into your clipboard, preserving:
- Crucial camera instructions (\`85mm lens\`, \`shallow depth of field\`, \`f/1.8 aperture\`).
- Lighting parameters (\`soft tungsten lighting\`, \`golden hour rim light\`, \`subtle halation\`).
- Negative guardrails and composition constraints (\`vertical 4:5\`, \`candid posture\`, \`natural skin texture\`).

Resist the temptation to retype or simplify the text on your first attempt. AI image models are sensitive to word order and subtle descriptive cues; running the exact baseline first gives you a benchmark of what the prompt produces.

---

## Step 4: Paste & Run in Your Chosen AI Tool

Open ChatGPT or Google Gemini and navigate to a fresh chat session.

![1980s Bollywood Pink Satin Dress Portrait](https://uploads.aipromptmatrix.in/thumbnails/1980s-bollywood-pink-satin-dress-portrait-mu03a5vd95lu.webp "Atmospheric lighting study: '1980s Bollywood Pink Satin Dress Portrait', demonstrating warm analog grading, authentic fabric folds, and soft bokeh.")

### For Photo-Edit & Restyling Prompts:
1. **Upload your selfie first:** Click the \`+\` or paperclip icon in ChatGPT or Gemini and select your reference photo.
2. **Attach in the same message:** Paste the copied prompt directly into the caption/message area alongside the image.
3. **Send together:** Never send the photo in one message and the prompt in a second message. Sending them together forces the vision encoder to treat your image as the direct subject of the prompt text.

#### The Golden Checklist for Reference Photos:
- **Lighting:** Even, natural daylight or clean indoor lighting (no harsh shadows across the eyes).
- **Framing:** Waist-up or chest-up portraits work significantly better than extreme close-up crops because the AI has enough body context to drape clothing realistically.
- **Simplicity:** A single person looking toward the camera without sunglasses, hats, or heavy beauty filters.

---

## Step 5: The "One-Variable" Customization Method

Once you generate your baseline image, you can customize details to match your personal vision: colors, backdrops, time of day, or specific accessories.

The secret to reliable prompt customization is **changing only one variable at a time**:
- **Swap colors:** Change \`hot pink-red satin mini dress\` to \`emerald green silk lehenga\`.
- **Swap location:** Change \`cozy vintage Indian dressing room\` to \`sunlit European balcony overlooking the sea\`.
- **Swap time:** Change \`warm late-afternoon sunlight\` to \`rainy midnight neon street\`.

![Dreamy Radha-Inspired Floral Portrait](https://uploads.aipromptmatrix.in/thumbnails/dreamy-radha-inspired-floral-portrait-mu7cjk2abhmh.webp "Aesthetic portrait variation: 'Dreamy Radha-Inspired Floral Portrait', illustrating intricate jewelry, floral garlands, and ethereal lighting accents.")

:::warning Preserve the Technical Anchors
Never delete descriptive technical phrases that you don't immediately recognize. Phrases like *"subtle halation"*, *"35mm film grain"*, *"volumetric god rays"*, and *"natural skin pores, no plastic smoothing"* prevent the AI from generating waxy, cartoonish skin or generic CGI textures.
:::

---

## Step 6: Iterate Surgically Through Chat

In conversational tools like ChatGPT and Gemini, you never have to start from scratch if an image is almost perfect. Use conversational follow-up prompts to polish the result:

:::example Real-World Follow-Up Examples
- **Fixing framing:** *"Keep everything in the previous image exactly the same, but pull the camera back to a medium-wide shot showing the full dress down to the knees."*
- **Adjusting warmth:** *"Love this generation. Keep the subject, outfit, and background identical, but make the overall color temperature slightly cooler with subtle blue shadows."*
- **Refining details:** *"Keep her face and hairstyle identical, but remove the necklace and add small pearl studs to the ears."*
:::

If the output drifts too far or the model misunderstands your changes, don't keep piling on follow-ups. Simply open a fresh conversation, paste the original prompt with your targeted tweak, and re-run.

---

## Step 7: Explore Stylized & Poster Aesthetics

PromptSoul isn't just for portraits. Our catalog spans gaming key-art, retro anime, graphic posters, 3D clay figurines, and editorial fashion.

![GTA VI Style Character Poster](https://uploads.aipromptmatrix.in/thumbnails/gta-vi-style-character-poster-ai-prompt-mst0l36j6j45.webp "Stylized pop-art showcase: 'GTA VI Style Character Poster AI Prompt', showing bold vector lines, vibrant gradients, and action lighting.")

When exploring stylized categories:
- Check whether the prompt relies on a specific art director or medium (e.g. \`screenprint on textured paper\`, \`cel-shaded vector\`, \`macro clay sculpture\`).
- Maintain the genre keywords to keep the distinctive graphic punch.

---

## Two Verified Starter Prompts to Try Right Now

Ready to create? Here are two tested, guaranteed prompts you can run immediately:

### Starter A: Cinematic Neon Street Portrait (Pure Text-to-Image)
*Works universally in ChatGPT, Gemini, Grok, and Midjourney without requiring any photo upload.*

:::prompt
A cinematic 35mm street portrait of an introspective young traveler standing in a bustling Tokyo alleyway at twilight, wet asphalt reflecting vibrant magenta and cyan neon signs, light mist in the air, wearing an oversized dark wool coat with collar turned up, soft rain droplets glistening on the fabric, shallow depth of field with creamy bokeh circles, authentic analog film grain, natural skin texture, 85mm portrait lens, photorealistic, evocative atmosphere.
:::

### Starter B: 1980s Vintage Bollywood Glamour (Photo-Edit Transformation)
*Attach your selfie in ChatGPT or Gemini and paste this in the same message to transform your photo into a vintage film still while keeping your face untouched.*

:::prompt
Use the uploaded photo as the ONLY identity reference. Preserve my exact facial identity, facial proportions, skin tone, eyes, and natural smile. Do not alter or replace my face. Transform this photo into an authentic 1980s Bollywood cinematic portrait. Dress me in an elegant vintage saree with a delicate embroidered border, softly draped over one shoulder. Style my hair in soft retro waves with a fragrant white jasmine gajra pinned behind the ear, classic gold jhumkas, and a subtle traditional bindi. Setting: a warm sunlit verandah with carved wooden pillars and gentle afternoon shadows. Photographed on vintage 35mm color film, soft lens glow, warm amber color grade, gentle analog film grain, timeless candid elegance, photorealistic.
:::

---

## Frequently Asked Questions

### Do I need a paid account on PromptSoul to copy prompts?
No. PromptSoul is completely free to explore. Every prompt, example image, model tag, and one-click copy button is accessible without an account or subscription.

### Why does my result look different from the example on the card?
There are three common reasons:
1. **Wrong AI Tool:** Running a prompt tuned for Gemini inside Midjourney or ChatGPT produces completely different artistic interpretations.
2. **Missing Reference Photo:** If the prompt specifies identity preservation or photo editing, running it without attaching a clear selfie forces the AI to invent a random person.
3. **Premature Customization:** If you change half of the prompt before establishing a baseline, you won't know which phrase caused the distortion. Run the exact prompt first, then modify one detail at a time.

### How do I stop the AI from altering my face in photo-edit prompts?
Place identity preservation constraints at the very start of the prompt: *"Use the uploaded photo as the ONLY identity reference. Preserve exact facial identity, bone structure, and skin tone."* Additionally, ensure your uploaded photo has clean lighting and avoids sunglasses, extreme head angles, or beauty filters.

### Can I use images generated from these prompts commercially?
Commercial usage rights are determined by the AI platform you generate with (e.g., OpenAI's terms for ChatGPT or Google's terms for Gemini), not by PromptSoul. Always check your AI generator's commercial terms of service.
`,
};

export default article;

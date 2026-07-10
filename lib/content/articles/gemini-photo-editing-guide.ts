import type { Article } from '../types';

const article: Article = {
  slug: 'gemini-photo-editing-guide',
  title: "Gemini AI Photo Editing: The Complete Beginner's Guide",
  description:
    'Learn how to upload a photo into Gemini and transform it with a text prompt: outfit changes, background swaps, retro looks, and keeping your face identical.',
  category: 'guide',
  tags: ['gemini', 'photo editing', 'portraits', 'beginners'],
  readMinutes: 10,
  datePublished: '2026-04-02',
  icon: 'sparkles',
  featured: true,
  body: `
Gemini can take an ordinary photo from your phone and restyle it with nothing but a written instruction: new outfit, new background, new era, same you. The catch is that the quality of the result depends almost entirely on how you phrase the request — especially the parts that tell Gemini what NOT to change. This guide walks through the full workflow, from uploading your first photo to fixing the classic problem where your face slowly stops looking like your face.

## Step 1: Pick the Right Photo to Upload

Everything downstream depends on the input image, so choose it deliberately:

- **Face clearly visible.** Front-facing or a slight angle, eyes open, no sunglasses. Gemini can only preserve what it can see.
- **Good, even light.** A photo taken near a window beats a dim indoor shot every time. Harsh shadows across the face often survive into the edit.
- **One person in frame.** Group photos confuse edits — Gemini may restyle the wrong person or blend features.
- **No heavy filters.** Beauty filters and strong color grades give the model a distorted starting point, and the edit inherits the distortion.

A plain, boring, well-lit photo is the ideal raw material. Save the creativity for the prompt.

## Step 2: Upload the Photo and Prompt in the Same Message

Open Gemini (app or web), tap the attach/plus icon, and add your photo. Then — and this matters — type your editing instruction in the same message as the upload. If you send the photo alone and the prompt afterwards, Gemini will usually still connect them, but keeping them together removes ambiguity about what the instruction applies to.

Structure your instruction in three parts:

1. **What to change** — the outfit, the background, the style.
2. **What to keep** — the face, the pose, the identity.
3. **The mood** — lighting, color tone, camera feel.

:::example Weak vs strong edit
Weak prompt: "Make this photo look vintage."
Strong prompt: "Edit this photo of me. Change my outfit to a 1970s brown leather jacket and put me on a rainy city street at night with neon signs reflecting in puddles. Keep my face, hairstyle, and expression exactly the same as the uploaded photo. Cinematic moody lighting, slight film grain."
The second version tells Gemini the change, the anchor, and the atmosphere — three separate jobs the model handles much better when they are spelled out.
:::

## Step 3: Lock the Identity With Explicit Phrasing

The single most common beginner complaint is "it looks great, but that isn't me." Gemini does not automatically treat your face as sacred — if you only describe the new scene, it may regenerate a face that merely resembles yours. You prevent this with direct, almost blunt preservation language:

- "Keep the face 100% identical to the uploaded photo."
- "Do not alter my facial features, skin tone, or face shape."
- "Same person, same face, same expression — only change the clothing and background."

Use at least one of these lines in every edit prompt. Stacking two is not overkill for portraits. This idea — anchoring what stays fixed while you vary everything else — is the same skill behind [consistent characters in AI images](/blog/consistent-characters-ai-images), and it transfers directly.

:::warning Avoid face-changing words
Avoid vague words like "enhance my face" or "make me look better." These actively invite Gemini to redraw your features. If you want cleaner skin or brighter eyes, ask for a lighting change instead: "soft flattering studio light" improves a portrait without touching identity.
:::

## Step 4: Use Lighting and Mood Language, Not Just Nouns

Beginners describe objects; experienced prompters describe light. Two edits with identical outfits and backgrounds can look like a passport photo or a movie poster depending on the lighting line. Useful vocabulary that Gemini responds to well:

- **"Golden hour sunlight"** — warm, low, flattering directional light.
- **"Soft window light from the left"** — gentle studio-portrait feel.
- **"Moody cinematic lighting with deep shadows"** — dramatic film look.
- **"Overcast diffused daylight"** — even, natural, no harsh shadows.
- **"Warm tungsten indoor glow"** — cozy retro interiors.

Add one camera or texture phrase to finish the mood: "shallow depth of field", "35mm film grain", "slightly faded colors like an old photograph." One lighting phrase plus one texture phrase is usually enough — piling on five style descriptors muddies the result. If you want to go deeper on this, our post on [how to write better AI image prompts](/blog/how-to-write-better-ai-image-prompts) breaks down descriptor stacking in detail.

## Step 5: Edit in Steps, Not All at Once

Gemini is conversational, and that is its biggest advantage over one-shot generators. Instead of writing one giant prompt that changes outfit, background, lighting, and era simultaneously, work in rounds:

1. First message: photo + outfit change + identity lock.
2. Reply: "Perfect. Now change the background to a beach at sunset, keep everything else identical."
3. Reply: "Now add warm golden-hour lighting across the whole scene."

Each step gives you a checkpoint. If round three goes wrong, you still have round two, and you know exactly which instruction caused the problem. When a follow-up works, phrase the next one the same way: "keep everything else identical" is the glue that holds multi-step editing together.

:::tip Save good frames
When a follow-up result is good, download it immediately. Gemini regenerates images on each turn, and there is no guarantee a later step preserves an earlier one you loved. Treat every good frame as a save point.
:::

## When Results Drift — and How to Fix It

After three or four follow-ups, you may notice the face gradually shifting: slightly different jaw, different eyes, a stranger wearing your outfit. This is drift, and it happens because each edit is generated from the previous generated image, so small errors compound like a photocopy of a photocopy.

Fixes, in order of effectiveness:

1. **Restart the chain.** Open a fresh chat, upload your ORIGINAL photo again, and write one combined prompt containing everything you learned worked: outfit, background, lighting, identity lock. One clean generation from the true source beats five stacked edits.
2. **Re-anchor mid-conversation.** Re-attach the original photo in your next message: "Use this original photo as the face reference and redo the last edit — keep the face 100% identical to this upload."
3. **Reduce the ask.** If a complex scene keeps breaking the face, simplify the background or drop one style element. Fewer competing instructions means more capacity spent on getting you right.

If Gemini refuses an edit or returns something unrelated, check the basics first: the photo actually attached, the prompt is in the same message, and the request does not involve another identifiable person without context.

## A Complete Prompt to Try Right Now

Here is a full, tested-style editing prompt. Attach a clear selfie and paste this along with it.

:::prompt
Edit this uploaded photo of me. Keep my face 100% identical to the photo — do not change my facial features, skin tone, face shape, or expression. Change my outfit to an elegant black turtleneck and dark overcoat. Replace the background with a quiet European street in autumn, golden-hour sunlight coming from behind me, fallen leaves on the cobblestones. Cinematic warm color grade, shallow depth of field, subtle 35mm film grain. Natural realistic photo, not a painting.
:::

Run it once as written, then customize one element at a time: swap the outfit, then the street, then the season. For ready-made variations, browse the [Gemini prompts](/tool/gemini) page — every prompt there was tested in Gemini with a real uploaded photo — or start from the full [explore page](/explore) and filter by style.

## Frequently Asked Questions

### Do I need a paid Gemini plan to edit photos?

No. Photo upload and image editing work on the free tier. Paid plans mainly give you more generations and priority access, which matters if you iterate heavily, but every technique in this guide works free.

### Why does Gemini keep changing my face even with preservation phrasing?

Usually the source photo is the problem — low resolution, tilted angle, or partial face coverage forces the model to invent the missing details. Try a sharper, front-facing photo, and put the identity lock as its own sentence rather than burying it mid-paragraph.

### Can I edit photos of other people?

Only with their permission, and Gemini may decline edits of recognizable third parties, particularly public figures. Photos of yourself are the reliable, intended use case.

### How is this different from generating an image from scratch?

Editing starts from your real photo, so identity, pose, and proportions come from reality; generation invents everything from text. If you want a picture of yourself, always upload and edit. Our comparison of [reference images vs. text prompts](/blog/reference-images-vs-text-prompts) covers exactly when each approach wins.
`,
};

export default article;

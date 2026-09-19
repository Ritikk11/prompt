import type { Article } from '../types';

const article: Article = {
  slug: 'how-to-write-better-ai-image-prompts',
  title: 'How to Write Better AI Image Prompts: 10 Techniques That Actually Work',
  description:
    'Ten practical techniques for stronger AI image prompts — specificity, lighting words, camera language, style anchors, and more, each with a working example.',
  category: 'blog',
  tags: ['prompt writing', 'techniques', 'ai images', 'tips'],
  readMinutes: 8,
  datePublished: '2026-03-02',
  icon: 'wand',
  body: `
Most prompt advice boils down to "be more descriptive", which is true but useless — descriptive about what, exactly? These ten techniques answer that question. Each one targets a specific part of the prompt, and each comes with a mini example you can adapt immediately. They work across ChatGPT, Gemini, Midjourney, Grok, and Qwen Image.

## 1. Replace Generic Nouns with Specific Ones

Every generic noun in your prompt is a decision you've handed to the model. "A car" could be anything; "a rusted 1970s muscle car" is a picture already forming. Go one level more specific than feels natural: not "a bird" but "a kingfisher", not "a building" but "a brutalist concrete apartment block".

:::example Specific subject
Before: "a woman in a garden"

After: "a woman in her sixties in a linen sun dress, pruning roses in an overgrown English cottage garden"
:::

## 2. Put the Subject First

Models weight the beginning of a prompt heavily. Lead with your main subject, then layer in context. If the prompt opens with three lines of atmosphere before mentioning the subject, don't be surprised when the atmosphere dominates and the subject comes out small or mangled.

:::example Put subject first
Weaker: "in a vast misty pine forest at dawn, with rays of light cutting through the fog, a lone deer"

Stronger: "a lone red deer stag standing in a misty pine forest at dawn, rays of light cutting through the fog"
:::

## 3. Always Describe the Light

Lighting is the single highest-leverage phrase you can add. An ordinary subject in extraordinary light beats the reverse every time. Build a small vocabulary: golden hour, overcast soft light, hard midday sun, candlelight, neon glow, backlit, rim lighting, window light, blue hour.

:::example Add lighting
Before: "a bowl of ramen on a wooden table"

After: "a bowl of ramen on a wooden table, lit by warm late-afternoon window light from the left, steam catching the light"
:::

## 4. Use Camera and Lens Language

Photography terms are precise levers because they had consistent meanings in the training data. "85mm portrait lens" compresses the background and flatters faces. "Wide angle, low angle shot" makes subjects loom. "Macro" gets you extreme close-up detail. "Shallow depth of field" blurs the background. You don't need to own a camera — you just need the words.

:::example Choose camera distance
Before: "a close-up of a chameleon"

After: "macro photograph of a chameleon's eye, extreme close-up, shallow depth of field, crisp scale texture"
:::

## 5. Anchor the Style Explicitly

If you don't name a style, the model picks one for you — usually a bland default. Anchor it: "documentary photograph", "flat vector illustration", "1980s anime cel", "charcoal sketch", "claymation still". One clear style anchor at the end of the prompt is worth five vague adjectives. Browse the [explore page](/explore) and note how nearly every strong prompt ends with a style phrase.

:::example Pick one style
Before: "a market street in Marrakech"

After: "a market street in Marrakech, gouache painting with loose brushwork and warm ochre tones"
:::

## 6. Set the Mood in One or Two Words

Mood words shift color grading, contrast, and even posing without you micromanaging any of it. "Serene", "ominous", "playful", "melancholic", "triumphant" — pick one, maybe two. More than that and they cancel each other out.

:::example Set the mood
Before: "an abandoned amusement park"

After: "an abandoned amusement park at dusk, ominous and quiet, muted desaturated colors"
:::

## 7. Direct the Composition

Tell the model where things sit in the frame: "centered symmetrical composition", "subject on the left third", "overhead flat lay", "framed through a doorway", "extreme wide shot with the figure tiny against the landscape". Composition words also help with aspect ratio choices — a "towering waterfall, vertical composition" wants a portrait frame. See [aspect ratios explained](/blog/ai-image-aspect-ratios-explained) for how framing and ratio work together.

:::example Control composition
Before: "a hiker looking at mountains"

After: "extreme wide shot, a tiny hiker in a red jacket at the bottom right of the frame, dwarfed by a massive snow-covered mountain face"
:::

## 8. Iterate on One Variable at a Time

Your first generation is a draft, not a verdict. When it misses, resist rewriting the whole prompt. Change one element — the lighting phrase, the style anchor, the camera angle — and regenerate. This is how you learn cause and effect. In conversational tools like ChatGPT and Gemini you can iterate by instruction: "same scene, but at night." The [Gemini photo editing guide](/guides/gemini-photo-editing-guide) shows how far iterative refinement can go.

:::tip Save prompt versions
Keep a scratch file of your last three prompt versions while iterating. When a change makes things worse, you can roll back instead of trying to remember what you had.
:::

## 9. Right-Size Your Prompt Length

There's a sweet spot. Under about 10 words, the model fills too many gaps itself. Past 60-80 words, later details start getting ignored or blended together. Aim for a prompt where every phrase makes a distinct visual decision — subject, detail, setting, light, camera, style, mood. If a phrase doesn't change what you'd see, cut it. "High quality, 8k, masterpiece, best quality" chains mostly waste your budget on modern models.

:::warning Split overloaded ideas
If your prompt has more than one main subject doing more than one thing in more than one place, split it into separate images. Overloaded prompts produce merged, confused results in every tool.
:::

## 10. Borrow from Prompts That Already Work

The fastest improvement technique isn't writing at all — it's reading. Find a prompt that produced an image close to what you want, copy it, and swap in your subject. The lighting, camera, and style scaffolding keeps doing its job. Every post on PromptSoul shows the exact prompt next to its result with a copy button; start with [ChatGPT prompts](/tool/chatgpt) or [Gemini prompts](/tool/gemini) and adapt from there.

Here's a complete prompt that uses techniques 1 through 7 together — specific subject first, lighting, lens, style anchor, mood, and composition:

:::prompt
An elderly street musician playing violin under a stone archway in Prague, dressed in a worn brown coat, backlit by low golden-hour sun with dust motes in the air, shallow depth of field on an 85mm lens, subject on the left third of the frame, melancholic mood, cinematic documentary photography
:::

Run it, then practice technique 8: change only "Prague" to "Tokyo", regenerate, and watch everything else hold steady.

## Frequently Asked Questions

### Which technique should I learn first?

Lighting (technique 3). It transforms results faster than anything else, and the vocabulary is small — ten phrases cover most situations. Specificity (technique 1) is a close second.

### Do these techniques work the same in every AI tool?

The principles transfer completely; the phrasing shifts slightly. Conversational tools like ChatGPT and Gemini handle full natural sentences well, while Midjourney responds best to compact comma-separated phrases. Subject-first ordering and lighting language matter everywhere.

### Should I use negative prompts too?

In tools that support them, yes — they're a complement to these techniques, handling what you want excluded rather than included. We cover that separately in [negative prompts explained](/blog/negative-prompts-explained).

### How many attempts should a good image take?

For a straightforward subject, expect a usable result in one to three generations with a well-built prompt. Complex scenes with specific compositions might take five to ten iterations. If you're past ten with no progress, the prompt is overloaded — simplify it and rebuild one element at a time.
`,
};

export default article;

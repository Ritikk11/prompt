import type { Article } from '../types';

const article: Article = {
  slug: 'who-owns-ai-generated-images',
  title: 'Who Owns AI-Generated Images? Copyright and Commercial Use, Explained Simply',
  description:
    'Can you sell or copyright AI-generated images? A plain-language guide to ownership, tool terms of service, common legal risks, and a practical safe-use checklist.',
  category: 'blog',
  tags: ['copyright', 'commercial use', 'ai images', 'legal basics'],
  readMinutes: 9,
  datePublished: '2026-06-10',
  icon: 'shield',
  body: `
You generated a great image with ChatGPT or Gemini. Can you put it on a t-shirt, use it in a client project, or stop someone else from copying it? The honest answer is "it depends" — but the rules are easier to understand than most people think. This article walks through who owns AI images, what the major tools actually allow, and where the real risks hide.

:::info
This article is general information, not legal advice. Copyright law differs by country and is changing quickly as courts and regulators catch up with AI. If real money or a real business depends on an image, talk to a lawyer in your jurisdiction and read the current terms of the tool you used.
:::

## The core idea: copyright protects human creativity

Copyright law in most countries was written to protect works created by people. That single fact drives almost everything else in this topic.

### The US position: human authorship required

The US Copyright Office has taken a consistent public stance: copyright protection requires human authorship. A picture produced entirely by a machine from a short text prompt — with no meaningful human creative contribution beyond typing the request — is generally not eligible for copyright registration in the United States. In cases where people have tried to register purely AI-generated images, the Office has refused, and it has also required applicants to disclose and disclaim AI-generated material inside larger works.

What this means in practice: if you type a one-line prompt and publish the raw output, you likely cannot stop someone else from copying that exact image, because you may not own a copyright in it at all.

### Where human input changes the picture

Copyright can still attach to the human parts of a project. If you significantly edit an AI image, arrange multiple images into an original layout, combine them with your own writing or design, or use AI output as one ingredient in a larger hand-made work, the human-authored portions can be protected. The line between "enough" and "not enough" human contribution is still being worked out case by case, which is exactly why blanket claims like "AI images are always public domain" or "prompting makes you the author" are both too simple.

### Other countries draw the line differently

The human-authorship requirement is common but not universal. A few jurisdictions, such as the UK, have statutory language covering computer-generated works, though how it applies to modern AI tools is debated. India, the EU, and others are actively reviewing their positions. If you operate internationally, assume the strictest relevant rule applies and do not build a business on the assumption that you can enforce copyright in raw AI output.

## What the tools themselves allow

Ownership under copyright law is one question. What your contract with the AI company allows is a separate one — and often the more practical one.

### OpenAI (ChatGPT / DALL-E images)

OpenAI's terms have long stated that, as between you and OpenAI, you own the output you create, and commercial use of outputs is permitted, subject to their usage policies. That covers selling prints, using images in marketing, publishing them in products, and similar uses. Note the careful wording: OpenAI assigning you its rights does not create a copyright that the law says does not exist. It simply means OpenAI will not come after you for using the image.

### Google (Gemini images)

Google's generative AI terms similarly allow you to use generated content, including commercially, subject to their prohibited-use policies. Gemini images also carry SynthID, an invisible watermark identifying them as AI-generated — worth knowing if you plan to pass images through editing pipelines.

### The common thread — and the caveat

Most major tools (OpenAI, Google, Midjourney on paid plans) permit commercial use of outputs. But terms change, free tiers sometimes carry different rights than paid tiers, and usage policies prohibit specific content categories regardless of ownership. Before any serious commercial use, read the current terms of the specific tool and plan you are on. A five-minute read beats an unpleasant surprise.

## Where the real risks are

For most creators, the practical danger is not "can I copyright this" but "does this image infringe on someone else." Owning the output does not make the content of the image safe.

### Celebrity and real-person likenesses

Generating a recognizable real person — a film star, athlete, or politician — and using that image commercially can violate personality and publicity rights, even if the tool happily produced it. This applies to lookalike results too: if a reasonable viewer thinks it is that person, the risk exists. Most tools block famous names, but blocked prompts are not the point; the resulting image is.

### Trademarks and logos

An AI image containing a brand logo, a distinctive product design, or a famous character (even loosely rendered) can create trademark or copyright problems when used commercially. "The AI added it, not me" is not a defense — you chose to publish the image.

### Artist-style prompts

Prompting "in the style of" a living, named artist is legally murky and reputationally risky. Style itself is traditionally not copyrightable, but several lawsuits are testing the boundaries, and the practice draws justified criticism from working artists. Describing the qualities you want ("loose watercolor, muted earth tones, visible brush texture") gets similar results without invoking anyone's name — and usually produces more controllable prompts anyway.

### Assuming exclusivity

Because raw AI output may not be copyrightable, someone else can generate something very similar — or copy yours outright — and you may have limited recourse. Do not build a logo or core brand asset on unedited AI output if exclusivity matters to you.

## A practical safe-use checklist

:::warning
Before using an AI image commercially, run through this list:

1. Read the current terms of service for the tool and plan you used. Confirm commercial use is allowed on your tier.
2. Check the image for recognizable real people. If someone identifiable appears, do not use it commercially without consent.
3. Check for logos, brand marks, and famous characters — including partial or distorted ones in backgrounds.
4. Avoid prompts naming living artists; describe the style instead.
5. If you need exclusivity (logos, brand assets), add substantial human editing or commission original work.
6. Keep records: the prompt, the tool, the date, and your edits. If a dispute arises, provenance helps.
7. Disclose AI use where the platform or your client requires it. Marketplaces and stock sites increasingly do.
8. When the stakes are high, get advice from a lawyer in your country.
:::

## What this means for everyday creators

For personal projects, social media posts, and experimentation, the rules are forgiving: generate freely, credit tools if you like, and avoid real people and brands. For commercial work, treat AI images the way a careful professional treats stock photos — check the license (here, the terms of service), check the content, and keep proof of where it came from.

If you are just getting started with prompting itself, our [explore page](/explore) has hundreds of copy-ready examples, and the primer on [what AI image prompts are](/blog/what-are-ai-image-prompts) covers the fundamentals. The [ChatGPT prompts](/tool/chatgpt) collection is a good place to see what current tools produce from well-written text.

:::tip
Habit worth building: save the exact prompt alongside every image you keep. It documents your creative input, makes results reproducible, and — if registration rules evolve to credit human contribution more generously — you will have the paper trail ready.
:::

## Frequently Asked Questions

### Can I sell images I made with ChatGPT or Gemini?

Generally yes — both OpenAI and Google currently permit commercial use of outputs under their terms, subject to usage policies. But "allowed to sell" is different from "protected by copyright," and terms change, so verify the current terms for your plan before relying on them.

### Can someone legally copy my AI-generated image?

Possibly. If the image is purely AI-generated with minimal human creative input, it may have no copyright protection in jurisdictions like the US, meaning you may not be able to stop copying. Substantial human editing or incorporation into a larger original work strengthens your position.

### Is it illegal to generate images of celebrities?

Generating one privately is usually not the issue; publishing or commercially using a recognizable real person's likeness without consent can violate publicity and personality rights in many places. Treat identifiable real people as off-limits for commercial work.

### Do I have to say an image is AI-generated?

It depends on where you publish. Some platforms, marketplaces, and ad policies require disclosure, and some jurisdictions are introducing labeling rules. Even where it is not required, disclosure is increasingly expected — and Gemini images carry an invisible SynthID watermark regardless.
`,
};

export default article;

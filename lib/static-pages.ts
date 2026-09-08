import type { Metadata } from 'next';
import type { SiteSettings, StaticPageSettings } from './types';

export type StaticPageKey = 'about' | 'contact' | 'privacy' | 'terms' | 'dmca' | 'disclaimer' | 'cookies';

const defaults: Record<StaticPageKey, Pick<StaticPageSettings, 'title' | 'subtitle' | 'metaTitle' | 'metaDescription'>> = {
  about: {
    title: 'About Us',
    subtitle: 'Discover our mission, our story, and what makes this platform the ultimate destination for AI creators.',
    metaTitle: 'About Us | AI PromptMatrix',
    metaDescription: 'Learn about AI PromptMatrix and our mission to curate useful AI prompts.',
  },
  contact: {
    title: 'Contact Us',
    subtitle: "Have a question or want to work together? We'd love to hear from you.",
    metaTitle: 'Contact Us | AI PromptMatrix',
    metaDescription: 'Contact AI PromptMatrix for support, partnerships, and media inquiries.',
  },
  privacy: {
    title: 'Privacy Policy',
    subtitle: 'Learn how we collect, use, and protect your personal information.',
    metaTitle: 'Privacy Policy | AI PromptMatrix',
    metaDescription: 'Read the AI PromptMatrix privacy policy.',
  },
  terms: {
    title: 'Terms of Service',
    subtitle: 'The rules and terms that apply when using this website.',
    metaTitle: 'Terms of Service | AI PromptMatrix',
    metaDescription: 'Read the AI PromptMatrix terms of service.',
  },
  dmca: {
    title: 'DMCA Notice',
    subtitle: 'Information regarding copyright infringement claims.',
    metaTitle: 'DMCA Notice | AI PromptMatrix',
    metaDescription: 'Read the AI PromptMatrix DMCA notice.',
  },
  disclaimer: {
    title: 'Disclaimer',
    subtitle: 'Important limitations and usage notes for this website.',
    metaTitle: 'Disclaimer | AI PromptMatrix',
    metaDescription: 'Read the AI PromptMatrix disclaimer.',
  },
  cookies: {
    title: 'Cookies Policy',
    subtitle: 'How and why we use cookies and similar technologies.',
    metaTitle: 'Cookies Policy | AI PromptMatrix',
    metaDescription: 'Read the AI PromptMatrix cookies policy.',
  },
};

export function getStaticPageContent(
  settings: SiteSettings,
  key: StaticPageKey,
  legacyBody: string | undefined,
  fallbackBody: string
) {
  const page = settings.staticPages?.[key] || {};
  const fallback = defaults[key];
  return {
    title: page.title || fallback.title || '',
    subtitle: page.subtitle || fallback.subtitle || '',
    body: page.body || legacyBody || fallbackBody,
    metaTitle: page.metaTitle || fallback.metaTitle || page.title || fallback.title || '',
    metaDescription: page.metaDescription || fallback.metaDescription || page.subtitle || fallback.subtitle || '',
    ogImage: page.ogImage || settings.seoSettings?.defaultOgImage || '',
    visible: page.visible !== false,
  };
}

import { formatTitleWithBrand } from './seo-helpers';

export function staticPageMetadata(page: ReturnType<typeof getStaticPageContent>, settings?: SiteSettings): Metadata {
  const siteTitle = settings?.siteTitle || 'AI PromptMatrix';
  const title = formatTitleWithBrand(page.metaTitle, siteTitle);
  const ogImage = page.ogImage || settings?.seoSettings?.defaultOgImage;

  return {
    title: { absolute: title },
    description: page.metaDescription,
    openGraph: {
      title,
      description: page.metaDescription,
      siteName: siteTitle,
      type: 'website',
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
  };
}

export function getDefaultStaticPageBody(key: StaticPageKey, settings?: SiteSettings): string {
  const siteTitle = settings?.siteTitle || 'Our Site';
  const contactEmail = settings?.contactEmail || 'contact@aipromptmatrix.in';

  if (key === 'about') {
    return `
# About Us

AI PromptMatrix is a curated prompt library for creators who want practical AI image prompts, real examples, model notes, and reusable creative workflows in one place.

The site exists because prompt discovery is often messy. A useful prompt is not just a block of text. It needs context: which tool it was made for, what kind of image it produced, what tags or style direction it belongs to, and how someone can adapt it without starting from zero.

## Our Mission

Our mission is to make AI image prompting easier to understand, test, and reuse. We organize prompts by tools, tags, sections, and creative direction so visitors can move from inspiration to generation quickly.

## What Makes Us Different

- **Curated structure:** Prompts are grouped by tool, topic, style, and use case instead of being left as a raw feed.
- **Clear model context:** Prompt pages show the intended AI tool and model where available.
- **Example-first browsing:** Visual examples help visitors understand what a prompt is trying to create before they copy it.
- **Reusable workflows:** Many pages include prompt text, notes, tags, related prompts, and follow-up discovery blocks.
- **Editorial review:** Public pages are organized and reviewed so the library remains useful for creators, not just searchable.

## How We Review Content

Before a prompt is featured or organized into a section, we look for clear titles, useful descriptions, visible example images, correct tool labels, and clean tags. We also remove or avoid content that is misleading, broken, unsafe, or too vague to help visitors.

## Who This Site Is For

AI PromptMatrix is built for creators, designers, social media editors, prompt writers, students, and anyone experimenting with AI image generation. The goal is not to promise identical outputs every time. AI tools can vary. The goal is to give you a stronger starting point and a clearer direction.

## Contact

For corrections, copyright concerns, partnerships, or general questions, contact us at **${contactEmail}**.
`.trim();
  }

  if (key === 'contact') {
    return `
# Contact Us

We read messages about corrections, copyright concerns, prompt submissions, partnerships, and site feedback.

**Email:** [${contactEmail}](mailto:${contactEmail})  
**Typical response time:** 2-5 business days

## What To Include

- The page URL if your message is about a specific prompt or image.
- A short explanation of what needs to be fixed or reviewed.
- For copyright or DMCA matters, include enough detail for us to identify the material.
- For partnerships, include your website or public profile.

## Prompt Corrections

If a prompt has the wrong tool, model, tags, title, or image, send us the page link and the correction. We review correction requests and update pages when the change improves clarity.

## Copyright Or Removal Requests

For copyright notices, please use the DMCA Notice page and email the required details to **${contactEmail}**.

## Submitting Prompts

If submissions are enabled, you can submit prompts from the Submit page. Approved submissions may be edited for formatting, tags, clarity, and page quality before publication.
`.trim();
  }

  if (key === 'privacy') {
    return `
# Privacy Policy

Last updated: July 6, 2026

This Privacy Policy explains how ${siteTitle} ("we", "us", "our") collects, uses, shares, and protects your information when you use our website and services (the "Service"). By using the Service, you agree to the collection and use of information in accordance with this policy. If you do not agree, please do not use the Service.

## 1. Information We Collect

**Information you provide directly.** We collect information you give us, such as when you create an account, submit a prompt, upload an image, post a comment, subscribe to updates, or contact us for support. This may include your name, email address, and any content you choose to submit.

**Log and usage data.** Like most websites, we automatically collect information that your browser or device sends when you visit ("Log Data"). This may include your Internet Protocol (IP) address, browser type and version, device information, the pages you visit, the date and time of your visit, time spent on pages, referring URLs, and similar diagnostics.

**Cookies and similar technologies.** We and our partners use cookies and similar technologies to operate the Service, remember your preferences, analyze usage, and serve advertising. See our [Cookie Policy](/cookies) for details.

## 2. How We Use Information

We use the information we collect to:
- Provide, maintain, operate, and improve the Service;
- Create and manage your account and authenticate you;
- Communicate with you about your account, updates, and support requests;
- Personalize content and measure the performance of the Service;
- Display advertising, including through Google AdSense;
- Monitor and analyze trends, usage, and activity;
- Detect, investigate, and prevent fraud, abuse, security incidents, and other harmful or illegal activity;
- Comply with legal obligations and enforce our terms and policies.

## 3. Legal Bases for Processing (EEA/UK Users)

Where the EU/UK General Data Protection Regulation (GDPR) applies, we process personal data on the following bases: your **consent**; the **performance of a contract** with you; our **legitimate interests** (such as securing and improving the Service); and **compliance with legal obligations**. You may withdraw consent at any time where processing is based on consent.

## 4. Cookies and Advertising

We use first- and third-party cookies. Some are strictly necessary for the Service to function; others help us analyze usage and deliver relevant advertising.

**Google AdSense.** We use Google AdSense to display ads. Google, as a third-party vendor, uses cookies (including the DoubleClick cookie) to serve ads based on your prior visits to this and other websites. You may opt out of personalized advertising by visiting [Google Ads Settings](https://adssettings.google.com/authenticated), or opt out of third-party vendor cookies at [aboutads.info](https://www.aboutads.info/choices/).

## 5. Third-Party Services

We rely on trusted third parties to operate the Service. These may include, among others:
- **Google AdSense / Google Analytics** — advertising and analytics;
- **Supabase** — database, authentication, and file storage hosting;
- **Our hosting and content-delivery providers** — serving the website.

These providers process data on our behalf or as independent controllers under their own privacy policies. We encourage you to review their policies.

## 6. How We Share Information

We do **not** sell your personal information. We may share information: with service providers who process it on our behalf; to comply with law, regulation, legal process, or enforceable governmental request; to enforce our terms or protect the rights, property, or safety of us, our users, or the public; and in connection with a merger, acquisition, or sale of assets, in which case we will notify you.

## 7. Data Retention

We retain personal information only for as long as necessary to fulfil the purposes described in this policy, including to provide the Service, comply with our legal obligations, resolve disputes, and enforce our agreements. When no longer needed, we delete or anonymize it.

## 8. Data Security

We implement reasonable technical and organizational measures designed to protect your information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet or electronic storage is completely secure, and we cannot guarantee absolute security.

## 9. International Data Transfers

We may process and store information in countries other than your own, which may have data-protection laws that differ from those in your jurisdiction. Where required, we take steps to ensure an adequate level of protection for transferred data.

## 10. Your Rights

Depending on where you live, you may have the right to access, correct, update, or delete your personal information; to object to or restrict certain processing; to data portability; and to withdraw consent. To exercise these rights, contact us at ${contactEmail}.

**California residents (CCPA/CPRA).** You have the right to know what personal information we collect, to request deletion, to correct inaccurate information, and to opt out of the "sale" or "sharing" of personal information. We do not sell personal information. You will not be discriminated against for exercising these rights.

## 11. Children's Privacy

The Service is not directed to children. You must be at least 18 years old to use the Service, or, where permitted, use it under the involvement and consent of a parent or legal guardian. We do not knowingly collect personal information from children. If you believe a child has provided us with personal information, please contact us and we will take steps to delete it.

## 12. Your Rights Under India's DPDP Act, 2023

If you are located in India, the Digital Personal Data Protection Act, 2023 ("DPDP Act") applies. As a Data Principal, you have the right to access, correction, and erasure of your personal data, the right to grievance redressal, and the right to nominate another individual to exercise your rights in the event of death or incapacity. We process personal data based on your consent or other lawful grounds, and the personal data of children (under 18) only with verifiable parental or guardian consent.

**Grievance Officer.** In accordance with the DPDP Act and the Information Technology Act, 2000 and rules thereunder, you may contact our Grievance Officer for any complaint regarding the processing of your personal data:

- **Email:** ${contactEmail}

We will acknowledge and resolve complaints within the timelines prescribed by applicable law.
`.trim();
  }

  if (key === 'terms') {
    return `
# Terms of Service

Last updated: July 6, 2026

Welcome to ${siteTitle}. By accessing or using our website, services, and software provided through or in connection with the service ("Service"), you signify that you have read, understood, and agree to be bound by this Terms of Service Agreement ("Agreement"), whether or not you are a registered user of our Service. 

## 1. Description of Service

${siteTitle} provides a platform for discovering, sharing, and utilizing AI-generated prompts for various large language models and image generation models. You understand and agree that the Service is provided "AS-IS" and that ${siteTitle} assumes no responsibility for the timeliness, deletion, misdelivery, or failure to store any user communications or personalization settings.

## 2. Eligibility

You must be at least 18 years old to use the Service. If you are a minor in your jurisdiction, you may use the Service only with the involvement and consent of a parent or legal guardian, who agrees to be bound by these Terms on your behalf. By agreeing to these Terms, you represent and warrant to us that: (a) you meet the age requirement above; (b) you have not previously been suspended or removed from the Service; and (c) your registration and your use of the Service is in compliance with any and all applicable laws and regulations.

## 3. User Accounts and Registration

To access most features of the Service, you must register for an account. When you register for an account, you may be required to provide us with some information about yourself, such as your email address or other contact information. You agree that the information you provide to us is accurate and that you will keep it accurate and up-to-date at all times. 

You are solely responsible for maintaining the confidentiality of your account and password, and you accept responsibility for all activities that occur under your account. If you believe that your account is no longer secure, then you must immediately notify us.

## 4. User Content and Licenses

Our Service allows you to post content, including but not limited to text (prompts), images, and comments ("User Content"). You retain ownership of all of your rights in your User Content. However, by providing User Content to or via the Service, you grant us a worldwide, non-exclusive, royalty-free, fully paid right and license (with the right to sublicense) to host, store, transfer, display, perform, reproduce, modify, and distribute your User Content, in whole or in part, in any media formats and through any media channels now known or hereafter developed.

You are solely responsible for your User Content and the consequences of providing User Content via the Service. By providing User Content via the Service, you affirm, represent, and warrant that:
- You are the creator and owner of the User Content, or have the necessary licenses, rights, consents, and permissions to authorize us to use and distribute your User Content;
- Your User Content does not and will not infringe, violate, or misappropriate any third-party right, including any copyright, trademark, patent, trade secret, moral right, privacy right, right of publicity, or any other intellectual property or proprietary right;
- Your User Content does not violate our Acceptable Use guidelines.

## 5. Acceptable Use Prohibitions

In using the Service, you agree not to:
1. Use the Service for any illegal purpose or in violation of any local, state, national, or international law;
2. Harass, threaten, demean, embarrass, or otherwise harm any other user of the Service;
3. Violate, or encourage others to violate, any right of a third party, including by infringing or misappropriating any third-party intellectual property right;
4. Interfere with security-related features of the Service, including by: (i) disabling or circumventing features that prevent or limit use or copying of any content; or (ii) reverse engineering or otherwise attempting to discover the source code of any portion of the Service except to the extent that the activity is expressly permitted by applicable law;
5. Interfere with the operation of the Service or any user's enjoyment of the Service, including by: (i) uploading or otherwise disseminating any virus, adware, spyware, worm, or other malicious code; (ii) making any unsolicited offer or advertisement to another user of the Service; (iii) collecting personal information about another user or third party without consent; or (iv) interfering with or disrupting any network, equipment, or server connected to or used to provide the Service;
6. Perform any fraudulent activity including impersonating any person or entity, claiming a false affiliation, accessing any other Service account without permission, or falsifying your age or date of birth.

## 6. Prompts and AI-Generated Output

Prompts published on the Service are provided for creative and educational use. Unless a specific license is stated on a prompt, you may use prompts from the Service to generate content with third-party AI tools for personal or commercial purposes. However, you acknowledge that: (a) running a prompt through an AI tool is subject to that tool's own terms of service and usage policies, which you are responsible for complying with; (b) we make no guarantee that any prompt will produce a particular output, or that outputs will be free of third-party rights; and (c) the copyright status of AI-generated works varies by jurisdiction, and we make no representation that you can claim ownership over content you generate. See our [Disclaimer](/disclaimer) for more on AI-generated content.

## 7. Intellectual Property

The Service is owned and operated by ${siteTitle}. The visual interfaces, graphics, design, compilation, information, data, computer code (including source code or object code), products, software, services, and all other elements of the Service ("Materials") provided by ${siteTitle} are protected by intellectual property and other laws. All Materials included in the Service are the property of ${siteTitle} or its third-party licensors. You may not make use of the Materials except as expressly authorized by ${siteTitle}. If you believe that content on the Service infringes your copyright, please review our [DMCA Notice](/dmca) for instructions on submitting a takedown request.

## 8. Modification of Terms

We reserve the right to change these Terms on a going-forward basis at any time. Please check these Terms periodically for changes. If a change to these Terms materially modifies your rights or obligations, we may require that you accept the modified Terms in order to continue to use the Service. Material modifications are effective upon your acceptance of the modified Terms. Immaterial modifications are effective upon publication.

## 9. Disclaimers and Limitations of Liability

THE SERVICE AND ALL MATERIALS AND CONTENT AVAILABLE THROUGH THE SERVICE ARE PROVIDED "AS IS" AND ON AN "AS AVAILABLE" BASIS. WE DISCLAIM ALL WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, RELATING TO THE SERVICE AND ALL MATERIALS AND CONTENT AVAILABLE THROUGH THE SERVICE, INCLUDING: (A) ANY IMPLIED WARRANTY OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, QUIET ENJOYMENT, OR NON-INFRINGEMENT; AND (B) ANY WARRANTY ARISING OUT OF COURSE OF DEALING, USAGE, OR TRADE.

IN NO EVENT WILL ${siteTitle} BE LIABLE TO YOU FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL OR PUNITIVE DAMAGES (INCLUDING DAMAGES FOR LOSS OF PROFITS, GOODWILL, OR ANY OTHER INTANGIBLE LOSS) ARISING OUT OF OR RELATING TO YOUR ACCESS TO OR USE OF, OR YOUR INABILITY TO ACCESS OR USE, THE SERVICE OR ANY MATERIALS OR CONTENT ON THE SERVICE.

## 10. Termination

We may suspend or terminate your access to the Service at any time, with or without cause and with or without notice, including if we reasonably believe you have violated these Terms or applicable law. You may stop using the Service at any time. Upon termination, all provisions of these Terms that by their nature should survive will survive, including ownership provisions, warranty disclaimers, indemnity, and limitations of liability.

## 11. Indemnification

You agree to defend, indemnify, and hold harmless ${siteTitle} and its officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, and expenses, including reasonable legal fees, arising out of or in any way connected with: (a) your access to or use of the Service; (b) your User Content; or (c) your violation of these Terms or of any applicable law or third-party right.

## 12. Governing Law and Dispute Resolution

These Terms are governed by and construed in accordance with the laws of India, without regard to its conflict-of-laws principles. Subject to any applicable mandatory law, the courts of competent jurisdiction located in India shall have exclusive jurisdiction over any dispute arising out of or relating to these Terms or the Service. Before starting any formal proceeding, you agree to first contact us at ${contactEmail} and attempt to resolve the dispute informally.

## 13. General

These Terms, together with the Privacy Policy and any other agreements expressly incorporated by reference into these Terms, are the entire and exclusive understanding and agreement between you and ${siteTitle} regarding your use of the Service, and supersede any prior agreements. Our failure to enforce any right or provision of these Terms will not be deemed a waiver of that right or provision. If any provision is held to be invalid or unenforceable, the remaining provisions will remain in full force and effect. You may not assign or transfer these Terms or your rights under these Terms, in whole or in part, by operation of law or otherwise, without our prior written consent; we may assign these Terms without restriction. We will not be liable for any failure or delay in performance resulting from causes beyond our reasonable control.

## 14. Contact

If you have any questions about these Terms, please contact us at ${contactEmail}.
`.trim();
  }

  if (key === 'dmca') {
    return `
# DMCA Notice

Last updated: July 6, 2026

${siteTitle} respects the intellectual property rights of others and expects its users to do the same. In accordance with the Digital Millennium Copyright Act of 1998, the text of which may be found on the U.S. Copyright Office website at http://www.copyright.gov/legislation/dmca.pdf, we will respond expeditiously to claims of copyright infringement committed using our service.

## Filing a DMCA Notice of Alleged Infringement

If you are a copyright owner, or are authorized to act on behalf of one, or authorized to act under any exclusive right under copyright, please report alleged copyright infringements taking place on or through the Site by completing the following DMCA Notice of Alleged Infringement and delivering it to our designated copyright agent.

Upon receipt of the notice as described below, we will take whatever action, in our sole discretion, we deem appropriate, including removal of the challenged material from the Site.

### Please provide the following information:

1. **Identify the copyrighted work** that you claim has been infringed, or - if multiple copyrighted works are covered by this notice - you may provide a representative list of the copyrighted works that you claim have been infringed.
2. **Identify the material or link** you claim is infringing (or the subject of infringing activity) and that access to which is to be disabled, including at a minimum, if applicable, the URL of the link shown on the Site where such material may be found.
3. **Provide your mailing address**, telephone number, and, if available, email address.
4. **Include both of the following statements** in the body of the Notice:
   - "I hereby state that I have a good faith belief that the disputed use of the copyrighted material is not authorized by the copyright owner, its agent, or the law (e.g., as a fair use)."
   - "I hereby state that the information in this Notice is accurate and, under penalty of perjury, that I am the owner, or authorized to act on behalf of the owner, of the copyright or of an exclusive right under the copyright that is allegedly infringed."
5. **Provide your full legal name** and your electronic or physical signature.

Deliver this Notice, with all items completed, to our designated Copyright Agent:

**Copyright Agent**
${siteTitle}
Email: ${contactEmail}

## Counter-Notice

If you believe that your content that was removed (or to which access was disabled) is not infringing, or that you have the authorization from the copyright owner, the copyright owner's agent, or pursuant to the law, to post and use the material in your content, you may send a counter-notice containing the following information to the Copyright Agent:

1. Your physical or electronic signature;
2. Identification of the content that has been removed or to which access has been disabled and the location at which the content appeared before it was removed or disabled;
3. A statement that you have a good faith belief that the content was removed or disabled as a result of mistake or a misidentification of the content;
4. Your name, address, telephone number, and e-mail address.

If a counter-notice is received by the Copyright Agent, we may send a copy of the counter-notice to the original complaining party informing that person that it may replace the removed content or cease disabling it in 10 business days. Unless the copyright owner files an action seeking a court order against the content provider, member or user, the removed content may be replaced, or access to it restored, in 10 to 14 business days or more after receipt of the counter-notice, at our sole discretion.

## Repeat Infringer Policy

In accordance with the DMCA and other applicable law, we have adopted a policy of terminating, in appropriate circumstances and at our sole discretion, users who are deemed to be repeat infringers. We may also at our sole discretion limit access to the Service and/or terminate the accounts of any users who infringe any intellectual property rights of others, whether or not there is any repeat infringement.

## Misrepresentation Warning

Please note that under Section 512(f) of the DMCA, any person who knowingly materially misrepresents that material or activity is infringing, or that material or activity was removed or disabled by mistake or misidentification, may be subject to liability for damages, including costs and attorneys' fees. Do not submit false claims. Before filing a notice, consider whether the use may be protected by fair use, fair dealing, or a similar exception.

## A Note on AI-Generated Content

Much of the imagery on this Site is generated by AI models from text prompts. The copyright status of AI-generated works varies by jurisdiction and is an evolving area of law. If your claim concerns an AI-generated image that you believe reproduces or is derived from your copyrighted work (for example, a character, artwork, or photograph), please identify your original work clearly in your notice so we can evaluate the claim properly. We review all notices in good faith regardless of how the challenged material was created.

## What Happens After You File

1. We review your notice for completeness. Incomplete notices may be rejected or returned for correction.
2. If the notice is valid, we remove or disable access to the challenged material, typically within a few business days.
3. We notify the user who posted the material and provide them a copy of your notice (which may include your contact information, as required by the process).
4. The user may file a counter-notice as described above; if they do, we follow the restoration timeline described in the Counter-Notice section.

## Response Time

We aim to acknowledge properly filed DMCA notices within 2–5 business days. Complex claims, or claims involving AI-generated derivative works, may take longer to evaluate.
`.trim();
  }

  if (key === 'disclaimer') {
    return `
# Disclaimer

Last updated: July 6, 2026

The information provided by ${siteTitle} ("we," "us," or "our") on our website (the "Site") is for general informational purposes only. All information on the Site is provided in good faith, however, we make no representation or warranty of any kind, express or implied, regarding the accuracy, adequacy, validity, reliability, availability, or completeness of any information on the Site.

UNDER NO CIRCUMSTANCE SHALL WE HAVE ANY LIABILITY TO YOU FOR ANY LOSS OR DAMAGE OF ANY KIND INCURRED AS A RESULT OF THE USE OF THE SITE OR RELIANCE ON ANY INFORMATION PROVIDED ON THE SITE. YOUR USE OF THE SITE AND YOUR RELIANCE ON ANY INFORMATION ON THE SITE IS SOLELY AT YOUR OWN RISK.

## External Links Disclaimer

The Site may contain (or you may be sent through the Site) links to other websites or content belonging to or originating from third parties or links to websites and features in banners or other advertising. Such external links are not investigated, monitored, or checked for accuracy, adequacy, validity, reliability, availability, or completeness by us.

WE DO NOT WARRANT, ENDORSE, GUARANTEE, OR ASSUME RESPONSIBILITY FOR THE ACCURACY OR RELIABILITY OF ANY INFORMATION OFFERED BY THIRD-PARTY WEBSITES LINKED THROUGH THE SITE OR ANY WEBSITE OR FEATURE LINKED IN ANY BANNER OR OTHER ADVERTISING. WE WILL NOT BE A PARTY TO OR IN ANY WAY BE RESPONSIBLE FOR MONITORING ANY TRANSACTION BETWEEN YOU AND THIRD-PARTY PROVIDERS OF PRODUCTS OR SERVICES.

## AI Generated Content Disclaimer

Our platform hosts prompts and imagery that are primarily generated by Artificial Intelligence algorithms and models. The nature of AI models means that they can be unpredictable and may generate results that are unexpected, inaccurate, offensive, or inappropriate. The text, images, and other content displayed on this Site that are generated by AI are provided "AS IS."

1. **No Guarantee of Consistency:** The images displayed are to serve as a representation of what a given prompt text might output under certain circumstances, but we do not guarantee replicability. Using the exact same prompt may yield entirely different results across different models, platforms, or even consecutive runs.
2. **Not Professional Advice:** Prompts that request code generation, legal text, medical advice, financial guidance, or other specialized professional outputs should NOT be considered as professional advice. The AI-generated output is strictly for illustrative or starting-point purposes. Always seek the advice of a qualified professional before making any decisions based on AI-generated content.
3. **Copyright and Ownership of AI Output:** The legal status of copyright for AI-generated works is currently evolving. We provide no warranty that the images or text generated from our prompts are free from copyright claims by third parties, nor do we guarantee that you can claim copyright ownership over any generated works.

## User-Generated Content Disclaimer

The Site contains content submitted by users, including prompts, comments, and images. We do not endorse to any extent any user-generated content or any opinion, recommendation, or advice expressed therein. User-generated content is the sole responsibility of the user who submitted it, and we are not liable for any errors, omissions, or any resulting harm or damages. If you believe user-submitted content infringes your rights or violates our policies, please report it via our [Contact page](/contact) or, for copyright claims, follow the process in our [DMCA Notice](/dmca).

## Trademark Disclaimer

ChatGPT, Gemini, Grok, Qwen, and all other AI tool and model names referenced on this Site are trademarks of their respective owners. ${siteTitle} is an independent platform and is not affiliated with, endorsed by, or sponsored by any of these companies. References to these tools are made solely to identify which platform a prompt is designed for.

## Errors and Omissions Disclaimer

While we strive to keep the information on the Site accurate and up to date, the AI landscape changes rapidly — models are updated, renamed, deprecated, and released frequently. Information about specific tools, model capabilities, or prompt techniques may become outdated without notice. We are under no obligation to update information that has become obsolete, and we reserve the right to change, remove, or correct any content on the Site at any time without prior notice.

## Fair Use Disclaimer

The Site may include copyrighted material the use of which has not always been specifically authorized by the copyright owner, such as screenshots or references used for commentary, criticism, education, and review. We believe this constitutes "fair use" of such material as provided for under applicable copyright law. If you wish to use any such material for purposes that go beyond fair use, you must obtain permission from the copyright owner.

## Views Expressed Disclaimer

Any views or opinions expressed on the Site — including in blog posts, guides, and comments — are personal to their authors and do not represent the views of ${siteTitle}, its staff, or its affiliates, unless explicitly stated. We are not responsible or liable for any content posted by users or third parties.

## Affiliates Disclaimer

The Site may contain links to affiliate websites, and we receive an affiliate commission for any purchases made by you on the affiliate website using such links. Affiliate relationships do not influence which prompts or tools we feature, and we aim to clearly identify sponsored or affiliate content where it appears.

## No Professional Relationship

Your use of the Site does not create any professional, advisory, fiduciary, or client relationship between you and ${siteTitle}. The Site is a content-discovery platform, not a professional services provider.

## Contact Us

If you have any questions about this Disclaimer, please contact us at ${contactEmail}.
`.trim();
  }

  if (key === 'cookies') {
    return `
# Cookies Policy

Last updated: July 6, 2026

This Cookie Policy explains how ${siteTitle} ("we", "us", "our") uses cookies and similar technologies to recognize you when you visit our website. It explains what these technologies are and why we use them, as well as your rights to control our use of them.

## What are cookies?

Cookies are small data files that are placed on your computer or mobile device when you visit a website. Cookies are widely used by website owners in order to make their websites work, or to work more efficiently, as well as to provide reporting information.

## Why do we use cookies?

We use first- and third-party cookies for several reasons. Some cookies are required for technical reasons in order for our website to operate, and we refer to these as "essential" or "strictly necessary" cookies. Other cookies enable us to track and target the interests of our users to enhance the experience on our website. Third parties serve cookies through our website for advertising, analytics, and other purposes.

## Types of cookies we use

- **Essential website cookies:** These cookies are strictly necessary to provide you with services available through our website and to use some of its features, such as access to secure areas, account authentication, and remembering your cookie preferences. Because they are essential, they cannot be switched off in our systems.
- **Performance and functionality cookies:** These cookies are used to enhance the performance and functionality of our website but are non-essential to its use — for example, remembering your theme preference (light or dark mode) or your recently viewed prompts. Without these cookies, certain functionality may become unavailable.
- **Analytics and customization cookies:** These cookies collect information that is used either in aggregate form to help us understand how our website is being used or how effective our marketing campaigns are, or to help us customize our website for you.
- **Advertising cookies:** These cookies are used to make advertising messages more relevant to you. They perform functions like preventing the same ad from continuously reappearing, ensuring that ads are properly displayed for advertisers, and in some cases selecting advertisements that are based on your interests. We use Google AdSense for displaying advertisements.

## Cookies we set

| Cookie | Type | Purpose | Duration |
| --- | --- | --- | --- |
| Authentication tokens (Supabase) | Essential | Keeps you signed in to your account | Session / up to 1 year |
| Theme preference | Functionality | Remembers your light/dark mode choice | 1 year |
| Local likes and bookmarks | Functionality | Remembers prompts you liked or saved on this device | Persistent (local storage) |
| Google AdSense (e.g. \`__gads\`, \`__gpi\`) | Advertising | Ad delivery, frequency capping, and measurement | Up to 13 months |
| Google Analytics (e.g. \`_ga\`) | Analytics | Distinguishes visitors and measures site usage | Up to 2 years |

Exact cookie names and durations may vary as our providers update their services. Local storage entries (such as likes) are similar to cookies but remain on your device until you clear your browser data.

## How can I control cookies?

You have the right to decide whether to accept or reject cookies. You can exercise your cookie rights in several ways:

- **Browser controls.** Most browsers let you refuse or delete cookies through their settings. Instructions are available for [Chrome](https://support.google.com/chrome/answer/95647), [Firefox](https://support.mozilla.org/en-US/kb/enhanced-tracking-protection-firefox-desktop), [Safari](https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac), and [Edge](https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09).
- **Advertising opt-outs.** Visit [Google Ads Settings](https://adssettings.google.com/authenticated), [aboutads.info](https://www.aboutads.info/choices/), or [youronlinechoices.eu](https://www.youronlinechoices.eu/) (EU users) to opt out of personalized advertising.
- **Analytics opt-out.** Google provides a [browser add-on](https://tools.google.com/dlpage/gaoptout) that prevents Google Analytics from using your data.
- **Do Not Track.** Some browsers send a "Do Not Track" signal. Because no industry standard for responding to these signals currently exists, we do not respond to them at this time.

If you choose to reject cookies, you may still use our website, though your access to some functionality and areas of our website may be restricted — for example, you will not be able to stay signed in.

## Consent

Where required by law (such as in the EEA and UK), we ask for your consent before placing non-essential cookies. You can withdraw or change your consent at any time using the methods described above. Essential cookies do not require consent as the website cannot function without them.

## Google AdSense and the DoubleClick cookie

Google, as a third-party vendor, uses cookies to serve ads on our Service. Google's use of the DoubleClick cookie enables it and its partners to serve ads to our users based on their visit to our Service or other websites on the Internet. You may opt out of the use of the DoubleClick cookie for interest-based advertising by visiting the [Google Ads Settings](https://adssettings.google.com/authenticated) page, or opt out of third-party vendor cookies at [aboutads.info](https://www.aboutads.info/choices/).

## Changes to our Cookie Policy

We may update this Cookie Policy from time to time in order to reflect changes to the cookies we use or for other operational, legal, or regulatory reasons. Please revisit this Cookie Policy regularly to stay informed about our use of cookies and related technologies.

## Contact us

If you have any questions about our use of cookies or other technologies, please email us at ${contactEmail}.
`.trim();
  }

  return '';
}

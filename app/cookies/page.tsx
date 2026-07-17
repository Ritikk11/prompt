import { fetchSettings } from '@/lib/data';
import Markdown from '@/components/MarkdownRenderer';
import { notFound } from 'next/navigation';
import { getStaticPageContent, staticPageMetadata } from '@/lib/static-pages';

export async function generateMetadata() {
  const settings = await fetchSettings();
  const page = getStaticPageContent(settings, 'cookies', settings.pageCookies, '');
  return staticPageMetadata(page);
}

export default async function CookiesPolicy() {
  const settings = await fetchSettings();
  const siteTitle = settings.siteTitle || 'Our Platform';
  const contactEmail = settings.contactEmail || 'contact@aipromptmatrix.in';

  const defaultContent = `
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
`;
  const page = getStaticPageContent(settings, 'cookies', settings.pageCookies, defaultContent);
  if (!page.visible) notFound();

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 md:py-20 fade-in">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-black mb-4 text-surface-900 dark:text-white">{page.title}</h1>
        <p className="text-lg text-surface-600 dark:text-surface-300 max-w-2xl mx-auto">
          {page.subtitle}
        </p>
      </div>
      <div className="bg-white dark:bg-surface-900 shadow-xl shadow-surface-200/20 dark:shadow-none border border-surface-200 dark:border-surface-800 rounded-3xl p-8 md:p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-a:text-primary-500 hover:prose-a:text-primary-600 prose-img:rounded-2xl relative z-10">
          <Markdown>{page.body}</Markdown>
        </div>
      </div>
    </div>
  );
}

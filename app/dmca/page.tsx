export const runtime = 'edge';

import { fetchSettings } from '@/lib/data';
import Markdown from '@/components/MarkdownRenderer';
import { notFound } from 'next/navigation';
import { getStaticPageContent, staticPageMetadata } from '@/lib/static-pages';

export async function generateMetadata() {
  const settings = await fetchSettings();
  const page = getStaticPageContent(settings, 'dmca', settings.pageDmca, '');
  return staticPageMetadata(page);
}

export default async function Dmca() {
  const settings = await fetchSettings();
  const siteTitle = settings.siteTitle || 'Our Platform';
  
  const defaultContent = `
# DMCA Notice

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
${siteTitle} Legal Department
Email: dmca@${typeof window !== 'undefined' ? window.location.hostname : 'example.com'}

## Counter-Notice

If you believe that your content that was removed (or to which access was disabled) is not infringing, or that you have the authorization from the copyright owner, the copyright owner's agent, or pursuant to the law, to post and use the material in your content, you may send a counter-notice containing the following information to the Copyright Agent:

1. Your physical or electronic signature;
2. Identification of the content that has been removed or to which access has been disabled and the location at which the content appeared before it was removed or disabled;
3. A statement that you have a good faith belief that the content was removed or disabled as a result of mistake or a misidentification of the content;
4. Your name, address, telephone number, and e-mail address.

If a counter-notice is received by the Copyright Agent, we may send a copy of the counter-notice to the original complaining party informing that person that it may replace the removed content or cease disabling it in 10 business days. Unless the copyright owner files an action seeking a court order against the content provider, member or user, the removed content may be replaced, or access to it restored, in 10 to 14 business days or more after receipt of the counter-notice, at our sole discretion.

## Repeat Infringer Policy

In accordance with the DMCA and other applicable law, we have adopted a policy of terminating, in appropriate circumstances and at our sole discretion, users who are deemed to be repeat infringers. We may also at our sole discretion limit access to the Service and/or terminate the accounts of any users who infringe any intellectual property rights of others, whether or not there is any repeat infringement.
`;
  const page = getStaticPageContent(settings, 'dmca', settings.pageDmca, defaultContent);
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

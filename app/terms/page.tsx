import { fetchSettings } from '@/lib/data';
import Markdown from '@/components/MarkdownRenderer';
import { notFound } from 'next/navigation';
import { getStaticPageContent, staticPageMetadata } from '@/lib/static-pages';

export async function generateMetadata() {
  const settings = await fetchSettings();
  const page = getStaticPageContent(settings, 'terms', settings.pageTerms, '');
  return staticPageMetadata(page);
}

export default async function TermsOfService() {
  const settings = await fetchSettings();
  const siteTitle = settings.siteTitle || 'Our Platform';
  
  const defaultContent = `
# Terms of Service

Last updated: May 23, 2026

Welcome to ${siteTitle}. By accessing or using our website, services, and software provided through or in connection with the service ("Service"), you signify that you have read, understood, and agree to be bound by this Terms of Service Agreement ("Agreement"), whether or not you are a registered user of our Service. 

## 1. Description of Service

${siteTitle} provides a platform for discovering, sharing, and utilizing AI-generated prompts for various large language models and image generation models. You understand and agree that the Service is provided "AS-IS" and that ${siteTitle} assumes no responsibility for the timeliness, deletion, misdelivery, or failure to store any user communications or personalization settings.

## 2. Eligibility

You must be at least 13 years old to use the Service. By agreeing to these Terms, you represent and warrant to us that: (a) you are at least 13 years old; (b) you have not previously been suspended or removed from the Service; and (c) your registration and your use of the Service is in compliance with any and all applicable laws and regulations.

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

## 6. Intellectual Property

The Service is owned and operated by ${siteTitle}. The visual interfaces, graphics, design, compilation, information, data, computer code (including source code or object code), products, software, services, and all other elements of the Service ("Materials") provided by ${siteTitle} are protected by intellectual property and other laws. All Materials included in the Service are the property of ${siteTitle} or its third-party licensors. You may not make use of the Materials except as expressly authorized by ${siteTitle}. 

## 7. Modification of Terms

We reserve the right to change these Terms on a going-forward basis at any time. Please check these Terms periodically for changes. If a change to these Terms materially modifies your rights or obligations, we may require that you accept the modified Terms in order to continue to use the Service. Material modifications are effective upon your acceptance of the modified Terms. Immaterial modifications are effective upon publication.

## 8. Disclaimers and Limitations of Liability

THE SERVICE AND ALL MATERIALS AND CONTENT AVAILABLE THROUGH THE SERVICE ARE PROVIDED "AS IS" AND ON AN "AS AVAILABLE" BASIS. WE DISCLAIM ALL WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, RELATING TO THE SERVICE AND ALL MATERIALS AND CONTENT AVAILABLE THROUGH THE SERVICE, INCLUDING: (A) ANY IMPLIED WARRANTY OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, QUIET ENJOYMENT, OR NON-INFRINGEMENT; AND (B) ANY WARRANTY ARISING OUT OF COURSE OF DEALING, USAGE, OR TRADE.

IN NO EVENT WILL ${siteTitle} BE LIABLE TO YOU FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL OR PUNITIVE DAMAGES (INCLUDING DAMAGES FOR LOSS OF PROFITS, GOODWILL, OR ANY OTHER INTANGIBLE LOSS) ARISING OUT OF OR RELATING TO YOUR ACCESS TO OR USE OF, OR YOUR INABILITY TO ACCESS OR USE, THE SERVICE OR ANY MATERIALS OR CONTENT ON THE SERVICE.

## 9. General

These Terms, together with the Privacy Policy and any other agreements expressly incorporated by reference into these Terms, are the entire and exclusive understanding and agreement between you and ${siteTitle} regarding your use of the Service. You may not assign or transfer these Terms or your rights under these Terms, in whole or in part, by operation of law or otherwise, without our prior written consent.
`;
  const page = getStaticPageContent(settings, 'terms', settings.pageTerms, defaultContent);
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

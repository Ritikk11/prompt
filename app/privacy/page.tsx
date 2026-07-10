import { fetchSettings } from '@/lib/data';
import Markdown from '@/components/MarkdownRenderer';
import { notFound } from 'next/navigation';
import { getStaticPageContent, staticPageMetadata } from '@/lib/static-pages';

export async function generateMetadata() {
  const settings = await fetchSettings();
  const page = getStaticPageContent(settings, 'privacy', settings.pagePrivacy, '');
  return staticPageMetadata(page);
}

export default async function PrivacyPolicy() {
  const settings = await fetchSettings();
  const siteTitle = settings.siteTitle || 'Our Site';
  const contactEmail = settings.contactEmail || 'contact@aipromptmatrix.in';

  const defaultContent = `
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

- **Grievance Officer:** [Name of Grievance Officer]
- **Email:** ${contactEmail}
- **Address:** [Registered business address]

We will acknowledge and resolve complaints within the timelines prescribed by applicable law.

## 13. Changes to This Policy

We may update this Privacy Policy from time to time. We will post the updated version on this page and revise the "Last updated" date above. Material changes may be notified through the Service or by other means. Your continued use of the Service after changes take effect constitutes acceptance of the revised policy.

## 14. Contact Us

If you have any questions about this Privacy Policy or our data practices, please contact us at ${contactEmail}.
`;
  const page = getStaticPageContent(settings, 'privacy', settings.pagePrivacy, defaultContent);
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

import { fetchSettings } from '@/lib/data';
import Markdown from '@/components/MarkdownRenderer';

export default async function PrivacyPolicy() {
  const settings = await fetchSettings();
  
  const defaultContent = `
# Privacy Policy

Last updated: May 23, 2026

This Privacy Policy explains how ${settings.siteTitle || 'Our Site'} ("we", "us", "our") collects, uses, and shares your information when you use our website.

## 1. Information We Collect

We collect information you provide directly to us, such as when you create an account, submit a prompt, or contact us for support.

### Log Data

Like many website operators, we collect information that your browser sends whenever you visit our site ("Log Data"). This Log Data may include information such as your computer's Internet Protocol ("IP") address, browser type, browser version, the pages of our site that you visit, the time and date of your visit, the time spent on those pages and other statistics.

## 2. Use of Information

We use the information we collect to:
- Provide, maintain, and improve our services
- Communicate with you about your account and the site
- Monitor and analyze trends and usage
- Detect, investigate, and prevent fraudulent transactions and other illegal activities

## 3. Cookies

We use "cookies" to collect information and improve our services. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our site.

## 4. Contact Us

If you have any questions about this Privacy Policy, please contact us.
`;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 md:py-20 fade-in">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-black mb-4 text-surface-900 dark:text-white">Privacy Policy</h1>
        <p className="text-lg text-surface-600 dark:text-surface-300 max-w-2xl mx-auto">
          Learn how we collect, use, and protect your personal information.
        </p>
      </div>
      <div className="bg-white dark:bg-surface-900 shadow-xl shadow-surface-200/20 dark:shadow-none border border-surface-200 dark:border-surface-800 rounded-3xl p-8 md:p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-a:text-primary-500 hover:prose-a:text-primary-600 prose-img:rounded-2xl relative z-10">
          <Markdown>{settings.pagePrivacy || defaultContent}</Markdown>
        </div>
      </div>
    </div>
  );
}

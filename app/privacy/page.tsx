export const runtime = 'edge';
import Link from 'next/link';

export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 md:py-20 fade-in">
      <h1 className="text-3xl md:text-5xl font-black mb-8 text-surface-900 dark:text-white">Privacy Policy</h1>
      <div className="prose dark:prose-invert max-w-none text-surface-700 dark:text-surface-300">
        <p className="mb-4">Last updated: {new Date().toLocaleDateString()}</p>
        <p className="mb-4">Welcome to our Prompt Gallery. We are committed to protecting your personal information and your right to privacy. This privacy notice describes how and why we might collect, store, use, and/or share your information when you use our services.</p>
        
        <h2 className="text-2xl font-bold mt-8 mb-4 text-surface-900 dark:text-white">1. Information We Collect</h2>
        <p className="mb-4">We collect personal information that you voluntarily provide to us when you register on the Services, express an interest in obtaining information about us or our products and Services, when you participate in activities on the Services, or otherwise when you contact us.</p>
        <p className="mb-4"><strong>Data Collected Automatically:</strong> We automatically collect certain information when you visit, use, or navigate the Services. This information does not reveal your specific identity (like your name or contact information) but may include device and usage information, such as your IP address, browser and device characteristics, operating system, language preferences, referring URLs, device name, country, location, and information about how and when you use our Services.</p>

        <h2 className="text-2xl font-bold mt-8 mb-4 text-surface-900 dark:text-white">2. Use of Information</h2>
        <p className="mb-4">We process your information for purposes based on legitimate business interests, the fulfillment of our contract with you, compliance with our legal obligations, and/or your consent. This includes:</p>
        <ul className="list-disc pl-5 mb-4 space-y-2">
          <li><strong>To facilitate account creation and logon process.</strong></li>
          <li><strong>To post testimonials.</strong> We post testimonials on our Services that may contain personal information.</li>
          <li><strong>Request feedback.</strong> We may use your information to request feedback and to contact you about your use of our Services.</li>
          <li><strong>To deliver and facilitate delivery of services to the user.</strong></li>
          <li><strong>To respond to user inquiries/offer support to users.</strong></li>
        </ul>
        
        <h2 className="text-2xl font-bold mt-8 mb-4 text-surface-900 dark:text-white">3. Cookies, Tracking & Third-Party Ads (AdSense)</h2>
        <p className="mb-2">We use cookies and similar tracking technologies (like web beacons and pixels) to access or store information. Specific information about how we use such technologies and how you can refuse certain cookies is set out in our <Link href="/cookies" className="text-primary-500 hover:text-primary-600 underline">Cookies Policy</Link>.</p>
        <p className="mb-4"><strong>Google AdSense:</strong> We use Google AdSense to display advertisements on our site. Google, as a third-party vendor, uses cookies to serve ads. Google&apos;s use of advertising cookies enables it and its partners to serve ads to our users based on their visit to our sites and/or other sites on the Internet. Users may opt out of personalized advertising by visiting Google Ads Settings.</p>
        
        <h2 className="text-2xl font-bold mt-8 mb-4 text-surface-900 dark:text-white">4. Your Rights</h2>
        <p className="mb-4">Depending on where you are located geographically, the applicable privacy law may mean you have certain rights regarding your personal information. These may include:</p>
        <ul className="list-disc pl-5 mb-4 space-y-2">
          <li><strong>Right to access:</strong> You can request copies of your personal information.</li>
          <li><strong>Right to rectification:</strong> You can request that we correct any information you believe is inaccurate.</li>
          <li><strong>Right to erasure:</strong> You can request that we erase your personal information, under certain conditions.</li>
          <li><strong>Right to restrict processing:</strong> You can request that we restrict the processing of your personal data.</li>
          <li><strong>Right to object to processing:</strong> You can object to our processing of your personal data.</li>
          <li><strong>Right to data portability:</strong> You can request that we transfer the data that we have collected to another organization, or directly to you.</li>
        </ul>
        
        <h2 className="text-2xl font-bold mt-8 mb-4 text-surface-900 dark:text-white">5. Data Retention</h2>
        <p className="mb-4">We will only keep your personal information for as long as it is necessary for the purposes set out in this privacy notice, unless a longer retention period is required or permitted by law (such as tax, accounting, or other legal requirements). When we have no ongoing legitimate business need to process your personal information, we will either delete or anonymize such information.</p>

        <h2 className="text-2xl font-bold mt-8 mb-4 text-surface-900 dark:text-white">6. Changes to this Privacy Policy</h2>
        <p className="mb-4">We may update this privacy notice from time to time. The updated version will be indicated by an updated &quot;Revised&quot; date and the updated version will be effective as soon as it is accessible. If we make material changes to this privacy notice, we may notify you either by prominently posting a notice of such changes or by directly sending you a notification.</p>
        
        <h2 className="text-2xl font-bold mt-8 mb-4 text-surface-900 dark:text-white">Contact Us</h2>
        <p className="mb-4">For more information about our privacy practices, if you have questions, or if you would like to make a complaint, please contact us by e-mail at <strong>contact@aipromptmatrix.in</strong>.</p>
      </div>
    </div>
  );
}

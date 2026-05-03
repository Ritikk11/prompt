export const runtime = 'edge';

export default function CookiesPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 md:py-20 fade-in">
      <h1 className="text-3xl md:text-5xl font-black mb-8 text-surface-900 dark:text-white">Cookies Policy</h1>
      <div className="prose dark:prose-invert max-w-none text-surface-700 dark:text-surface-300">
        <p className="mb-4">Last updated: {new Date().toLocaleDateString()}</p>
        <p className="mb-4">This Cookie Policy explains how our website uses cookies and similar technologies to recognize you when you visit our website. It explains what these technologies are and why we use them, as well as your rights to control our use of them.</p>

        <h2 className="text-2xl font-bold mt-8 mb-4 text-surface-900 dark:text-white">What are cookies?</h2>
        <p className="mb-4">Cookies are small data files that are placed on your computer or mobile device when you visit a website. Cookies are widely used by website owners in order to make their websites work, or to work more efficiently, as well as to provide reporting information.</p>

        <h2 className="text-2xl font-bold mt-8 mb-4 text-surface-900 dark:text-white">Why do we use cookies?</h2>
        <p className="mb-4">We use first and third-party cookies for several reasons. Some cookies are required for technical reasons in order for our website to operate, and we refer to these as "essential" or "strictly necessary" cookies. Other cookies also enable us to track and target the interests of our users to enhance the experience on our Website. Third parties serve cookies through our Website for advertising, analytics and other purposes.</p>

        <h2 className="text-2xl font-bold mt-8 mb-4 text-surface-900 dark:text-white">Types of Cookies We Use</h2>
        <ul className="list-disc pl-5 mb-4 space-y-2">
          <li><strong>Essential website cookies:</strong> These cookies are strictly necessary to provide you with services available through our website and to use some of its features, such as access to secure areas.</li>
          <li><strong>Performance and functionality cookies:</strong> These cookies are used to enhance the performance and functionality of our website but are non-essential to their use. However, without these cookies, certain functionality may become unavailable.</li>
          <li><strong>Analytics and customization cookies:</strong> These cookies collect information that is used either in aggregate form to help us understand how our website is being used or how effective our marketing campaigns are, or to help us customize our Website for you.</li>
          <li><strong>Advertising cookies:</strong> These cookies are used to make advertising messages more relevant to you. They perform functions like preventing the same ad from continuously reappearing, ensuring that ads are properly displayed for advertisers, and in some cases selecting advertisements that are based on your interests. We use Google AdSense for displaying advertisements.</li>
        </ul>

        <h2 className="text-2xl font-bold mt-8 mb-4 text-surface-900 dark:text-white">How can I control cookies?</h2>
        <p className="mb-4">You have the right to decide whether to accept or reject cookies. You can exercise your cookie rights by setting your preferences in the Cookie Consent Manager or by amending your web browser controls to accept or refuse cookies. If you choose to reject cookies, you may still use our website though your access to some functionality and areas of our website may be restricted.</p>
        
        <h2 className="text-2xl font-bold mt-8 mb-4 text-surface-900 dark:text-white">Google AdSense and DoubleClick Cookie</h2>
        <p className="mb-4">Google, as a third-party vendor, uses cookies to serve ads on our Service. Google's use of the DoubleClick cookie enables it and its partners to serve ads to our users based on their visit to our Service or other web sites on the Internet. You may opt out of the use of the DoubleClick Cookie for interest-based advertising by visiting the <a href="https://adssettings.google.com/authenticated" target="_blank" rel="noreferrer" className="text-primary-500 hover:text-primary-600 underline">Google Ads Settings</a> web page.</p>

        <h2 className="text-2xl font-bold mt-8 mb-4 text-surface-900 dark:text-white">Changes to our Cookie Policy</h2>
        <p className="mb-4">We may update this Cookie Policy from time to time in order to reflect changes to the cookies we use or for other operational, legal or regulatory reasons. Please revisit this Cookie Policy regularly to stay informed about our use of cookies and related technologies.</p>

        <h2 className="text-2xl font-bold mt-8 mb-4 text-surface-900 dark:text-white">Contact Us</h2>
        <p className="mb-4">If you have any questions about our use of cookies or other technologies, please email us at <strong>contact@aipromptmatrix.in</strong>.</p>
      </div>
    </div>
  );
}




export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 md:py-20 fade-in">
      <h1 className="text-3xl md:text-5xl font-black mb-8 text-surface-900 dark:text-white">Privacy Policy</h1>
      <div className="prose dark:prose-invert max-w-none text-surface-700 dark:text-surface-300">
        <p className="mb-4">Last updated: {new Date().toLocaleDateString()}</p>
        <p className="mb-4">Welcome to our Prompt Gallery. We are committed to protecting your personal information and your right to privacy.</p>
        
        <h2 className="text-2xl font-bold mt-8 mb-4 text-surface-900 dark:text-white">1. Information We Collect</h2>
        <p className="mb-4">When you visit our website, we automatically collect certain information about your device, including information about your web browser, IP address, time zone, and some of the cookies that are installed on your device.</p>
        
        <h2 className="text-2xl font-bold mt-8 mb-4 text-surface-900 dark:text-white">2. Use of Information</h2>
        <p className="mb-4">We use the information we collect to help us screen for potential risk and fraud, and more generally to improve and optimize our site.</p>
        
        <h2 className="text-2xl font-bold mt-8 mb-4 text-surface-900 dark:text-white">3. Cookies & Advertising</h2>
        <p className="mb-4">We use third-party advertising companies to serve ads when you visit our website. These companies may use information (not including your name, address, email address, or telephone number) about your visits to this and other websites in order to provide advertisements about goods and services of interest to you.</p>
        
        <h2 className="text-2xl font-bold mt-8 mb-4 text-surface-900 dark:text-white">4. Your Rights</h2>
        <p className="mb-4">You have the right to access personal information we hold about you and to ask that your personal information be corrected, updated, or deleted.</p>
        
        <h2 className="text-2xl font-bold mt-8 mb-4 text-surface-900 dark:text-white">Contact Us</h2>
        <p className="mb-4">For more information about our privacy practices, if you have questions, or if you would like to make a complaint, please contact us by e-mail.</p>
      </div>
    </div>
  );
}

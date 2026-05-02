


export default function TermsOfService() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 md:py-20 fade-in">
      <h1 className="text-3xl md:text-5xl font-black mb-8 text-surface-900 dark:text-white">Terms of Service</h1>
      <div className="prose dark:prose-invert max-w-none text-surface-700 dark:text-surface-300">
        <p className="mb-4">Last updated: {new Date().toLocaleDateString()}</p>
        
        <h2 className="text-2xl font-bold mt-8 mb-4 text-surface-900 dark:text-white">1. Acceptance of Terms</h2>
        <p className="mb-4">By accessing and using this website, you accept and agree to be bound by the terms and provision of this agreement.</p>
        
        <h2 className="text-2xl font-bold mt-8 mb-4 text-surface-900 dark:text-white">2. Use License</h2>
        <p className="mb-4">Permission is granted to copy and use the prompts available on this website for creative and commercial purposes, unless otherwise stated. You may not use our website for any illegal or unauthorized purpose.</p>
        
        <h2 className="text-2xl font-bold mt-8 mb-4 text-surface-900 dark:text-white">3. Disclaimer</h2>
        <p className="mb-4">The materials on our website are provided on an &apos;as is&apos; basis. We make no warranties, expressed or implied, and hereby disclaim and negate all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</p>
        
        <h2 className="text-2xl font-bold mt-8 mb-4 text-surface-900 dark:text-white">4. Limitations</h2>
        <p className="mb-4">In no event shall we or our suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on our website.</p>
      </div>
    </div>
  );
}

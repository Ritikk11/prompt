const fs = require('fs');

const pages = {
  about: {
    title: 'About Us',
    subtitle: 'Discover our mission, our story, and what makes this platform the ultimate destination for AI creators.',
    key: 'pageAbout'
  },
  contact: {
    title: 'Contact Us',
    subtitle: "Have a question or want to work together? We'd love to hear from you.",
    key: 'pageContact'
  },
  terms: {
    title: 'Terms of Service',
    subtitle: 'Please read these terms carefully before using our platform.',
    key: 'pageTerms'
  },
  privacy: {
    title: 'Privacy Policy',
    subtitle: 'Learn how we collect, use, and protect your personal information.',
    key: 'pagePrivacy'
  },
  dmca: {
    title: 'DMCA Notice',
    subtitle: 'Information regarding copyright infringement claims.',
    key: 'pageDmca'
  },
  disclaimer: {
    title: 'Disclaimer',
    subtitle: 'Important legal information and limitations of liability.',
    key: 'pageDisclaimer'
  }
};

Object.entries(pages).forEach(([page, meta]) => {
  const f = `app/${page}/page.tsx`;
  let content = fs.readFileSync(f, 'utf8');
  
  // Replace the return block
  const returnRegex = /return \([\s\S]*?\);/g;
  const newReturn = `return (
    <div className="max-w-4xl mx-auto px-4 py-12 md:py-20 fade-in">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-black mb-4 text-surface-900 dark:text-white">${meta.title}</h1>
        <p className="text-lg text-surface-600 dark:text-surface-300 max-w-2xl mx-auto">
          ${meta.subtitle}
        </p>
      </div>
      <div className="bg-white dark:bg-surface-900 shadow-xl shadow-surface-200/20 dark:shadow-none border border-surface-200 dark:border-surface-800 rounded-3xl p-8 md:p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-a:text-primary-500 hover:prose-a:text-primary-600 prose-img:rounded-2xl relative z-10">
          <Markdown>{settings.${meta.key} || defaultContent}</Markdown>
        </div>
      </div>
    </div>
  );`;
  
  content = content.replace(returnRegex, newReturn);
  fs.writeFileSync(f, content);
});

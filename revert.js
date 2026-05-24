const fs = require('fs');
const files = [
  'app/profile/page.tsx', 'app/search/page.tsx', 'app/cookies/page.tsx',
  'app/tag/[tag]/page.tsx', 'app/icon.tsx', 'app/dmca/page.tsx',
  'app/terms/page.tsx', 'app/contact/page.tsx', 'app/page.tsx',
  'app/admin/page.tsx', 'app/api/generate-post/route.ts',
  'app/api/revalidate/route.ts', 'app/about/page.tsx', 'app/explore/page.tsx',
  'app/feed.xml/route.ts', 'app/privacy/page.tsx', 'app/post/[slug]/page.tsx',
  'app/not-found.tsx', 'app/section/[slug]/page.tsx', 'app/tool/[tool]/page.tsx',
  'app/submit/page.tsx', 'app/disclaimer/page.tsx', 'app/auth/callback/page.tsx',
  'app/auth/login-popup/page.tsx', 'app/sitemap.ts', 'app/page/[slug]/page.tsx'
];
files.forEach(f => {
  try {
    let content = fs.readFileSync(f, 'utf8');
    if (!content.includes("export const runtime = 'edge';")) {
       fs.writeFileSync(f, "export const runtime = 'edge';\n" + content);
    }
  } catch(e) {}
});

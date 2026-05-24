const fs = require('fs');
const files = [
  'app/tag/[tag]/page.tsx',
  'app/post/[slug]/page.tsx',
  'app/section/[slug]/page.tsx',
  'app/tool/[tool]/page.tsx',
  'app/page/[slug]/page.tsx'
];
files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  fs.writeFileSync(f, content.replace("export const runtime = 'edge';", ""));
});

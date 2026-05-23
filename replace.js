const fs = require('fs');
['about','terms','privacy','dmca','disclaimer','contact'].forEach(p => {
  const f = 'app/'+p+'/page.tsx';
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace("import Markdown from 'react-markdown';", "import Markdown from '@/components/MarkdownRenderer';");
  fs.writeFileSync(f, content);
});

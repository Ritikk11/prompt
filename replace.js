const fs = require('fs');

function fix(file) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/([a-zA-Z0-9_]+)\[0\]\?\.thumbnailUrl \|\| \.images/g, "$1[0].thumbnailUrl || $1[0].images");
  content = content.replace(/([a-zA-Z0-9_]+)\?\.thumbnailUrl \|\| \.images/g, "$1.thumbnailUrl || $1.images");
  
  fs.writeFileSync(file, content);
}

fix('components/FeaturedSlider.tsx');
fix('app/post/[slug]/PostContent.tsx');
console.log('Done');

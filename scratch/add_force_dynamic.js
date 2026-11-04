const fs = require('fs');
const path = require('path');

function getFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(fullPath));
    } else if (file.startsWith('route.ts') || file.startsWith('route.tsx')) {
      results.push(fullPath);
    }
  });
  return results;
}

const apiDir = path.join(__dirname, '..', 'app', 'api');
const routeFiles = getFiles(apiDir);

let updated = 0;
routeFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('export const dynamic')) {
    return;
  }

  // Prepend or add export const dynamic = "force-dynamic";
  const newContent = `export const dynamic = "force-dynamic";\n\n` + content;
  fs.writeFileSync(file, newContent, 'utf8');
  console.log(`Added force-dynamic to: ${path.relative(path.join(__dirname, '..'), file)}`);
  updated++;
});

console.log(`\nUpdated ${updated} route files with export const dynamic = "force-dynamic".`);


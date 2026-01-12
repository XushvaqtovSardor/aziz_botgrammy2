const fs = require('fs');
const path = require('path');

function removeCommentsAndLogs(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  const original = content;

  const lines = content.split('\n');
  const cleanedLines = lines.filter((line) => {
    if (!line.trim().startsWith('//')) return true;
    if (line.includes('http')) return true;
    return false;
  });

  content = cleanedLines.join('\n');

  content = content.replace(/\/\*\*[\s\S]*?\*\//g, '');

  content = content.replace(/\n\s*\n\s*\n+/g, '\n\n');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf-8');
    return true;
  }
  return false;
}

function walkDir(dir) {
  let modifiedCount = 0;
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      modifiedCount += walkDir(filePath);
    } else if (file.endsWith('.ts')) {
      if (removeCommentsAndLogs(filePath)) {
        modifiedCount++;
        console.log(`✓ Cleaned: ${filePath}`);
      }
    }
  }

  return modifiedCount;
}

const modifiedCount = walkDir('src');
console.log(`\n✅ Cleaned ${modifiedCount} files`);

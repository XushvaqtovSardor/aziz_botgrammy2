const fs = require('fs');

const filePath = 'src/modules/admin/admin.handler.ts';

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Split into lines for easier manipulation
const lines = content.split('\n');

// Find the line with "const formattedCaption"
let startLine = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('// --- FORMATLASH QISMI ---')) {
    startLine = i + 1; // Next line should be the const
    break;
  }
}

if (startLine === -1) {
  console.log('❌ FORMATLASH QISMI topilmadi!');
  process.exit(1);
}

console.log(`Found FORMATLASH QISMI at line ${startLine + 1}`);

// Now find the closing backtick
let endLine = -1;
for (let i = startLine; i < lines.length; i++) {
  if (lines[i].includes('╰────────────────────')) {
    endLine = i;
    break;
  }
}

if (endLine === -1) {
  console.log('❌ Closing line topilmadi!');
  process.exit(1);
}

console.log(`Found closing line at ${endLine + 1}`);
console.log(`\nOld format:`);
for (let i = startLine; i <= endLine; i++) {
  console.log(`Line ${i + 1}: ${lines[i]}`);
}

// Replace lines
lines[startLine] = lines[startLine].replace(
  'const formattedCaption = `╭────────────────────',
  'const formattedCaption = `▸ ${contentType === \'serial\' ? \'Serial\' : \'Kino\'} nomi : ${title || \'Noma\\\'lum\'}'
);

lines[startLine + 1] = '▸ ${contentType === \'serial\' ? \'Serial\' : \'Kino\'} kodi: ${code}';
lines[startLine + 2] = '▸ Janrlari: ${genre || \'Janr ko\\\'rsatilmadi\'}';
lines[startLine + 3] = '▸ Kanal: ${targetChannelLink}';
lines[startLine + 4] = ''; // Empty line instead of closing box

// Write back
content = lines.join('\n');
fs.writeFileSync(filePath, content, 'utf8');

console.log(`\n✅ Caption format muvaffaqiyatli o'zgartirildi!`);

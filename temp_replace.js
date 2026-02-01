const fs = require('fs');

const filePath = 'src/modules/admin/admin.handler.ts';

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Define the exact old text to replace
const oldText = `const formattedCaption = \`╭────────────────────
├‣  \${contentType === 'serial' ? 'Serial' : 'Kino'} nomi : \${title || 'Noma\\'lum'}
├‣  \${contentType === 'serial' ? 'Serial' : 'Kino'} kodi: \${code}
├‣  Janrlari: \${genre || 'Janr ko\\'rsatilmadi'}
├‣  Kanal: \${targetChannelLink}
╰────────────────────`;

// Define the new text
const newText = `const formattedCaption = \`▸ \${contentType === 'serial' ? 'Serial' : 'Kino'} nomi : \${title || 'Noma\\'lum'}
▸ \${contentType === 'serial' ? 'Serial' : 'Kino'} kodi: \${code}
▸ Janrlari: \${genre || 'Janr ko\\'rsatilmadi'}
▸ Kanal: \${targetChannelLink}`;

// Replace
content = content.replace(oldText, newText);

// Write back
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Caption format muvaffaqiyatli o\'zgartirildi!');

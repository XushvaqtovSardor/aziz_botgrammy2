/**
 * Test script to verify share link generation
 */

function generateShareLink(botUsername, code, title, isSerial = false) {
  const startParam = isSerial ? `s${code}` : code;
  const emoji = isSerial ? '📺' : '🎬';
  const type = isSerial ? 'Serialni' : 'Kinoni';

  const text = `${emoji} ${title}\n\n📖 Kod: ${code}\n\n👇 ${type} tomosha qilish uchun bosing:`;
  const encodedText = encodeURIComponent(text);
  const deepLink = `https://t.me/${botUsername}?start=${startParam}`;
  const shareLink = `https://t.me/share/url?url=${deepLink}&text=${encodedText}`;

  return {
    deepLink,
    shareLink,
    text,
  };
}

// Test examples
console.log('=== KINO TEST ===');
const movieLink = generateShareLink(
  'Myfriendinformationbot',
  '45',
  'The Matrix',
);
console.log('Text:', movieLink.text);
console.log('\nDeep Link:', movieLink.deepLink);
console.log('\nShare Link:', movieLink.shareLink);
console.log('\nShare Link (decoded):');
console.log(
  '  URL:',
  decodeURIComponent(movieLink.shareLink.split('?url=')[1].split('&text=')[0]),
);
console.log(
  '  Text:',
  decodeURIComponent(movieLink.shareLink.split('&text=')[1]),
);

console.log('\n\n=== SERIAL TEST ===');
const serialLink = generateShareLink(
  'Myfriendinformationbot',
  '23',
  'Game of Thrones',
  true,
);
console.log('Text:', serialLink.text);
console.log('\nDeep Link:', serialLink.deepLink);
console.log('\nShare Link:', serialLink.shareLink);
console.log('\nShare Link (decoded):');
console.log(
  '  URL:',
  decodeURIComponent(serialLink.shareLink.split('?url=')[1].split('&text=')[0]),
);
console.log(
  '  Text:',
  decodeURIComponent(serialLink.shareLink.split('&text=')[1]),
);

console.log('\n\n=== LINK FORMATINI TEKSHIRISH ===');
console.log('Agar user share linkni bosganda:');
console.log('1. Telegram share dialog ochiladi');
console.log('2. User chatni tanlaydi');
console.log("3. Xabar yuboriladi va qabul qilgan kishi uchun tugma ko'rinadi");
console.log(
  '4. Tugmani bosish deep linkga olib boradi: https://t.me/Myfriendinformationbot?start=45',
);
console.log(
  '5. Bot /start 45 komandasi bilan ishga tushadi va kinoni yuboradi',
);

// Simple test script to verify bot is responding
const { Bot } = require('grammy');

const token = '8525401678:AAFUQJlXgHaElVH-_Q4k2KDpGwTS1Yph9M8';
const bot = new Bot(token);

bot.command('start', (ctx) => {
  console.log('Received /start from:', ctx.from.id);
  ctx.reply('✅ Bot ishlayapti!');
});

bot.on('message:text', (ctx) => {
  console.log('Received message:', ctx.message.text);
  ctx.reply(`Echo: ${ctx.message.text}`);
});

bot.catch((err) => {
  console.error('Bot error:', err);
});

console.log('🤖 Test bot starting...');
bot
  .start({
    onStart: ({ username }) => {
      console.log(`✅ Bot @${username} started!`);
      console.log('📱 Send /start to test');
    },
  })
  .catch((err) => {
    console.error('❌ Failed to start:', err.message);
    process.exit(1);
  });

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { BotContext } from '../../bot/bot.context';
import { InlineKeyboard } from 'grammy';
import { UserService } from './services/user.service';
import { MovieService } from '../content/services/movie.service';
import { SerialService } from '../content/services/serial.service';
import { EpisodeService } from '../content/services/episode.service';
import { MovieEpisodeService } from '../content/services/movie-episode.service';
import { ChannelService } from '../channel/services/channel.service';
import { ChannelStatusService } from '../channel/services/channel-status.service';
import { PremiumService } from '../payment/services/premium.service';
import { PaymentService } from '../payment/services/payment.service';
import { WatchHistoryService } from '../content/services/watch-history.service';
import { LanguageService } from '../language/language.service';
import { FieldService } from '../field/services/field.service';
import { SettingsService } from '../settings/services/settings.service';
import { AdminService } from '../admin/services/admin.service';
import { GrammyBotService } from '../../common/grammy/grammy-bot.module';
import { PrismaService } from '../../prisma/prisma.service';
import { MainMenuKeyboard } from './keyboards/main-menu.keyboard';
import { ChannelStatus } from '@prisma/client';

@Injectable()
export class UserHandler implements OnModuleInit {
  private readonly logger = new Logger(UserHandler.name);

  private waitingForReceipt = new Map<
    number,
    { amount: number; duration: number; months: number }
  >();

  constructor(
    private userService: UserService,
    private movieService: MovieService,
    private serialService: SerialService,
    private episodeService: EpisodeService,
    private movieEpisodeService: MovieEpisodeService,
    private channelService: ChannelService,
    private channelStatusService: ChannelStatusService,
    private premiumService: PremiumService,
    private paymentService: PaymentService,
    private watchHistoryService: WatchHistoryService,
    private languageService: LanguageService,
    private fieldService: FieldService,
    private settingsService: SettingsService,
    private adminService: AdminService,
    private grammyBot: GrammyBotService,
    private prisma: PrismaService,
  ) {}

  onModuleInit() {
    try {
      this.registerHandlers();
    } catch (error) {
      this.logger.error('❌ Failed to initialize UserHandler');
      this.logger.error(`Error: ${error.message}`);
      this.logger.error('Stack:', error.stack);
      throw error;
    }
  }

  private registerHandlers() {
    const bot = this.grammyBot.bot;

    bot.use(async (ctx, next) => {
      if (ctx.from && ctx.from.id) {
        try {
          const hasTelegramPremium = ctx.from.is_premium || false;

          await this.prisma.user.updateMany({
            where: { telegramId: String(ctx.from.id) },
            data: { hasTelegramPremium },
          });
        } catch (error) {
          this.logger.error(
            `❌ Failed to update telegram premium status for user ${ctx.from.id}`,
          );
          this.logger.error(`Error: ${error.message}`);
        }
      }
      await next();
    });

    bot.command('start', async (ctx) => {
      try {
        await this.handleStart(ctx);
      } catch (error) {
        this.logger.error(
          `❌ Error in /start command for user ${ctx.from?.id}`,
        );
        this.logger.error(`Error: ${error.message}`);
        this.logger.error('Stack:', error.stack);
        await ctx
          .reply("❌ Xatolik yuz berdi. Iltimos qaytadan urinib ko'ring.")
          .catch((e) =>
            this.logger.error('Failed to send error message:', e.message),
          );
      }
    });

    bot.hears("🔍 Kino kodi bo'yicha qidirish", async (ctx) => {
      try {
        await this.handleSearch(ctx);
      } catch (error) {
        this.logger.error(
          `❌ Error in search handler for user ${ctx.from?.id}: ${error.message}`,
        );
        await ctx.reply('❌ Xatolik yuz berdi.').catch(() => {});
      }
    });

    bot.hears('💎 Premium sotib olish', async (ctx) => {
      try {
        await this.showPremium(ctx);
      } catch (error) {
        this.logger.error(
          `❌ Error in premium handler for user ${ctx.from?.id}: ${error.message}`,
        );
        await ctx.reply('❌ Xatolik yuz berdi.').catch(() => {});
      }
    });

    bot.hears('ℹ️ Bot haqida', async (ctx) => {
      try {
        await this.showAbout(ctx);
      } catch (error) {
        this.logger.error(
          `❌ Error in about handler for user ${ctx.from?.id}: ${error.message}`,
        );
        await ctx.reply('❌ Xatolik yuz berdi.').catch(() => {});
      }
    });

    bot.hears('📞 Aloqa', async (ctx) => {
      try {
        await this.showContact(ctx);
      } catch (error) {
        this.logger.error(
          `❌ Error in contact handler for user ${ctx.from?.id}: ${error.message}`,
        );
        await ctx.reply('❌ Xatolik yuz berdi.').catch(() => {});
      }
    });

    bot.hears('🔙 Orqaga', async (ctx) => {
      try {
        await this.handleBack(ctx);
      } catch (error) {
        this.logger.error(
          `❌ Error in back handler for user ${ctx.from?.id}: ${error.message}`,
        );
        await ctx.reply('❌ Xatolik yuz berdi.').catch(() => {});
      }
    });

    bot.callbackQuery(/^movie_\d+$/, async (ctx) => {
      try {
        await this.handleMovieCallback(ctx);
      } catch (error) {
        this.logger.error(
          `❌ Error in movie callback for user ${ctx.from?.id}: ${error.message}`,
        );
        this.logger.error('Stack:', error.stack);
        await ctx
          .answerCallbackQuery({ text: '❌ Xatolik yuz berdi.' })
          .catch(() => {});
      }
    });

    bot.callbackQuery(/^serial_\d+$/, async (ctx) => {
      try {
        await this.handleSerialCallback(ctx);
      } catch (error) {
        this.logger.error(
          `❌ Error in serial callback for user ${ctx.from?.id}: ${error.message}`,
        );
        await ctx
          .answerCallbackQuery({ text: '❌ Xatolik yuz berdi.' })
          .catch(() => {});
      }
    });

    bot.callbackQuery(/^episode_(\d+)_(\d+)$/, async (ctx) => {
      try {
        await this.handleEpisodeCallback(ctx);
      } catch (error) {
        this.logger.error(
          `❌ Error in episode callback for user ${ctx.from?.id}: ${error.message}`,
        );
        await ctx
          .answerCallbackQuery({ text: '❌ Xatolik yuz berdi.' })
          .catch(() => {});
      }
    });

    bot.callbackQuery(/^movie_episode_(\d+)_(\d+)$/, async (ctx) => {
      try {
        await this.handleMovieEpisodeCallback(ctx);
      } catch (error) {
        this.logger.error(
          `❌ Error in movie episode callback for user ${ctx.from?.id}: ${error.message}`,
        );
        await ctx
          .answerCallbackQuery({ text: '❌ Xatolik yuz berdi.' })
          .catch(() => {});
      }
    });

    bot.callbackQuery(/^field_channel_(\d+)$/, async (ctx) => {
      try {
        await this.handleFieldChannelCallback(ctx);
      } catch (error) {
        this.logger.error(
          `❌ Error in field channel callback for user ${ctx.from?.id}: ${error.message}`,
        );
        await ctx
          .answerCallbackQuery({ text: '❌ Xatolik yuz berdi.' })
          .catch(() => {});
      }
    });

    bot.callbackQuery(/^check_subscription$/, async (ctx) => {
      try {
        await this.handleCheckSubscription(ctx);
      } catch (error) {
        this.logger.error(
          `❌ Error in check subscription callback for user ${ctx.from?.id}: ${error.message}`,
        );
        await ctx
          .answerCallbackQuery({ text: '❌ Xatolik yuz berdi.' })
          .catch(() => {});
      }
    });

    bot.callbackQuery(/^show_premium$/, async (ctx) => {
      try {
        await this.showPremium(ctx);
      } catch (error) {
        this.logger.error(
          `❌ Error in show premium callback for user ${ctx.from?.id}: ${error.message}`,
        );
        await ctx
          .answerCallbackQuery({ text: '❌ Xatolik yuz berdi.' })
          .catch(() => {});
      }
    });

    bot.callbackQuery(/^back_to_main$/, async (ctx) => {
      try {
        await this.handleBackCallback(ctx);
      } catch (error) {
        this.logger.error(
          `❌ Error in back callback for user ${ctx.from?.id}: ${error.message}`,
        );
        await ctx
          .answerCallbackQuery({ text: '❌ Xatolik yuz berdi.' })
          .catch(() => {});
      }
    });

    bot.callbackQuery(/^buy_premium_(\d+)$/, async (ctx) => {
      try {
        await this.handlePremiumPurchase(ctx);
      } catch (error) {
        this.logger.error(
          `❌ Error in premium purchase callback for user ${ctx.from?.id}: ${error.message}`,
        );
        await ctx
          .answerCallbackQuery({ text: '❌ Xatolik yuz berdi.' })
          .catch(() => {});
      }
    });

    bot.callbackQuery(/^upload_receipt$/, async (ctx) => {
      try {
        await this.handleUploadReceipt(ctx);
      } catch (error) {
        this.logger.error(
          `❌ Error in upload receipt callback for user ${ctx.from?.id}: ${error.message}`,
        );
        await ctx
          .answerCallbackQuery({ text: '❌ Xatolik yuz berdi.' })
          .catch(() => {});
      }
    });

    bot.on('inline_query', async (ctx) => {
      try {
        await this.handleInlineQuery(ctx);
      } catch (error) {
        this.logger.error(
          `❌ Error in inline query for user ${ctx.from?.id}: ${error.message}`,
        );
      }
    });

    bot.on('chat_join_request', async (ctx) => {
      try {
        await this.handleJoinRequest(ctx);
      } catch (error) {
        this.logger.error(`❌ Error in join request handler: ${error.message}`);
      }
    });

    bot.on('chat_member', async (ctx) => {
      try {
        await this.handleChatMemberUpdate(ctx);
      } catch (error) {
        this.logger.error(`❌ Error in chat member handler: ${error.message}`);
      }
    });

    bot.on('my_chat_member', async (ctx) => {
      try {
        await this.handleChatMemberUpdate(ctx);
      } catch (error) {
        this.logger.error(
          `❌ Error in my_chat_member handler: ${error.message}`,
        );
      }
    });

    bot.on('message:photo', async (ctx) => {
      try {
        await this.handlePhotoMessage(ctx);
      } catch (error) {
        this.logger.error(
          `❌ Error in photo message handler for user ${ctx.from?.id}: ${error.message}`,
        );
        await ctx.reply('❌ Xatolik yuz berdi.').catch(() => {});
      }
    });

    bot.use(async (ctx, next) => {
      try {
        if (ctx.message && 'text' in ctx.message) {
          await this.handleTextMessage(ctx);
          return;
        } else {
          await next();
        }
      } catch (error) {
        this.logger.error(
          `❌ Error in text message handler for user ${ctx.from?.id}: ${error.message}`,
        );
        this.logger.error('Stack:', error.stack);
      }
    });
  }

  private async handleStart(ctx: BotContext) {
    if (!ctx.from) return;

    this.logger.log(
      `👤 User ${ctx.from.id} (${ctx.from.username || ctx.from.first_name}) started the bot`,
    );

    try {
      const payload = ctx.match;

      const hasTelegramPremium = ctx.from.is_premium || false;

      const user = await this.userService.findOrCreate(String(ctx.from.id), {
        firstName: ctx.from.first_name || '',
        lastName: ctx.from.last_name || '',
        username: ctx.from.username || '',
        languageCode: ctx.from.language_code || 'uz',
      });

      if (user.isBlocked) {
        await ctx.reply(
          '🚫 Siz botdan foydalanish huquqidan mahrum etilgansiz.\n\n' +
            `Sana: ${user.blockedAt?.toLocaleString('uz-UZ') || "Noma'lum"}`,
        );
        return;
      }

      await this.prisma.user.update({
        where: { id: user.id },
        data: { hasTelegramPremium },
      });

      const premiumStatus = await this.premiumService.checkPremiumStatus(
        user.id,
      );
      const isPremium = premiumStatus.isPremium && !premiumStatus.isExpired;

      const admin = await this.adminService.getAdminByTelegramId(
        String(ctx.from.id),
      );
      const isAdmin = !!admin;

      this.logger.log(
        `User ${ctx.from.id} - isPremium: ${isPremium}, isAdmin: ${isAdmin}`,
      );

      if (!isPremium && !isAdmin) {
        const hasSubscription = await this.checkSubscription(ctx, 0, 'start');
        if (!hasSubscription) {
          this.logger.log(
            `User ${ctx.from.id} needs to subscribe to mandatory channels`,
          );
          return;
        }
      }

      if (typeof payload === 'string' && payload.length > 0) {
        if (payload.startsWith('s')) {
          const code = parseInt(payload.substring(1));
          if (!isNaN(code)) {
            await this.sendSerialToUser(ctx, code);
            return;
          }
        } else {
          const code = parseInt(payload);
          if (!isNaN(code)) {
            await this.sendMovieToUser(ctx, code);
            return;
          }
        }
      }

      const welcomeMessage =
        `👋 Assalomu alaykum, ${ctx.from.first_name} botimizga xush kelibsiz.

✍🏻 Kino kodini yuboring.`.trim();

      await ctx.reply(
        welcomeMessage,
        MainMenuKeyboard.getMainMenu(isPremium, user.isPremiumBanned),
      );

      this.logger.log(
        `✅ Start command completed successfully for user ${ctx.from.id}`,
      );
    } catch (error) {
      this.logger.error(`❌ Error in handleStart for user ${ctx.from.id}`);
      this.logger.error(`Error: ${error.message}`);
      this.logger.error('Stack:', error.stack);
      throw error;
    }
  }

  private async showMovies(ctx: BotContext) {
    const fields = await this.fieldService.findAll();

    if (fields.length === 0) {
      await ctx.reply("❌ Hozircha kinolar yo'q.");
      return;
    }

    let message = "🎬 **Kino bo'limlari:**\n\n";
    message += "Qaysi bo'limdan kino ko'rmoqchisiz?\n";

    const keyboard = new InlineKeyboard();
    fields.forEach((field) => {
      keyboard.text(field.name, `field_${field.id}`).row();
    });
    keyboard.text('🔙 Orqaga', 'back_to_main');

    await ctx.reply(message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard,
    });
  }

  private async showSerials(ctx: BotContext) {
    await ctx.reply("📺 Seriallar bo'limi ishlab chiqilmoqda...");
  }

  private async handleSearch(ctx: BotContext) {
    if (!ctx.from) return;

    await ctx.reply(
      '🔍 **Qidirish**\n\n' +
        'Kino yoki serial kodini kiriting:\n' +
        'Masalan: 12345',
      { parse_mode: 'Markdown' },
    );
  }

  private async showAbout(ctx: BotContext) {
    if (!ctx.from) return;

    const user = await this.userService.findByTelegramId(String(ctx.from.id));

    const fields = await this.fieldService.findAll();

    if (fields.length === 0) {
      const emptyKeyboard = new InlineKeyboard().text(
        '🔙 Orqaga',
        'back_to_main',
      );
      await ctx.reply(
        'ℹ️ **Bot haqida**\n\n' +
          'Bu bot orqali minglab kino va seriallarni tomosha qilishingiz mumkin.\n\n' +
          '🎬 Kino va seriallar har kuni yangilanadi\n' +
          '📱 Mobil va kompyuterda ishlaydi\n' +
          "💎 Premium obuna bilan reklama yo'q\n\n" +
          "❌ Hozircha field kanallar yo'q.",
        {
          parse_mode: 'Markdown',
          reply_markup: emptyKeyboard,
        },
      );
      return;
    }

    let message = 'ℹ️ **Bot haqida**\n\n';
    message +=
      'Bu bot orqali minglab kino va seriallarni tomosha qilishingiz mumkin.\n\n';
    message += "📁 **Field kanallar ro'yxati:**\n\n";

    const keyboard = new InlineKeyboard();
    let buttonsInRow = 0;

    fields.forEach((field, index) => {
      message += `${index + 1}. ${field.name}\n`;
      keyboard.text(`${index + 1}`, `field_channel_${field.id}`);
      buttonsInRow++;

      if (buttonsInRow === 5) {
        keyboard.row();
        buttonsInRow = 0;
      }
    });

    keyboard.row().text('🔙 Orqaga', 'back_to_main');

    await ctx.reply(message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard,
    });
  }

  private async showFieldChannels(ctx: BotContext) {
    const fields = await this.fieldService.findAll();

    if (fields.length === 0) {
      await ctx.reply("❌ Hozircha field kanallar yo'q.");
      return;
    }

    let message = "📁 **Field kanallar ro'yxati:**\n\n";
    message += "Qaysi field kanaliga o'tmoqchisiz?\n\n";

    const keyboard = new InlineKeyboard();
    fields.forEach((field, index) => {
      message += `${index + 1}. ${field.name}\n`;
      keyboard.text(`${index + 1}`, `field_channel_${field.id}`);
      if ((index + 1) % 5 === 0) keyboard.row();
    });

    if (fields.length % 5 !== 0) keyboard.row();
    keyboard.text('🔙 Orqaga', 'back_to_main');

    await ctx.reply(message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard,
    });
  }

  private async showPremium(ctx: BotContext) {
    if (!ctx.from) return;

    const user = await this.prisma.user.findUnique({
      where: { telegramId: String(ctx.from.id) },
    });

    if (user?.isPremiumBanned) {
      await ctx.reply(
        "🚫 Sizda Premium sotib olish imkoniyati yo'q.\n\n" +
          "Sabab: Yolg'on to'lov ma'lumotlaridan foydalanganingiz uchun bloklangansiz.\n\n" +
          'ℹ️ Blokni faqat admin ochishi mumkin.',
      );
      return;
    }

    if (ctx.callbackQuery) {
      await ctx.answerCallbackQuery();
    }

    const premiumSettings = await this.premiumService.getSettings();

    const message = `
💎 **Premium obuna**

Premium bilan:
✅ Reklama yo'q
✅ Majburiy kanallarga obuna bo'lmasdan tomosha qiling
✅ Barcha kinolar ochiq
✅ Yangi kinolar birinchi bo'lib

💰 **Narxlar:**
├ 1 oy: ${premiumSettings.monthlyPrice.toLocaleString()} ${premiumSettings.currency}
├ 3 oy: ${premiumSettings.threeMonthPrice.toLocaleString()} ${premiumSettings.currency}
├ 6 oy: ${premiumSettings.sixMonthPrice.toLocaleString()} ${premiumSettings.currency}
└ 1 yil: ${premiumSettings.yearlyPrice.toLocaleString()} ${premiumSettings.currency}

Qaysi muddatga obuna bo'lmoqchisiz?
    `.trim();

    const keyboard = new InlineKeyboard()
      .text('1 oy', 'buy_premium_1')
      .text('3 oy', 'buy_premium_3')
      .row()
      .text('6 oy', 'buy_premium_6')
      .text('1 yil', 'buy_premium_12')
      .row()
      .text('🔙 Orqaga', 'back_to_main');

    if (ctx.callbackQuery) {
      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard,
      });
    } else {
      await ctx.reply(message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard,
      });
    }
  }

  private async handlePremiumPurchase(ctx: BotContext) {
    if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) return;
    if (!ctx.from) return;

    const user = await this.prisma.user.findUnique({
      where: { telegramId: String(ctx.from.id) },
    });

    if (user?.isPremiumBanned) {
      await ctx.answerCallbackQuery({
        text: "🚫 Sizda Premium sotib olish imkoniyati yo'q",
        show_alert: true,
      });
      return;
    }

    const months = parseInt(ctx.callbackQuery.data.replace('buy_premium_', ''));
    await ctx.answerCallbackQuery();

    const premiumSettings = await this.premiumService.getSettings();
    let price = premiumSettings.monthlyPrice;
    let duration = 30;

    switch (months) {
      case 1:
        price = premiumSettings.monthlyPrice;
        duration = 30;
        break;
      case 3:
        price = premiumSettings.threeMonthPrice;
        duration = 90;
        break;
      case 6:
        price = premiumSettings.sixMonthPrice;
        duration = 180;
        break;
      case 12:
        price = premiumSettings.yearlyPrice;
        duration = 365;
        break;
    }

    const botUsername = (await ctx.api.getMe()).username;
    const paymeUrl = this.generatePaymeUrl(
      ctx.from.id,
      price,
      duration,
      botUsername,
    );

    const message = `
💳 **To'lov ma'lumotlari**

📦 Obuna: ${months} oy
💰 Summa: ${price.toLocaleString()} ${premiumSettings.currency}

📝 **To'lov usuli:**

1️⃣ **Payme orqali:**
Quyidagi tugmani bosib to'lovni amalga oshiring.

2️⃣ **Kartadan kartaga:**
💳 Karta: ${premiumSettings.cardNumber}
👤 Egasi: ${premiumSettings.cardHolder}

To'lov qilgandan keyin chekni botga yuboring.
    `.trim();

    const keyboard = new InlineKeyboard()
      .url("💳 Payme orqali to'lash", paymeUrl)
      .row()
      .text('📸 Chek yuborish', 'upload_receipt')
      .row()
      .text('🔙 Orqaga', 'show_premium');

    await ctx.reply(message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard,
    });

    this.waitingForReceipt.set(ctx.from.id, {
      amount: price,
      duration,
      months,
    });
  }

  private async handleUploadReceipt(ctx: BotContext) {
    if (!ctx.callbackQuery || !ctx.from) return;

    await ctx.answerCallbackQuery();

    await ctx.reply(
      '📸 **Chekni yuborish**\n\n' +
        "To'lov chekini rasm sifatida yuboring.\n\n" +
        "💡 Chek aniq va tushunarli bo'lishi kerak.",
      { parse_mode: 'Markdown' },
    );
  }

  private async handlePhotoMessage(ctx: BotContext) {
    if (!ctx.from || !ctx.message || !('photo' in ctx.message)) return;

    const userId = ctx.from.id;

    const paymentInfo = this.waitingForReceipt.get(userId);

    if (!paymentInfo) {
      return;
    }

    try {
      const photo = ctx.message.photo[ctx.message.photo.length - 1];
      const fileId = photo.file_id;

      const user = await this.userService.findByTelegramId(String(userId));
      if (!user) {
        await ctx.reply('❌ Foydalanuvchi topilmadi.');
        return;
      }

      const payment = await this.paymentService.create(
        user.id,
        paymentInfo.amount,
        fileId,
        paymentInfo.duration,
      );

      this.waitingForReceipt.delete(userId);

      await ctx.reply(
        '✅ **Chek qabul qilindi!**\n\n' +
          `📝 To'lov ID: ${payment.id}\n` +
          `💰 Summa: ${paymentInfo.amount.toLocaleString()} UZS\n` +
          `⏱ Muddati: ${paymentInfo.months} oy\n\n` +
          "⏳ Chekingiz ko'rib chiqilmoqda. Tez orada javob beramiz!",
        { parse_mode: 'Markdown' },
      );

      await this.notifyAdminsNewPayment(payment, user, paymentInfo);
    } catch (error) {
      this.logger.error('Error processing receipt:', error);
      await ctx.reply(
        "❌ Chekni qayta ishlashda xatolik yuz berdi. Iltimos qayta urinib ko'ring.",
      );
    }
  }

  private async notifyAdminsNewPayment(
    payment: any,
    user: any,
    paymentInfo: { amount: number; duration: number; months: number },
  ) {
    try {
      const admins = await this.adminService.findAll();

      const message = `
🔔 **Yangi to'lov!**

👤 Foydalanuvchi: ${user.firstName}${user.lastName ? ' ' + user.lastName : ''}
🆔 Telegram ID: ${user.telegramId}
📝 Username: @${user.username || "yo'q"}

💰 Summa: ${paymentInfo.amount.toLocaleString()} UZS
⏱ Muddati: ${paymentInfo.months} oy (${paymentInfo.duration} kun)
🆔 Payment ID: ${payment.id}
      `.trim();

      const keyboard = new InlineKeyboard()
        .text('✅ Tasdiqlash', `approve_payment_${payment.id}`)
        .text('❌ Rad etish', `reject_payment_${payment.id}`);

      for (const admin of admins) {
        try {
          await this.grammyBot.bot.api.sendPhoto(
            admin.telegramId,
            payment.receiptFileId,
            {
              caption: message,
              parse_mode: 'Markdown',
              reply_markup: keyboard,
            },
          );
        } catch (error) {
          this.logger.error(
            `Failed to notify admin ${admin.telegramId}:`,
            error,
          );
        }
      }
    } catch (error) {
      this.logger.error('Error notifying admins:', error);
    }
  }

  private generatePaymeUrl(
    userId: number,
    amount: number,
    duration: number,
    botUsername: string,
  ): string {
    const merchantId = process.env.PAYME_MERCHANT_ID || '';

    if (!merchantId) {
      this.logger.error('PAYME_MERCHANT_ID not configured in .env');
      return 'https://checkout.paycom.uz';
    }

    const amountInTiyin = amount * 100;

    const params = Buffer.from(
      JSON.stringify({
        merchant_id: merchantId,
        amount: amountInTiyin,
        account: {
          user_id: String(userId),
          duration: duration,
        },
        callback: `https://t.me/${botUsername}`,
        callback_timeout: 15,
      }),
    ).toString('base64');

    const paymeEndpoint =
      process.env.PAYME_ENDPOINT || 'https://checkout.paycom.uz';
    return `${paymeEndpoint}/${params}`;
  }

  private async showSettings(ctx: BotContext) {
    await ctx.reply("⚙️ Sozlamalar bo'limi ishlab chiqilmoqda...");
  }

  private async handleBack(ctx: BotContext) {
    if (!ctx.from) return;

    const user = await this.userService.findByTelegramId(String(ctx.from.id));
    if (!user) return;

    const isPremium = user.isPremium || false;
    const isPremiumBanned = user.isPremiumBanned || false;

    await ctx.reply(
      '🏠 Asosiy menyu',
      MainMenuKeyboard.getMainMenu(isPremium, isPremiumBanned),
    );
  }

  private async handleBackCallback(ctx: BotContext) {
    if (!ctx.callbackQuery || !ctx.from) return;

    await ctx.answerCallbackQuery();

    const user = await this.userService.findByTelegramId(String(ctx.from.id));
    if (!user) return;

    const isPremium = user.isPremium || false;
    const isPremiumBanned = user.isPremiumBanned || false;

    try {
      await ctx.deleteMessage();
    } catch (error) {
      this.logger.error('Error deleting message:', error);
    }

    await ctx.reply(
      '🏠 Asosiy menyu',
      MainMenuKeyboard.getMainMenu(isPremium, isPremiumBanned),
    );
  }

  private async showContact(ctx: BotContext) {
    if (!ctx.from) return;

    const settings = await this.settingsService.getSettings();

    const message =
      settings.contactMessage ||
      `
📞 **Aloqa**

Savollaringiz bo'lsa murojaat qiling:
👤 Admin: ${settings.supportUsername || '@admin'}
    `.trim();

    const keyboard = new InlineKeyboard().text('🔙 Orqaga', 'back_to_main');

    await ctx.reply(message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard,
    });
  }

  private async handleTextMessage(ctx: BotContext) {
    if (!ctx.message || !('text' in ctx.message)) return;

    const text = ctx.message.text;

    if (
      text.startsWith('/') ||
      text.includes('🔍') ||
      text.includes('💎') ||
      text.includes('ℹ️') ||
      text.includes('📞') ||
      text.includes('🎬') ||
      text.includes('📺')
    ) {
      return;
    }

    const code = parseInt(text);
    if (!isNaN(code) && code > 0) {
      await this.handleCodeSearch(ctx, code);
    }
  }

  private async handleCodeSearch(ctx: BotContext, code: number) {
    if (!ctx.from) return;

    const user = await this.userService.findByTelegramId(String(ctx.from.id));
    if (!user) {
      this.logger.error(`[handleCodeSearch] User not found: ${ctx.from.id}`);
      return;
    }

    const premiumStatus = await this.premiumService.checkPremiumStatus(user.id);
    const isPremium = premiumStatus.isPremium && !premiumStatus.isExpired;

    if (!isPremium) {
      const hasSubscription = await this.checkSubscription(ctx, code, 'search');
      if (!hasSubscription) {
        return;
      }
    }

    const movie = await this.movieService.findByCode(String(code));
    if (movie) {
      await this.sendMovieToUser(ctx, code);
      return;
    }

    const serial = await this.serialService.findByCode(String(code));
    if (serial) {
      await this.sendSerialToUser(ctx, code);
      return;
    }

    await ctx.reply(`❌ ${code} kodli kino yoki serial topilmadi.`);
  }

  private async sendMovieToUser(ctx: BotContext, code: number) {
    if (!ctx.from) return;

    try {
      const movie = await this.movieService.findByCode(String(code));
      if (!movie) {
        await ctx.reply(`❌ ${code} kodli kino topilmadi.`);
        return;
      }

      const user = await this.userService.findByTelegramId(String(ctx.from.id));
      if (!user) return;

      const episodes = await this.movieEpisodeService.findByMovieId(movie.id);

      const botUsername = (await ctx.api.getMe()).username;
      const field = await this.fieldService.findOne(movie.fieldId);

      if (movie.totalEpisodes > 1) {
        const movieDeepLink = `https://t.me/${botUsername}?start=${movie.code}`;

        const caption = `╭────────────────────
├‣  Kino nomi: ${movie.title}
├‣  Kino kodi: ${movie.code}
├‣  Qism: ${movie.totalEpisodes}
├‣  Janrlari: ${movie.genre || "Noma'lum"}
├‣  Kanal: ${field?.channelLink || '@' + (field?.name || 'Kanal')}
╰────────────────────
▶️ Kinoni tomosha qilish uchun pastdagi taklif havolasi ustiga bosing. ⬇️
${movieDeepLink}`.trim();

        const keyboard = new InlineKeyboard();

        keyboard.text('1', `movie_episode_${movie.id}_1`);

        episodes.forEach((episode, index) => {
          keyboard.text(
            `${episode.episodeNumber}`,
            `movie_episode_${movie.id}_${episode.episodeNumber}`,
          );
          if ((index + 2) % 5 === 0) keyboard.row();
        });
        // const shareText =
        //   `\n` +
        //   `> ╭${'─'.repeat(20)}\n` +
        //   `> ├‣ Serial nomi: ${episodes.title}\n` +
        //   `> ├‣ Serial kodi: ${episodes.code}\n` +
        //   `> ├‣ Qism: ${}\n` +
        //   `> ├‣ Janrlari: ${movie.genre || "Noma'lum"}\n` +
        //   `> ├‣ Kanal: ${field?.channelLink || '@' + (field?.name || 'Kanal')}\n` +
        //   `> ╰${'─'.repeat(20)}\n\n` +
        //   `▶️ Kinoni tomosha qilish uchun pastdagi taklif havolasi ustiga bosing. ⬇️\n\n` +
        //   `https://t.me/${botUsername}?start=${movie.code}`;

        if ((episodes.length + 1) % 5 !== 0) keyboard.row();

        keyboard
          .switchInline('📤 Ulashish', `${caption}`)
          .row()
          .text('🔙 Orqaga', 'back_to_main');

        await ctx.replyWithPhoto(movie.posterFileId, {
          caption,
          reply_markup: keyboard,
        });

        await this.watchHistoryService.recordMovieWatch(user.id, movie.id);
      } else {
        if (movie.videoFileId) {
          const shareText =
            `\n` +
            `> ╭${'─'.repeat(20)}\n` +
            `> ├‣ Serial nomi: ${movie.title}\n` +
            `> ├‣ Serial kodi: ${movie.code}\n` +
            `> ├‣ Qism: 1\n` +
            `> ├‣ Janrlari: ${movie.genre || "Noma'lum"}\n` +
            `> ├‣ Kanal: ${field?.channelLink || '@' + (field?.name || 'Kanal')}\n` +
            `> ╰${'─'.repeat(20)}\n\n` +
            `▶️ Kinoni tomosha qilish uchun pastdagi taklif havolasi ustiga bosing. ⬇️\n\n` +
            `https://t.me/${botUsername}?start=${movie.code}`;
          const movieDeepLink = `https://t.me/${botUsername}?start=${movie.code}`;
          const shareKeyboard = new InlineKeyboard().switchInline(
            '📤 Ulashish',
            `${shareText}`,
          );

          const videoCaption = `╭────────────────────
├‣  Kino nomi: ${movie.title}
├‣  Kino kodi: ${movie.code}
├‣  Qism: 1
├‣  Janrlari: ${movie.genre || "Noma'lum"}
├‣  Kanal: ${field?.channelLink || '@' + (field?.name || 'Kanal')}
╰────────────────────
▶️ Kinoni tomosha qilish uchun pastdagi taklif havolasi ustiga bosing. ⬇️
${movieDeepLink}`.trim();

          await ctx.replyWithVideo(movie.videoFileId, {
            caption: videoCaption,
            protect_content: true,
            reply_markup: shareKeyboard,
          });

          await this.watchHistoryService.recordMovieWatch(user.id, movie.id);
        } else {
          await ctx.reply("⏳ Video hali yuklanmagan. Tez orada qo'shiladi.");
        }
      }
    } catch (error) {
      this.logger.error(`Error sending movie ${code}:`, error);
      this.logger.error(`Error stack:`, error.stack);
      await ctx.reply(
        "❌ Kino yuklashda xatolik yuz berdi. Iltimos admin bilan bog'laning.",
      );
    }
  }

  private async sendSerialToUser(ctx: BotContext, code: number) {
    if (!ctx.from) return;

    try {
      const serial = await this.serialService.findByCode(String(code));
      if (!serial) {
        await ctx.reply(`❌ ${code} kodli serial topilmadi.`);
        return;
      }

      const user = await this.userService.findByTelegramId(String(ctx.from.id));
      if (!user) return;

      const episodes = await this.episodeService.findBySerialId(serial.id);

      const botUsername = (await ctx.api.getMe()).username;
      const serialDeepLink = `https://t.me/${botUsername}?start=s${code}`;
      const field = await this.fieldService.findOne(serial.fieldId);

      const caption = `╭────────────────────
├‣  Serial nomi: ${serial.title}
├‣  Serial kodi: ${serial.code}
├‣  Qism: ${episodes.length}
├‣  Janrlari: ${serial.genre || "Noma'lum"}
├‣  Kanal: ${field?.channelLink || '@' + (field?.name || 'Kanal')}
╰────────────────────
▶️ Kinoni tomosha qilish uchun pastdagi taklif havolasi ustiga bosing. ⬇️
${serialDeepLink}`.trim();
      const shareText = `╭────────────────────\n├‣  Kino nomi: ${serial.title}\n├‣  Kino kodi: ${serial.code}\n├‣  Qism: ${episodes.length}\n├‣  Janrlari: ${serial.genre || "Noma'lum"}\n├‣  Kanal: ${field?.channelLink || '@' + (field?.name || 'Kanal')}\n╰────────────────────\n▶️ Kinoni tomosha qilish uchun pastdagi taklif havolasi ustiga bosing. ⬇️\nhttps://t.me/${botUsername}?start=${serial.code}`;

      const keyboard = new InlineKeyboard();
      episodes.forEach((episode, index) => {
        keyboard.text(
          `${episode.episodeNumber}`,
          `episode_${serial.id}_${episode.episodeNumber}`,
        );
        if ((index + 1) % 5 === 0) keyboard.row();
      });

      if (episodes.length % 5 !== 0) keyboard.row();

      keyboard
        .switchInline('📤 Ulashish', `${shareText}`)
        .row()
        .text('🔙 Orqaga', 'back_to_main');

      await ctx.replyWithPhoto(serial.posterFileId, {
        caption,
        parse_mode: 'Markdown',
        reply_markup: keyboard,
      });
    } catch (error) {
      this.logger.error(`Error sending serial ${code}:`, error);
      await ctx.reply(
        "❌ Serial yuklashda xatolik yuz berdi. Iltimos admin bilan bog'laning.",
      );
    }
  }

  private async checkSubscription(
    ctx: BotContext,
    contentCode?: number,
    contentType?: string,
  ): Promise<boolean> {
    if (!ctx.from) return false;

    const result = await this.channelStatusService.canUserAccessBot(
      String(ctx.from.id),
    );

    if (result.canAccess) {
      return true;
    }

    const needsAction = result.statuses.filter(
      (s) => s.status === ChannelStatus.left,
    );

    const externalChannels = needsAction.filter(
      (s) => s.channelType === 'EXTERNAL',
    );
    const requiredChannels = needsAction.filter(
      (s) => s.channelType !== 'EXTERNAL',
    );

    let message = `❌ Botdan foydalanish uchun quyidagi kanallarga obuna bo'lishingiz yoki join request yuborishingiz kerak:\n\n`;

    message += `<blockquote>💎 Premium obuna sotib olib, kanallarga obuna bo'lmasdan foydalanishingiz mumkin.</blockquote>`;

    if (contentCode && contentType) {
      message += `\n\n🎬 Kino kodi: <b>${contentCode}</b>`;
    }

    const keyboard = new InlineKeyboard();

    requiredChannels.forEach((channel) => {
      keyboard.url(channel.channelName, channel.channelLink).row();
    });

    if (externalChannels.length > 0) {
      externalChannels.forEach((channel) => {
        keyboard.url(channel.channelName, channel.channelLink).row();
      });
    }

    keyboard.text('✅ Tekshirish', 'check_subscription').row();
    keyboard.text('💎 Premium sotib olish', 'show_premium');

    await ctx.reply(message, {
      parse_mode: 'HTML',
      reply_markup: keyboard,
    });

    return false;
  }

  private async handleCheckSubscription(ctx: BotContext) {
    if (!ctx.callbackQuery || !ctx.from) return;

    await ctx.answerCallbackQuery({ text: 'Tekshirilmoqda...' });

    await this.channelStatusService.syncUserChannelStatuses(
      String(ctx.from.id),
      ctx.api,
    );

    const result = await this.channelStatusService.canUserAccessBot(
      String(ctx.from.id),
    );

    if (result.canAccess) {
      try {
        if (ctx.callbackQuery?.message) {
          await ctx.api.deleteMessage(
            ctx.callbackQuery.message.chat.id,
            ctx.callbackQuery.message.message_id,
          );
        }
      } catch (error) {}

      const hasRequested = result.statuses.some(
        (ch) => ch.status === ChannelStatus.requested,
      );

      if (hasRequested) {
        await ctx.reply(
          '🎬 Endi botdan foydalanishingiz mumkin.\n\n🔍 Kino yoki serial kodini yuboring.',
          { reply_markup: { remove_keyboard: true } },
        );
      } else {
        await ctx.reply(
          "✅ Siz barcha kanallarga obuna bo'ldingiz!\n\n🎬 Endi botdan foydalanishingiz mumkin.\n\n🔍 Kino yoki serial kodini yuboring.",
          { reply_markup: { remove_keyboard: true } },
        );
      }
      return;
    }

    const needsAction = result.statuses.filter(
      (s) => s.status === ChannelStatus.left,
    );

    const externalChannels = needsAction.filter(
      (s) => s.channelType === 'EXTERNAL',
    );
    const requiredChannels = needsAction.filter(
      (s) => s.channelType !== 'EXTERNAL',
    );

    let message = `❌ Botdan foydalanish uchun quyidagi kanallarga obuna bo'lishingiz yoki join request yuborishingiz kerak:\n\n`;

    message += `<blockquote>💎 Premium obuna sotib olib, kanallarga obuna bo'lmasdan foydalanishingiz mumkin.</blockquote>`;

    const keyboard = new InlineKeyboard();

    requiredChannels.forEach((channel) => {
      keyboard.url(channel.channelName, channel.channelLink).row();
    });

    if (externalChannels.length > 0) {
      externalChannels.forEach((channel) => {
        keyboard.url(channel.channelName, channel.channelLink).row();
      });
    }

    keyboard.text('✅ Tekshirish', 'check_subscription').row();
    keyboard.text('💎 Premium sotib olish', 'show_premium');

    try {
      await ctx.editMessageText(message, {
        parse_mode: 'HTML',
        reply_markup: keyboard,
      });
    } catch (error) {
      this.logger.error('Error updating subscription message:', error);
      await ctx.reply(message, {
        parse_mode: 'HTML',
        reply_markup: keyboard,
      });
    }
  }

  private async handleJoinRequest(ctx: BotContext) {
    if (!ctx.chatJoinRequest) return;

    const userId = ctx.chatJoinRequest.from.id;
    const chatId = String(ctx.chatJoinRequest.chat.id);

    await this.channelStatusService.updateStatus(
      String(userId),
      chatId,
      ChannelStatus.requested,
    );
  }

  private async handleChatMemberUpdate(ctx: BotContext) {
    const update = ctx.chatMember || ctx.myChatMember;
    if (!update) return;

    const userId = update.from.id;
    const chatId = String(update.chat.id);
    const oldStatus = update.old_chat_member.status;
    const newStatus = update.new_chat_member.status;

    if (
      ['member', 'administrator', 'creator'].includes(newStatus) &&
      !['member', 'administrator', 'creator'].includes(oldStatus)
    ) {
      await this.channelStatusService.updateStatus(
        String(userId),
        chatId,
        ChannelStatus.joined,
      );
    }

    if (['left', 'kicked'].includes(newStatus)) {
      await this.channelStatusService.updateStatus(
        String(userId),
        chatId,
        ChannelStatus.left,
      );

      try {
        const channel = await this.prisma.mandatoryChannel.findFirst({
          where: { channelId: chatId, isActive: true },
        });

        if (channel) {
          await ctx.api.sendMessage(
            userId,
            `⚠️ Siz <b>${channel.channelName}</b> kanaldan chiqib ketdingiz.\n\n` +
              `Botdan foydalanishda davom etish uchun qayta join request yuboring yoki obuna bo'ling.\n\n` +
              `Kanal: ${channel.channelLink}`,
            { parse_mode: 'HTML' },
          );
        }
      } catch (error) {}
    }
  }

  private async handleMovieCallback(ctx: BotContext) {
    if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) return;

    const code = parseInt(ctx.callbackQuery.data.replace('movie_', ''));
    await ctx.answerCallbackQuery();
    await this.sendMovieToUser(ctx, code);
  }

  private async handleSerialCallback(ctx: BotContext) {
    if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) return;

    const code = parseInt(ctx.callbackQuery.data.replace('serial_', ''));
    await ctx.answerCallbackQuery();
    await this.sendSerialToUser(ctx, code);
  }

  private async handleEpisodeCallback(ctx: BotContext) {
    if (!ctx.callbackQuery || !('data' in ctx.callbackQuery) || !ctx.from)
      return;

    const match = ctx.callbackQuery.data.match(/^episode_(\d+)_(\d+)$/);
    if (!match) return;

    const serialId = parseInt(match[1]);
    const episodeNumber = parseInt(match[2]);

    await ctx.answerCallbackQuery({
      text: `${episodeNumber}-qism yuklanmoqda...`,
    });

    try {
      const episode = await this.episodeService.findBySerialIdAndNumber(
        serialId,
        episodeNumber,
      );
      if (!episode) {
        await ctx.reply('❌ Qism topilmadi.');
        return;
      }

      const serial = await this.serialService.findById(serialId);
      const botUsername = (await ctx.api.getMe()).username;
      const field = await this.fieldService.findOne(serial.fieldId);

      const shareText = `╭────────────────────\n├‣  Serial nomi: ${serial.title}\n├‣  Serial kodi: ${serial.code}\n├‣  Qism: ${episodeNumber}\n├‣  Janrlari: ${serial.genre || "Noma'lum"}\n├‣  Kanal: ${field?.channelLink || '@' + (field?.name || 'Kanal')}\n╰────────────────────\n▶️ Kinoni tomosha qilish uchun pastdagi taklif havolasi ustiga bosing. ⬇️\nhttps://t.me/${botUsername}?start=s${serial.code}`;

      const serialDeepLink = `https://t.me/${botUsername}?start=s${serial.code}`;

      const shareKeyboard = new InlineKeyboard()
        .url(`📺 Serial kodi: ${serial.code}`, serialDeepLink)
        .row()
        .switchInline('📤 Ulashish', shareText);

      const videoCaption = `
╭────────────────────
├‣  Serial nomi : ${serial.title}
├‣  Serial kodi: ${serial.code}
├‣  Qism: ${episodeNumber}
├‣  Janrlari: ${serial.genre || "Noma'lum"}
├‣  Kanal: ${field?.channelLink || '@' + (field?.name || 'Kanal')}
╰────────────────────
▶️ Serialning to'liq qismini @${botUsername} dan tomosha qilishingiz mumkin!
      `.trim();

      if (episode.videoFileId) {
        await ctx.replyWithVideo(episode.videoFileId, {
          caption: videoCaption,
          protect_content: true,
          reply_markup: shareKeyboard,
        });
      } else if (episode.videoMessageId) {
        try {
          const videoData = JSON.parse(episode.videoMessageId);
          if (Array.isArray(videoData) && videoData.length > 0) {
            await ctx.api.copyMessage(
              ctx.from.id,
              videoData[0].channelId,
              videoData[0].messageId,
              {
                protect_content: true,
                reply_markup: shareKeyboard,
              },
            );
          }
        } catch (error) {
          this.logger.error('Error copying episode video:', error);
          await ctx.reply('❌ Video yuklashda xatolik.');
        }
      }
    } catch (error) {
      this.logger.error('Error handling episode callback:', error);
      await ctx.reply('❌ Qism yuklashda xatolik yuz berdi.');
    }
  }

  private async handleMovieEpisodeCallback(ctx: BotContext) {
    if (!ctx.callbackQuery || !('data' in ctx.callbackQuery) || !ctx.from)
      return;

    const match = ctx.callbackQuery.data.match(/^movie_episode_(\d+)_(\d+)$/);
    if (!match) return;

    const movieId = parseInt(match[1]);
    const episodeNumber = parseInt(match[2]);

    await ctx.answerCallbackQuery({
      text: `${episodeNumber}-qism yuklanmoqda...`,
    });

    try {
      const movie = await this.movieService.findById(movieId);
      if (!movie) {
        await ctx.reply('❌ Kino topilmadi.');
        return;
      }

      const botUsername = (await ctx.api.getMe()).username;
      const field = await this.fieldService.findOne(movie.fieldId);

      // Share message text
      const shareText = `╭────────────────────\n├‣  Kino nomi: ${movie.title}\n├‣  Kino kodi: ${movie.code}\n├‣  Qism: ${episodeNumber}\n├‣  Janrlari: ${movie.genre || "Noma'lum"}\n├‣  Kanal: ${field?.channelLink || '@' + (field?.name || 'Kanal')}\n╰────────────────────\n▶️ Kinoni tomosha qilish uchun pastdagi taklif havolasi ustiga bosing. ⬇️\nhttps://t.me/${botUsername}?start=${movie.code}`;

      const movieDeepLink = `https://t.me/${botUsername}?start=${movie.code}`;

      const shareKeyboard = new InlineKeyboard()
        .url(`🎬 Kino kodi: ${movie.code}`, movieDeepLink)
        .row()
        .switchInline('📤 Ulashish', shareText);

      const videoCaption = `
╭────────────────────
├‣  Kino nomi : ${movie.title}
├‣  Kino kodi: ${movie.code}
├‣  Qism: ${episodeNumber}
├‣  Janrlari: ${movie.genre || "Noma'lum"}
├‣  Kanal: ${field?.channelLink || '@' + (field?.name || 'Kanal')}
╰────────────────────
▶️ Kinoning to'liq qismini @${botUsername} dan tomosha qilishingiz mumkin!
      `.trim();

      if (episodeNumber === 1) {
        if (movie.videoFileId) {
          await ctx.replyWithVideo(movie.videoFileId, {
            caption: videoCaption,
            protect_content: true,
            reply_markup: shareKeyboard,
          });
        } else if (movie.videoMessageId) {
          try {
            const videoData = JSON.parse(movie.videoMessageId);
            if (Array.isArray(videoData) && videoData.length > 0) {
              await ctx.api.copyMessage(
                ctx.from.id,
                videoData[0].channelId,
                videoData[0].messageId,
                {
                  protect_content: true,
                  reply_markup: shareKeyboard,
                  caption: videoCaption,
                },
              );
            }
          } catch (error) {
            this.logger.error('Error copying movie video:', error);
            await ctx.reply('❌ Video yuklashda xatolik.');
          }
        }
      } else {
        const episode = await this.movieEpisodeService.findByMovieIdAndNumber(
          movieId,
          episodeNumber,
        );
        if (!episode) {
          await ctx.reply('❌ Qism topilmadi.');
          return;
        }

        if (episode.videoFileId) {
          await ctx.replyWithVideo(episode.videoFileId, {
            caption: videoCaption,
            protect_content: true,
            reply_markup: shareKeyboard,
          });
        } else if (episode.videoMessageId) {
          try {
            const videoData = JSON.parse(episode.videoMessageId);
            if (Array.isArray(videoData) && videoData.length > 0) {
              await ctx.api.copyMessage(
                ctx.from.id,
                videoData[0].channelId,
                videoData[0].messageId,
                {
                  protect_content: true,
                  reply_markup: shareKeyboard,
                  caption: videoCaption,
                },
              );
            }
          } catch (error) {
            this.logger.error('Error copying movie episode video:', error);
            await ctx.reply('❌ Video yuklashda xatolik.');
          }
        }
      }
    } catch (error) {
      this.logger.error('Error handling movie episode callback:', error);
      await ctx.reply('❌ Qism yuklashda xatolik yuz berdi.');
    }
  }

  private async handleFieldChannelCallback(ctx: BotContext) {
    if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) return;

    const fieldId = parseInt(
      ctx.callbackQuery.data.replace('field_channel_', ''),
    );

    try {
      const field = await this.fieldService.findOne(fieldId);
      if (!field) {
        await ctx.answerCallbackQuery({
          text: '❌ Field topilmadi.',
          show_alert: true,
        });
        return;
      }

      await ctx.answerCallbackQuery();

      const channelUrl = field.channelLink || `https://t.me/${field.channelId}`;

      const keyboard = new InlineKeyboard()
        .url(`📁 ${field.name} kanaliga o'tish`, channelUrl)
        .row()
        .text('🔙 Orqaga', 'back_to_main');

      await ctx.reply(
        `📁 **${field.name}**\n\n` +
          `Kanalga o'tish uchun quyidagi tugmani bosing:`,
        {
          parse_mode: 'Markdown',
          reply_markup: keyboard,
        },
      );
    } catch (error) {
      this.logger.error('Error handling field channel callback:', error);
      await ctx.answerCallbackQuery({
        text: '❌ Xatolik yuz berdi.',
        show_alert: true,
      });
    }
  }

  private async handleInlineQuery(ctx: BotContext) {
    if (!ctx.inlineQuery) return;

    const query = ctx.inlineQuery.query.trim();

    const serialMatch = query.match(/^s(\d+)$/i);
    const movieMatch = !serialMatch ? query.match(/^(\d+)$/) : null;

    const results: any[] = [];

    try {
      if (movieMatch) {
        const code = parseInt(movieMatch[1]);
        const movie = await this.movieService.findByCode(String(code));

        if (movie) {
          const botUsername = (await ctx.api.getMe()).username;
          const shareLink = `https://t.me/${botUsername}?start=${code}`;

          const field = await this.prisma.field.findUnique({
            where: { id: movie.fieldId },
            select: { channelLink: true, name: true },
          });
          const channelLink = field?.channelLink || '@Kanal';

          const messageText = `╭────────────────────
├‣  Kino nomi: ${movie.title}
├‣  Kino kodi: ${code}
├‣  Qism: ${movie.totalEpisodes || 1}
├‣  Janrlari: ${movie.genre || "Noma'lum"}
├‣  Kanal: ${channelLink}
╰────────────────────
▶️ Kinoni tomosha qilish uchun pastdagi havolaga bosing. ⬇️
${shareLink}`;

          results.push({
            type: 'article',
            id: `movie_${code}`,
            title: `🎬 ${movie.title}`,
            description: `Kod: ${code} | ${movie.genre || "Janr: noma'lum"}`,
            input_message_content: {
              message_text: messageText,
            },
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: '▶️ Tomosha qilish',
                    url: shareLink,
                  },
                ],
              ],
            },
          });
        }
      }

      if (serialMatch) {
        const code = parseInt(serialMatch[1]);
        const serial = await this.serialService.findByCode(String(code));

        if (serial) {
          const botUsername = (await ctx.api.getMe()).username;
          const shareLink = `https://t.me/${botUsername}?start=s${code}`;

          const episodes = await this.episodeService.findBySerialId(serial.id);

          const field = await this.prisma.field.findUnique({
            where: { id: serial.fieldId },
            select: { channelLink: true, name: true },
          });
          const channelLink = field?.channelLink || '@Kanal';

          const messageText = `╭────────────────────
├‣  Serial nomi: ${serial.title}
├‣  Serial kodi: ${code}
├‣  Qism: ${serial.totalEpisodes || episodes.length || 1}
├‣  Janrlari: ${serial.genre || "Noma'lum"}
├‣  Kanal: ${channelLink}
╰────────────────────
▶️ Serialni tomosha qilish uchun pastdagi havolaga bosing. ⬇️
${shareLink}`;

          results.push({
            type: 'article',
            id: `serial_${code}`,
            title: `📺 ${serial.title}`,
            description: `Kod: ${code} | ${serial.genre || "Janr: noma'lum"}`,
            input_message_content: {
              message_text: messageText,
            },
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: '▶️ Tomosha qilish',
                    url: shareLink,
                  },
                ],
              ],
            },
          });
        }
      }

      await ctx.answerInlineQuery(results, {
        cache_time: 300,
        is_personal: true,
      });
    } catch (error) {
      this.logger.error('Error handling inline query:', error);
      await ctx.answerInlineQuery([]);
    }
  }
}

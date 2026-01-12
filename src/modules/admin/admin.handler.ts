import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { BotContext } from '../../bot/bot.context';
import { InlineKeyboard, Keyboard } from 'grammy';
import { AdminService } from './services/admin.service';
import { UserService } from '../user/services/user.service';
import { MovieService } from '../content/services/movie.service';
import { SerialService } from '../content/services/serial.service';
import { SerialManagementService } from './services/serial-management.service';
import { FieldService } from '../field/services/field.service';
import { PaymentService } from '../payment/services/payment.service';
import { WatchHistoryService } from '../content/services/watch-history.service';
import { BroadcastService } from '../broadcast/services/broadcast.service';
import { ChannelService } from '../channel/services/channel.service';
import { SessionService } from './services/session.service';
import { PremiumService } from '../payment/services/premium.service';
import { SettingsService } from '../settings/services/settings.service';
import { GrammyBotService } from '../../common/grammy/grammy-bot.module';
import { PrismaService } from '../../prisma/prisma.service';
import { ChannelType } from '@prisma/client';
import {
  AdminState,
  MovieCreateStep,
  SerialCreateStep,
} from './types/session.interface';
import { AdminKeyboard } from './keyboards/admin-menu.keyboard';

@Injectable()
export class AdminHandler implements OnModuleInit {
  private readonly logger = new Logger(AdminHandler.name);
  private readonly isDevelopment = process.env.NODE_ENV !== 'production';

  constructor(
    private adminService: AdminService,
    private userService: UserService,
    private movieService: MovieService,
    private serialService: SerialService,
    private serialManagementService: SerialManagementService,
    private fieldService: FieldService,
    private paymentService: PaymentService,
    private watchHistoryService: WatchHistoryService,
    private broadcastService: BroadcastService,
    private channelService: ChannelService,
    private sessionService: SessionService,
    private premiumService: PremiumService,
    private settingsService: SettingsService,
    private grammyBot: GrammyBotService,
    private prisma: PrismaService,
  ) {}

  onModuleInit() {
    this.registerHandlers();
  }

  private registerHandlers() {
    const bot = this.grammyBot.bot;

  
    bot.command('admin', async (ctx) => {
      if (!ctx.from) return;

      const admin = await this.getAdmin(ctx);
      if (admin) {
        await this.handleAdminStart(ctx, admin);
      } else {
        await ctx.reply('❌ Siz admin emassiz!');
      }
    });

    bot.hears(
      '📊 Statistika',
      this.withAdminCheck(this.showStatistics.bind(this)),
    );
    bot.hears('🔙 Orqaga', this.withAdminCheck(this.handleBack.bind(this)));
    bot.hears(
      '❌ Bekor qilish',
      this.withAdminCheck(this.handleCancel.bind(this)),
    );
    bot.hears(
      '🎬 Kino yuklash',
      this.withAdminCheck(this.startMovieCreation.bind(this)),
    );
    bot.hears(
      '📺 Serial yuklash',
      this.withAdminCheck(this.startSerialCreation.bind(this)),
    );
    bot.hears(
      '🆕 Yangi serial yaratish',
      this.withAdminCheck(this.startNewSerialCreation.bind(this)),
    );
    bot.hears(
      "➕ Mavjud kino/serialga qism qo'shish",
      this.withAdminCheck(this.startAddingEpisode.bind(this)),
    );
    bot.hears(
      '📹 Kinoga video biriktirish',
      this.withAdminCheck(this.startVideoAttachment.bind(this)),
    );
    bot.hears(
      '📁 Fieldlar',
      this.withAdminCheck(this.openFieldsMenu.bind(this)),
    );
    bot.hears(
      "➕ Field qo'shish",
      this.withAdminCheck(this.startAddingField.bind(this)),
    );
    bot.hears(
      "📋 Fieldlar ro'yxati",
      this.withAdminCheck(this.showFieldsList.bind(this)),
    );
    bot.hears(
      '📢 Majburiy kanallar',
      this.withAdminCheck(this.showMandatoryChannels.bind(this)),
    );
    bot.hears(
      "➕ Majburiy kanal qo'shish",
      this.withAdminCheck(this.startAddMandatoryChannel.bind(this)),
    );
    bot.hears(
      "📊 Tarixni ko'rish",
      this.withAdminCheck(this.showChannelHistory.bind(this)),
    );
    bot.hears(
      "📋 Hammasini ko'rish",
      this.withAdminCheck(this.showAllChannelsHistory.bind(this)),
    );
    bot.hears(
      "🔍 Link bo'yicha qidirish",
      this.withAdminCheck(this.startSearchChannelByLink.bind(this)),
    );
    bot.hears(
      '💾 Database kanallar',
      this.withAdminCheck(this.showDatabaseChannels.bind(this)),
    );
    bot.hears(
      "➕ Database kanal qo'shish",
      this.withAdminCheck(this.startAddDatabaseChannel.bind(this)),
    );
    bot.hears(
      "💳 To'lovlar",
      this.withAdminCheck(this.showPaymentsMenu.bind(this)),
    );
    bot.hears(
      "📥 Yangi to'lovlar",
      this.withAdminCheck(this.showPendingPayments.bind(this)),
    );
    bot.hears(
      '✅ Tasdiqlangan',
      this.withAdminCheck(this.showApprovedPayments.bind(this)),
    );
    bot.hears(
      '❌ Rad etilgan',
      this.withAdminCheck(this.showRejectedPayments.bind(this)),
    );
    bot.hears(
      "📊 To'lov statistikasi",
      this.withAdminCheck(this.showPaymentStatistics.bind(this)),
    );
    bot.hears(
      '🚫 Premium banned users',
      this.withAdminCheck(this.showPremiumBannedUsersMenu.bind(this)),
    );
    bot.hears(
      '👥 Adminlar',
      this.withAdminCheck(this.showAdminsList.bind(this)),
    );
    bot.hears(
      '⚙️ Sozlamalar',
      this.withAdminCheck(this.showSettings.bind(this)),
    );
    bot.hears(
      '📣 Reklama yuborish',
      this.withAdminCheck(this.startBroadcast.bind(this)),
    );
    bot.hears(
      '🌐 Web Panel',
      this.withAdminCheck(this.showWebPanel.bind(this)),
    );
    bot.hears(
      '👥 Barcha foydalanuvchilar',
      this.withAdminCheck(this.showAllUsers.bind(this)),
    );
    bot.hears(
      '🚫 Foydalanuvchini bloklash',
      this.withAdminCheck(this.startBlockUser.bind(this)),
    );
    bot.hears(
      '✅ Blokdan ochish',
      this.withAdminCheck(this.startUnblockUser.bind(this)),
    );
    bot.hears(
      "👥 Hamma userlarni ko'rish",
      this.withAdminCheck(this.showAllPremiumBannedUsers.bind(this)),
    );
    bot.hears(
      '🔍 Qidirish',
      this.withAdminCheck(this.startSearchPremiumBannedUser.bind(this)),
    );
    bot.hears(
      "💳 To'lovlar menyusiga qaytish",
      this.withAdminCheck(this.showPaymentsMenu.bind(this)),
    );
    bot.hears(
      "🗑️ Kontent o'chirish",
      this.withAdminCheck(this.startDeleteContent.bind(this)),
    );
    bot.hears(
      '🗑️ Tarixni tozalash',
      this.withAdminCheck(this.clearChannelHistory.bind(this)),
    );

    // Callback query handlers - all with admin check
    bot.callbackQuery(/^field_detail_(\d+)$/, async (ctx) => {
      const admin = await this.getAdmin(ctx);
      if (admin) await this.showFieldDetail(ctx);
    });

    bot.callbackQuery('back_to_fields', async (ctx) => {
      const admin = await this.getAdmin(ctx);
      if (admin) await this.backToFieldsList(ctx);
    });

    bot.callbackQuery(/^delete_field_(\d+)$/, async (ctx) => {
      const admin = await this.getAdmin(ctx);
      if (admin) await this.deleteField(ctx);
    });

    bot.callbackQuery(/^delete_mandatory_(\d+)$/, async (ctx) => {
      const admin = await this.getAdmin(ctx);
      if (admin) await this.deleteMandatoryChannel(ctx);
    });

    bot.callbackQuery(/^delete_db_channel_(\d+)$/, async (ctx) => {
      const admin = await this.getAdmin(ctx);
      if (admin) await this.deleteDatabaseChannel(ctx);
    });

    bot.callbackQuery(/^goto_db_channel_(.+)$/, async (ctx) => {
      const admin = await this.getAdmin(ctx);
      if (admin) await this.gotoDbChannel(ctx);
    });

    bot.callbackQuery('show_delete_db_channels', async (ctx) => {
      const admin = await this.getAdmin(ctx);
      if (admin) await this.showDeleteDatabaseChannels(ctx);
    });

    bot.callbackQuery('back_to_db_channels', async (ctx) => {
      const admin = await this.getAdmin(ctx);
      if (admin) await this.showDatabaseChannels(ctx);
    });

    bot.callbackQuery(/^approve_payment_(\d+)$/, async (ctx) => {
      const admin = await this.getAdmin(ctx);
      if (admin) await this.approvePayment(ctx);
    });

    bot.callbackQuery(/^reject_payment_(\d+)$/, async (ctx) => {
      const admin = await this.getAdmin(ctx);
      if (admin) await this.rejectPayment(ctx);
    });

    bot.callbackQuery('cancel_premiere', async (ctx) => {
      const admin = await this.getAdmin(ctx);
      if (admin) {
        this.sessionService.clearSession(ctx.from.id);
        await ctx.editMessageReplyMarkup({
          reply_markup: { inline_keyboard: [] },
        });
        await ctx.answerCallbackQuery('❌ Bekor qilindi');
        await ctx.reply(
          "❌ Premyera e'loni bekor qilindi",
          AdminKeyboard.getAdminMainMenu(admin.role),
        );
      }
    });

    bot.callbackQuery('confirm_telegram_premium_broadcast', async (ctx) => {
      const admin = await this.getAdmin(ctx);
      if (admin) await this.confirmTelegramPremiumBroadcast(ctx);
    });

    bot.callbackQuery('cancel_telegram_premium_broadcast', async (ctx) => {
      const admin = await this.getAdmin(ctx);
      if (admin) {
        this.sessionService.clearSession(ctx.from.id);
        await ctx.editMessageReplyMarkup({
          reply_markup: { inline_keyboard: [] },
        });
        await ctx.answerCallbackQuery('❌ Bekor qilindi');
        await ctx.reply(
          '❌ Telegram Premium yuborish bekor qilindi',
          AdminKeyboard.getAdminMainMenu(admin.role),
        );
      }
    });

    bot.callbackQuery(/^confirm_block_user_(\d+)$/, async (ctx) => {
      const admin = await this.getAdmin(ctx);
      if (admin) await this.confirmBlockUser(ctx);
    });

    bot.callbackQuery('cancel_block_user', async (ctx) => {
      const admin = await this.getAdmin(ctx);
      if (admin) {
        this.sessionService.clearSession(ctx.from.id);
        await ctx.editMessageReplyMarkup({
          reply_markup: { inline_keyboard: [] },
        });
        await ctx.answerCallbackQuery('❌ Bekor qilindi');
        await ctx.reply(
          '❌ Bloklash bekor qilindi',
          AdminKeyboard.getAdminMainMenu(admin.role),
        );
      }
    });

    bot.callbackQuery(/^confirm_unblock_user_(\d+)$/, async (ctx) => {
      const admin = await this.getAdmin(ctx);
      if (admin) await this.confirmUnblockUser(ctx);
    });

    bot.callbackQuery('cancel_unblock_user', async (ctx) => {
      const admin = await this.getAdmin(ctx);
      if (admin) {
        this.sessionService.clearSession(ctx.from.id);
        await ctx.editMessageReplyMarkup({
          reply_markup: { inline_keyboard: [] },
        });
        await ctx.answerCallbackQuery('❌ Bekor qilindi');
        await ctx.reply(
          '❌ Blokdan ochish bekor qilindi',
          AdminKeyboard.getAdminMainMenu(admin.role),
        );
      }
    });

    bot.callbackQuery(/^confirm_unban_premium_(\d+)$/, async (ctx) => {
      const admin = await this.getAdmin(ctx);
      if (admin) await this.confirmUnbanPremiumUser(ctx);
    });

    bot.callbackQuery('cancel_unban_premium', async (ctx) => {
      const admin = await this.getAdmin(ctx);
      if (admin) await this.cancelUnbanPremium(ctx);
    });

    bot.callbackQuery(/^confirm_delete_movie_(\d+)$/, async (ctx) => {
      const admin = await this.getAdmin(ctx);
      if (admin) await this.confirmDeleteMovie(ctx);
    });

    bot.callbackQuery(/^confirm_delete_serial_(\d+)$/, async (ctx) => {
      const admin = await this.getAdmin(ctx);
      if (admin) await this.confirmDeleteSerial(ctx);
    });

    bot.callbackQuery('cancel_delete_content', async (ctx) => {
      const admin = await this.getAdmin(ctx);
      if (admin) await this.cancelDeleteContent(ctx);
    });

    bot.callbackQuery(/^send_to_field_(movie|serial)_(\d+)$/, async (ctx) => {
      const admin = await this.getAdmin(ctx);
      if (admin) await this.sendToFieldChannel(ctx);
    });

    bot.callbackQuery(
      /^broadcast_premiere_(movie|serial)_(\d+)$/,
      async (ctx) => {
        const admin = await this.getAdmin(ctx);
        if (admin) await this.broadcastPremiereToUsers(ctx);
      },
    );

    bot.callbackQuery('confirm_clear_history', async (ctx) => {
      const admin = await this.getAdmin(ctx);
      if (admin) await this.confirmClearHistory(ctx);
    });

    bot.callbackQuery('cancel_clear_history', async (ctx) => {
      const admin = await this.getAdmin(ctx);
      if (admin) {
        await ctx.answerCallbackQuery('❌ Bekor qilindi');
        await ctx.editMessageReplyMarkup({
          reply_markup: { inline_keyboard: [] },
        });
        await ctx.reply(
          '❌ Tarixni tozalash bekor qilindi.',
          AdminKeyboard.getAdminMainMenu(admin.role),
        );
      }
    });

    bot.callbackQuery('add_new_admin', async (ctx) => {
      const admin = await this.getAdmin(ctx);
      if (admin) await this.startAddingAdmin(ctx);
    });

    bot.callbackQuery(/^delete_admin_(.+)$/, async (ctx) => {
      const admin = await this.getAdmin(ctx);
      if (admin) await this.deleteAdmin(ctx);
    });

    bot.callbackQuery(
      /^select_admin_role_(ADMIN|MANAGER|SUPERADMIN)_(.+)$/,
      async (ctx) => {
        const admin = await this.getAdmin(ctx);
        if (admin) await this.handleRoleSelection(ctx);
      },
    );

    bot.callbackQuery('edit_prices', async (ctx) => {
      const admin = await this.getAdmin(ctx);
      if (admin) await this.startEditingPrices(ctx);
    });

    bot.callbackQuery('edit_card', async (ctx) => {
      const admin = await this.getAdmin(ctx);
      if (admin) await this.startEditingCard(ctx);
    });

    bot.callbackQuery('edit_contact', async (ctx) => {
      const admin = await this.getAdmin(ctx);
      if (admin) await this.startEditingContactMessage(ctx);
    });

    bot.callbackQuery('back_to_admin_menu', async (ctx) => {
      const admin = await this.getAdmin(ctx);
      if (admin) await this.backToAdminMenu(ctx);
    });

    // Broadcast handlers - MUST be before the general pattern
    bot.callbackQuery('broadcast_premiere', async (ctx) => {
      const admin = await this.getAdmin(ctx);
      if (admin) {
        await this.startPremiereBroadcast(ctx);
      }
    });

    bot.callbackQuery('broadcast_telegram_premium', async (ctx) => {
      const admin = await this.getAdmin(ctx);
      if (admin) {
        await this.startTelegramPremiumBroadcast(ctx);
      }
    });

    bot.callbackQuery(/^broadcast_(all|premium|free)$/, async (ctx) => {
      const admin = await this.getAdmin(ctx);
      if (admin) await this.handleBroadcastType(ctx);
    });

    // Media handlers - ONLY work if admin is in a session
    bot.on('message:photo', async (ctx, next) => {
      if (!ctx.from) {
        await next();
        return;
      }
      const admin = await this.getAdmin(ctx);
      const session = this.sessionService.getSession(ctx.from.id);

      if (admin && session) {
        await this.handlePhoto(ctx);
      } else {
        await next(); // Let user handler process it
      }
    });

    bot.on('message:video', async (ctx, next) => {
      if (!ctx.from) {
        await next();
        return;
      }
      const admin = await this.getAdmin(ctx);
      const session = this.sessionService.getSession(ctx.from.id);

      if (admin && session) {
        await this.handleVideoMessage(ctx);
      } else {
        await next(); // Let user handler process it
      }
    });

    // Text handler - ONLY work if admin is in a session
    bot.on('message:text', async (ctx, next) => {
      if (!ctx.from) {
        await next();
        return;
      }
      const admin = await this.getAdmin(ctx);
      const session = this.sessionService.getSession(ctx.from.id);

      // ONLY handle if admin has active session
      if (admin && session) {
        await this.handleSessionText(ctx);
      } else {
        // Let next handler (user handler) process it
        await next();
      }
    });
  }

  private async getAdmin(ctx: BotContext) {
    if (!ctx.from) return null;
    const admin = await this.adminService.getAdminByTelegramId(
      String(ctx.from.id),
    );
    return admin;
  }

  // Helper to wrap handlers with admin check
  private withAdminCheck(handler: (ctx: BotContext) => Promise<void>) {
    return async (ctx: BotContext) => {
      const admin = await this.getAdmin(ctx);
      if (admin) {
        await handler(ctx);
      }
    };
  }

  // ==================== START COMMAND ====================
  private async handleAdminStart(ctx: BotContext, admin: any) {
    // Clear any existing session
    this.sessionService.clearSession(ctx.from!.id);

    const welcomeMessage = `👋 Assalomu alaykum, ${admin.username || 'Admin'}!\n\n🔐 Siz admin panelidasiz.`;

    await ctx.reply(welcomeMessage, AdminKeyboard.getAdminMainMenu(admin.role));
  }

  // ==================== BASIC HANDLERS ====================
  private async handleBack(ctx: BotContext) {
    if (!ctx.from) return;
    const admin = await this.getAdmin(ctx);
    if (!admin) return;

    this.sessionService.clearSession(ctx.from.id);
    await ctx.reply(
      '🏠 Asosiy menyu',
      AdminKeyboard.getAdminMainMenu(admin.role),
    );
  }

  private async handleCancel(ctx: BotContext) {
    if (!ctx.from) return;
    const admin = await this.getAdmin(ctx);
    if (!admin) return;

    this.sessionService.clearSession(ctx.from.id);
    await ctx.reply(
      '❌ Bekor qilindi.',
      AdminKeyboard.getAdminMainMenu(admin.role),
    );
  }

  // ==================== STATISTICS ====================
  private async showStatistics(ctx: BotContext) {
    const admin = await this.getAdmin(ctx);
    if (!admin) return;

    try {
      const [userStats, paymentStats, activeUsers, newUsers] =
        await Promise.all([
          this.userService.getUserStatistics(),
          this.paymentService.getStatistics(),
          this.watchHistoryService.getActiveUsers(30),
          this.watchHistoryService.getNewUsers(30),
        ]);

      const message = `
📊 **BOT STATISTIKASI**

👥 **Foydalanuvchilar:**
├ Jami: ${userStats.totalUsers}
├ Premium: ${userStats.premiumUsers}
├ Bloklangan: ${userStats.blockedUsers}
└ Faol (30 kun): ${activeUsers}

💰 **To'lovlar:**
├ Jami: ${paymentStats.totalPayments}
├ Tasdiqlangan: ${paymentStats.approvedCount}
├ Rad etilgan: ${paymentStats.rejectedCount}
└ Kutilmoqda: ${paymentStats.pendingCount}

📈 **Yangi foydalanuvchilar (30 kun):** ${newUsers}
      `;

      // Create keyboard with additional options
      const keyboard = new Keyboard()
        .text('👥 Barcha foydalanuvchilar')
        .row()
        .text('🚫 Foydalanuvchini bloklash')
        .text('✅ Blokdan ochish')
        .row()
        .text('🔙 Orqaga')
        .resized();

      await ctx.reply(message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard,
      });
    } catch (error) {
      this.logger.error('Error showing statistics:', error);
      await ctx.reply('❌ Statistikani olishda xatolik yuz berdi.');
    }
  }

  // ==================== MOVIE CREATION ====================
  private async startMovieCreation(ctx: BotContext) {
    const admin = await this.getAdmin(ctx);
    if (!admin || !ctx.from) {
      await ctx.reply("❌ Sizda admin huquqi yo'q.");
      return;
    }

    this.sessionService.createSession(ctx.from.id, AdminState.CREATING_MOVIE);

    await ctx.reply(
      '🎬 Kino yuklash boshlandi!\n\n' +
        '1️⃣ Kino kodini kiriting:\n' +
        "⚠️ Kod FAQAT raqamlardan iborat bo'lishi kerak!\n" +
        'Masalan: 12345',
      AdminKeyboard.getCancelButton(),
    );
  }

  // ==================== PHOTO HANDLER ====================
  private async handlePhoto(ctx: BotContext) {
    if (!ctx.from || !ctx.message || !('photo' in ctx.message)) return;

    const session = this.sessionService.getSession(ctx.from.id);
    if (!session) return;

    const admin = await this.getAdmin(ctx);
    if (!admin) return;

    const photo = ctx.message.photo[ctx.message.photo.length - 1];

    // Handle Movie Photo
    if (
      session.state === AdminState.CREATING_MOVIE &&
      session.step === MovieCreateStep.PHOTO
    ) {
      this.sessionService.updateSessionData(ctx.from.id, {
        posterFileId: photo.file_id,
        posterType: 'photo',
      });
      this.sessionService.setStep(ctx.from.id, MovieCreateStep.VIDEO);

      await ctx.reply(
        '🎬 Endi kino videosini yuboring:',
        AdminKeyboard.getCancelButton(),
      );
      return;
    }

    // Handle Serial Photo
    if (
      session.state === AdminState.CREATING_SERIAL &&
      session.step === SerialCreateStep.PHOTO
    ) {
      // Instead of creating serial immediately, save poster and ask for episodes
      await this.serialManagementService.handleSerialPoster(
        ctx,
        photo.file_id,
        'photo',
      );
      return;
    }
  }

  // ==================== VIDEO HANDLER ====================
  private async handleVideoMessage(ctx: BotContext) {
    if (!ctx.from || !ctx.message || !('video' in ctx.message)) return;

    const session = this.sessionService.getSession(ctx.from.id);
    if (!session) return;

    // Check if uploading poster as video for movie
    if (
      session.state === AdminState.CREATING_MOVIE &&
      session.step === MovieCreateStep.PHOTO
    ) {
      const video = ctx.message.video;
      this.sessionService.updateSessionData(ctx.from.id, {
        posterFileId: video.file_id,
        posterType: 'video',
      });
      this.sessionService.setStep(ctx.from.id, MovieCreateStep.VIDEO);

      await ctx.reply(
        '🎬 Endi kino videosini yuboring:',
        AdminKeyboard.getCancelButton(),
      );
      return;
    }

    // Check if uploading poster as video for serial
    if (
      session.state === AdminState.CREATING_SERIAL &&
      session.step === SerialCreateStep.PHOTO
    ) {
      const video = ctx.message.video;
      await this.serialManagementService.handleSerialPoster(
        ctx,
        video.file_id,
        'video',
      );
      return;
    }

    // Check if creating movie
    if (
      session.state === AdminState.CREATING_MOVIE &&
      session.step === MovieCreateStep.VIDEO
    ) {
      await this.handleMovieVideo(ctx);
      return;
    }

    // Check if creating serial and uploading episodes
    if (session.state === AdminState.CREATING_SERIAL && session.step === 6) {
      // step 6 = UPLOADING_EPISODES (new serial)
      await this.serialManagementService.handleNewSerialEpisodeVideo(
        ctx,
        ctx.message.video.file_id,
        session,
      );
      return;
    }

    // Check if adding episodes to existing serial
    if (session.state === AdminState.CREATING_SERIAL && session.step === 7) {
      // step 7 = ADDING_EPISODES (existing serial or movie)
      await this.serialManagementService.handleExistingContentEpisodeVideo(
        ctx,
        ctx.message.video.file_id,
        session,
      );
      return;
    }
  }

  private async handleMovieVideo(ctx: BotContext) {
    if (!ctx.from || !ctx.message || !('video' in ctx.message)) return;

    const session = this.sessionService.getSession(ctx.from.id);
    if (
      !session ||
      session.state !== AdminState.CREATING_MOVIE ||
      session.step !== MovieCreateStep.VIDEO
    ) {
      return;
    }

    const admin = await this.getAdmin(ctx);
    if (!admin) return;

    const video = ctx.message.video;
    const data = session.data;

    try {
      // Get all database channels
      const dbChannels = await this.channelService.findAllDatabase();
      if (dbChannels.length === 0) {
        await ctx.reply(
          '❌ Hech qanday database kanal topilmadi. Avval database kanal yarating.',
        );
        this.sessionService.clearSession(ctx.from.id);
        return;
      }

      await ctx.reply('⏳ Kino yuklanmoqda, iltimos kuting...');

      // Send video to all database channels and collect message IDs
      const videoMessages: { channelId: string; messageId: number }[] = [];

      for (const dbChannel of dbChannels) {
        try {
          // Get field info for database channel caption
          const field = data.selectedField;
          const botInfo = await ctx.api.getMe();
          const botUsername = botInfo.username || 'bot';
          const dbCaption = `
╭────────────────────
├‣  Kino nomi : ${data.title}
├‣  Kino kodi: ${data.code}
├‣  Qism: ${data.episodeCount || 1}
├‣  Janrlari: ${data.genre}
├‣  Kanal: ${field.channelLink || `https://t.me/${field.channelId?.replace('@', '').replace('-100', '')}`}
╰────────────────────
▶️ Kinoning to'liq qismini @${botUsername} dan tomosha qilishingiz mumkin!
          `.trim();

          const sentVideo = await ctx.api.sendVideo(
            dbChannel.channelId,
            video.file_id,
            {
              caption: dbCaption,
            },
          );
          videoMessages.push({
            channelId: dbChannel.channelId,
            messageId: sentVideo.message_id,
          });
        } catch (error) {
          this.logger.error(
            `Error sending to database channel ${dbChannel.channelName}:`,
            error,
          );
        }
      }

      if (videoMessages.length === 0) {
        await ctx.reply(
          "❌ Videoni hech qanday kanalga yuklash imkoni bo'lmadi. Botni kanallarga admin qiling.",
        );
        return;
      }

      // Get field info first
      const field = data.selectedField;
      const botInfo = await ctx.api.getMe();
      const botUsername = botInfo.username || 'bot';

      // Create movie caption with button for field channel (DMC style)
      const caption = `
╭────────────────────
├‣  Kino nomi : ${data.title}
├‣  Kino kodi: ${data.code}
├‣  Qism: ${data.episodeCount || 1}
├‣  Janrlari: ${data.genre}
├‣  Kanal: ${field.channelLink || `https://t.me/${field.channelId?.replace('@', '').replace('-100', '')}`}
╰────────────────────
▶️ Kinoning to'liq qismini @${botUsername} dan tomosha qilishingiz mumkin!
      `.trim();

      const keyboard = new InlineKeyboard().url(
        '✨ Tomosha Qilish',
        `https://t.me/${this.grammyBot.botUsername}?start=${data.code}`,
      );

      // Send poster with info to field channel (photo or video)
      let sentPoster;
      if (data.posterType === 'video') {
        sentPoster = await ctx.api.sendVideo(
          field.channelId,
          data.posterFileId,
          {
            caption,
            reply_markup: keyboard,
          },
        );
      } else {
        sentPoster = await ctx.api.sendPhoto(
          field.channelId,
          data.posterFileId,
          {
            caption,
            reply_markup: keyboard,
          },
        );
      }

      // Save movie to database
      await this.movieService.create({
        code: data.code,
        title: data.title,
        genre: data.genre,
        description: data.description,
        fieldId: field.id,
        posterFileId: data.posterFileId,
        videoFileId: video.file_id,
        channelMessageId: sentPoster.message_id,
        videoMessageId: JSON.stringify(videoMessages),
      });

      this.sessionService.clearSession(ctx.from.id);

      let successMessage = `✅ Kino muvaffaqiyatli yuklandi!\n\n`;
      successMessage += `📦 Field kanal: ${field.name}\n`;
      successMessage += `🔗 Poster Message ID: ${sentPoster.message_id}\n\n`;
      successMessage += `📹 Video yuklangan kanallar:\n`;
      videoMessages.forEach((vm, i) => {
        const channel = dbChannels.find((ch) => ch.channelId === vm.channelId);
        successMessage += `${i + 1}. ${channel?.channelName || vm.channelId} - Message ID: ${vm.messageId}\n`;
      });

      await ctx.reply(
        successMessage,
        AdminKeyboard.getAdminMainMenu(admin.role),
      );
    } catch (error) {
      this.logger.error('Error uploading movie:', error);
      await ctx.reply(
        `❌ Xatolik yuz berdi. Botni barcha kanallarga admin qiling va qaytadan urinib ko'ring.\n\nXatolik: ${error.message}`,
      );
    }
  }

  // ==================== TEXT HANDLER (Session-based) ====================
  private async handleSessionText(ctx: BotContext) {
    if (!ctx.from || !ctx.message || !('text' in ctx.message)) return;

    const text = ctx.message.text;
    const session = this.sessionService.getSession(ctx.from.id);

    // Skip if no session or it's a command/button
    if (!session || text.startsWith('/') || text.includes('�')) return;

    const admin = await this.getAdmin(ctx);
    if (!admin) return;

    // Handle cancel button
    if (text === '❌ Bekor qilish') {
      this.sessionService.clearSession(ctx.from.id);
      await ctx.reply(
        '❌ Bekor qilindi.',
        AdminKeyboard.getAdminMainMenu(admin.role),
      );
      return;
    }

    // Route to appropriate handler based on state
    switch (session.state) {
      case AdminState.CREATING_MOVIE:
        await this.handleMovieCreationSteps(ctx, text, session);
        break;
      case AdminState.CREATING_SERIAL:
        await this.handleSerialCreationSteps(ctx, text, session);
        break;
      case AdminState.ATTACHING_VIDEO:
        await this.handleVideoAttachmentSteps(ctx, text, session);
        break;
      case AdminState.ADDING_FIELD:
        await this.handleFieldCreationSteps(ctx, text, session);
        break;
      case AdminState.ADD_DATABASE_CHANNEL:
        await this.handleDatabaseChannelCreationSteps(ctx, text, session);
        break;
      case AdminState.ADD_MANDATORY_CHANNEL:
        await this.handleMandatoryChannelCreationSteps(ctx, text, session);
        break;
      case AdminState.ADD_ADMIN:
        await this.handleAdminCreationSteps(ctx, text, session);
        break;
      case AdminState.EDIT_PREMIUM_PRICES:
        await this.handlePriceEditingSteps(ctx, text, session);
        break;
      case AdminState.EDIT_CARD_INFO:
        await this.handleCardEditingSteps(ctx, text, session);
        break;
      case AdminState.EDIT_CONTACT_MESSAGE:
        await this.handleContactMessageEditing(ctx, text, session);
        break;
      case AdminState.BROADCASTING:
        await this.handleBroadcastMessage(ctx, text, session);
        break;
      case AdminState.SEARCH_CHANNEL_BY_LINK:
        await this.searchChannelByLink(ctx, text);
        break;
      case AdminState.APPROVE_PAYMENT:
        await this.handleApprovePaymentSteps(ctx, text, session);
        break;
      case AdminState.REJECT_PAYMENT:
        await this.handleRejectPaymentSteps(ctx, text, session);
        break;
      case AdminState.BROADCAST_PREMIERE:
        await this.handlePremiereBroadcastSteps(ctx, text, session);
        break;
      case AdminState.BROADCAST_TELEGRAM_PREMIUM:
        await this.handleTelegramPremiumBroadcastSteps(ctx, text, session);
        break;
      case AdminState.BLOCK_USER:
        await this.handleBlockUserSteps(ctx, text, session);
        break;
      case AdminState.UNBLOCK_USER:
        await this.handleUnblockUserSteps(ctx, text, session);
        break;
      case AdminState.UNBAN_PREMIUM_USER:
        await this.handleUnbanPremiumUserSteps(ctx, text, session);
        break;
      case AdminState.DELETE_CONTENT:
        await this.handleDeleteContentSteps(ctx);
        break;
      default:
        break;
    }
  }

  private async handleMovieCreationSteps(
    ctx: BotContext,
    text: string,
    session: any,
  ) {
    const data = session.data || {};

    switch (session.step) {
      case MovieCreateStep.CODE:
        const code = parseInt(text);
        if (isNaN(code) || code <= 0) {
          await ctx.reply(
            "❌ Kod faqat raqamlardan iborat bo'lishi kerak!\nMasalan: 12345\n\nIltimos, qaytadan kiriting:",
            AdminKeyboard.getCancelButton(),
          );
          return;
        }

        // Check if code is available
        const isAvailable = await this.movieService.isCodeAvailable(code);
        if (!isAvailable) {
          const nearestCodes =
            await this.movieService.findNearestAvailableCodes(code, 5);
          let message = `❌ Kechirasiz, ${code} kodi band!\n\n`;
          if (nearestCodes.length > 0) {
            message += "✅ Eng yaqin bo'sh kodlar:\n";
            nearestCodes.forEach((c, i) => {
              message += `${i + 1}. ${c}\n`;
            });
            message +=
              '\nYuqoridagi kodlardan birini tanlang yoki boshqa kod kiriting:';
          } else {
            message += 'Boshqa kod kiriting:';
          }
          await ctx.reply(message, AdminKeyboard.getCancelButton());
          return;
        }

        this.sessionService.updateSessionData(ctx.from!.id, { code });
        this.sessionService.setStep(ctx.from!.id, MovieCreateStep.TITLE);
        await ctx.reply(
          'Kino nomini kiriting:\nMasalan: Avatar 2',
          AdminKeyboard.getCancelButton(),
        );
        break;

      case MovieCreateStep.TITLE:
        this.sessionService.updateSessionData(ctx.from!.id, { title: text });
        this.sessionService.setStep(ctx.from!.id, MovieCreateStep.GENRE);
        await ctx.reply(
          '🎭 Janr kiriting:\nMasalan: Action, Drama',
          AdminKeyboard.getCancelButton(),
        );
        break;

      case MovieCreateStep.GENRE:
        this.sessionService.updateSessionData(ctx.from!.id, { genre: text });
        this.sessionService.setStep(ctx.from!.id, MovieCreateStep.DESCRIPTION);

        const keyboard = new Keyboard()
          .text('Next')
          .row()
          .text('❌ Bekor qilish');
        await ctx.reply(
          "📝 Tavsif kiriting:\n\n⏭ O'tkazib yuborish uchun 'Next' yozing",
          { reply_markup: keyboard.resized() },
        );
        break;

      case MovieCreateStep.DESCRIPTION:
        if (text.toLowerCase() === 'next') {
          this.sessionService.updateSessionData(ctx.from!.id, {
            description: null,
          });
        } else {
          this.sessionService.updateSessionData(ctx.from!.id, {
            description: text,
          });
        }
        this.sessionService.setStep(ctx.from!.id, MovieCreateStep.FIELD);

        // Show fields list
        const allFields = await this.fieldService.findAll();
        if (allFields.length === 0) {
          await ctx.reply(
            '❌ Hech qanday field topilmadi. Avval field yarating.',
          );
          this.sessionService.clearSession(ctx.from!.id);
          return;
        }

        let message = '📁 Qaysi fieldni tanlaysiz?\n\n';
        allFields.forEach((field, index) => {
          message += `${index + 1}. ${field.name}\n`;
        });
        message += '\nRaqamini kiriting (masalan: 1)';

        this.sessionService.updateSessionData(ctx.from!.id, {
          fields: allFields,
        });
        await ctx.reply(message, AdminKeyboard.getCancelButton());
        break;

      case MovieCreateStep.FIELD:
        const fieldIndex = parseInt(text) - 1;
        const userFields = session.data.fields;

        if (
          isNaN(fieldIndex) ||
          fieldIndex < 0 ||
          fieldIndex >= userFields.length
        ) {
          await ctx.reply("❌ Noto'g'ri raqam. Iltimos qaytadan kiriting:");
          return;
        }

        this.sessionService.updateSessionData(ctx.from!.id, {
          selectedField: userFields[fieldIndex],
        });
        this.sessionService.setStep(ctx.from!.id, MovieCreateStep.PHOTO);
        await ctx.reply(
          '📸 Endi kino rasmi yoki vediosini yuboring:',
          AdminKeyboard.getCancelButton(),
        );
        break;
    }
  }

  // ==================== SERIAL MANAGEMENT ====================
  private async startSerialCreation(ctx: BotContext) {
    const admin = await this.getAdmin(ctx);
    if (!admin || !ctx.from) {
      await ctx.reply("❌ Sizda admin huquqi yo'q.");
      return;
    }

    const keyboard = new Keyboard()
      .text('🆕 Yangi serial yaratish')
      .row()
      .text("➕ Mavjud kino/serialga qism qo'shish")
      .row()
      .text('❌ Bekor qilish')
      .resized();

    await ctx.reply(
      '📺 Serial boshqaruvi\n\nQaysi amalni bajarmoqchisiz?\n\n' +
        '• Yangi serial yaratish\n' +
        "• Kino yoki serialga yangi qism qo'shish",
      {
        reply_markup: keyboard,
      },
    );
  }

  private async startNewSerialCreation(ctx: BotContext) {
    const admin = await this.getAdmin(ctx);
    if (!admin || !ctx.from) {
      await ctx.reply("❌ Sizda admin huquqi yo'q.");
      return;
    }

    this.sessionService.createSession(ctx.from.id, AdminState.CREATING_SERIAL);
    this.sessionService.updateSessionData(ctx.from.id, { isNewSerial: true });

    await ctx.reply(
      '📺 Yangi serial yaratish boshlandi!\n\n' +
        '1️⃣ Serial kodini kiriting:\n' +
        "⚠️ Kod FAQAT raqamlardan iborat bo'lishi kerak!\n" +
        'Masalan: 12345',
      AdminKeyboard.getCancelButton(),
    );
  }

  private async startAddingEpisode(ctx: BotContext) {
    const admin = await this.getAdmin(ctx);
    if (!admin || !ctx.from) {
      await ctx.reply("❌ Sizda admin huquqi yo'q.");
      return;
    }

    this.sessionService.createSession(ctx.from.id, AdminState.CREATING_SERIAL);
    this.sessionService.updateSessionData(ctx.from.id, {
      isAddingEpisode: true,
    });

    await ctx.reply(
      "� Kino yoki Serialga qism qo'shish\n\n" +
        '🔢 Kino yoki serial kodini kiriting:\n' +
        "⚠️ Kod raqamlardan iborat bo'lishi kerak",
      AdminKeyboard.getCancelButton(),
    );
  }

  private async startVideoAttachment(ctx: BotContext) {
    const admin = await this.getAdmin(ctx);
    if (!admin || !ctx.from) {
      await ctx.reply("❌ Sizda admin huquqi yo'q.");
      return;
    }

    this.sessionService.createSession(ctx.from.id, AdminState.ATTACHING_VIDEO);
    await ctx.reply(
      '📹 Kinoga video biriktirish boshlandi!\n\n' + '🔢 Kino kodini kiriting:',
      AdminKeyboard.getCancelButton(),
    );
  }

  // ==================== FIELD MANAGEMENT ====================
  private async openFieldsMenu(ctx: BotContext) {
    const admin = await this.getAdmin(ctx);
    if (!admin) {
      await ctx.reply("❌ Sizda admin huquqi yo'q.");
      return;
    }

    await ctx.reply(
      '📁 Fieldlar bolimi',
      AdminKeyboard.getFieldManagementMenu(),
    );
  }

  private async startAddingField(ctx: BotContext) {
    const admin = await this.getAdmin(ctx);
    if (!admin || !ctx.from) return;

    this.sessionService.createSession(ctx.from.id, AdminState.ADDING_FIELD);
    await ctx.reply(
      '📝 Field nomini kiriting:\nMasalan: Yangi kinolar',
      AdminKeyboard.getCancelButton(),
    );
  }

  private async showFieldsList(ctx: BotContext) {
    const admin = await this.getAdmin(ctx);
    if (!admin) return;

    const fields = await this.fieldService.findAll();
    if (fields.length === 0) {
      await ctx.reply('📂 Hech qanday field topilmadi.');
      return;
    }

    let message = '📋 Mavjud fieldlar:\n\n';
    fields.forEach((field, index) => {
      message += `${index + 1}. ${field.name}\n`;
    });
    message += "\n👇 Batafsil ma'lumot olish uchun raqamni bosing:";

    const keyboard = new InlineKeyboard();
    fields.forEach((field, index) => {
      keyboard.text(String(index + 1), `field_detail_${field.id}`);
      if ((index + 1) % 5 === 0) keyboard.row();
    });

    await ctx.reply(message, { reply_markup: keyboard });
  }

  private async showFieldDetail(ctx: BotContext) {
    const fieldId = parseInt(ctx.match![1] as string);
    const field = await this.fieldService.findOne(fieldId);

    if (!field) {
      await ctx.answerCallbackQuery({ text: '❌ Field topilmadi' });
      return;
    }

    const message = `
📁 **Field Ma'lumotlari**
🏷 Nomi: ${field.name}
🆔 ID: ${field.id}
📢 Kanal ID: ${field.channelId}
🔗 Kanal linki: ${field.channelLink || "Yo'q"}
📅 Yaratilgan: ${field.createdAt.toLocaleDateString('uz-UZ')}
✅ Faol: ${field.isActive ? 'Ha' : "Yo'q"}
    `.trim();

    const keyboard = new InlineKeyboard()
      .text("🗑 O'chirish", `delete_field_${field.id}`)
      .row()
      .text('🔙 Orqaga', 'back_to_fields');

    await ctx.editMessageText(message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard,
    });
    await ctx.answerCallbackQuery();
  }

  private async backToFieldsList(ctx: BotContext) {
    await this.showFieldsList(ctx);
  }

  private async deleteField(ctx: BotContext) {
    const admin = await this.getAdmin(ctx);
    if (!admin) return;

    const fieldId = parseInt(ctx.match![1] as string);
    await this.fieldService.delete(fieldId);

    await ctx.answerCallbackQuery({ text: '✅ Field ochirildi' });
    await ctx.editMessageText('✅ Field muvaffaqiyatli ochirildi');
  }

  // ==================== CHANNEL MANAGEMENT ====================
  private async showMandatoryChannels(ctx: BotContext) {
    const admin = await this.getAdmin(ctx);
    if (!admin) return;

    const channels = await this.channelService.findAllMandatory();
    if (channels.length === 0) {
      const keyboard = new Keyboard()
        .text("➕ Majburiy kanal qo'shish")
        .row()
        .text('🔙 Orqaga')
        .resized();

      await ctx.reply("📢 Hech qanday majburiy kanal yo'q.", {
        reply_markup: keyboard,
      });
      return;
    }

    let message = '📢 Majburiy kanallar:\n\n';
    channels.forEach((ch, i) => {
      message += `${i + 1}. ${ch.channelName}\n`;
      message += `   Link: ${ch.channelLink}\n`;
      message += `   👥 A'zolar: ${ch.currentMembers}`;
      if (ch.memberLimit) {
        message += ` / ${ch.memberLimit}`;
      } else {
        message += ' (Limitsiz)';
      }
      if (ch.type === 'PRIVATE' && ch.pendingRequests > 0) {
        message += `\n   ⏳ Kutilayotgan: ${ch.pendingRequests}`;
      }
      message += '\n\n';
    });

    const inlineKeyboard = new InlineKeyboard();
    channels.forEach((ch) => {
      inlineKeyboard
        .text(`🗑 ${ch.channelName}`, `delete_mandatory_${ch.id}`)
        .row();
    });

    await ctx.reply(message, { reply_markup: inlineKeyboard });

    const keyboard = new Keyboard()
      .text("➕ Majburiy kanal qo'shish")
      .text("📊 Tarixni ko'rish")
      .row()
      .text('🔙 Orqaga')
      .resized();

    await ctx.reply("Yangi kanal qo'shish:", { reply_markup: keyboard });
  }

  private async startAddMandatoryChannel(ctx: BotContext) {
    const admin = await this.getAdmin(ctx);
    if (!admin || !ctx.from) return;

    await this.sessionService.startSession(
      Number(admin.telegramId),
      AdminState.ADD_MANDATORY_CHANNEL,
    );

    const keyboard = new Keyboard()
      .text('🌐 Public kanal')
      .text('🔒 Private kanal')
      .row()
      .text('🔗 Boshqa link')
      .row()
      .text('❌ Bekor qilish')
      .resized();

    await ctx.reply(
      '📝 Kanal turini tanlang:\n\n' +
        '🌐 Public kanal - Ochiq kanal (ID/username + link)\n' +
        '🔒 Private kanal - Yopiq kanal (ID + link)\n' +
        '🔗 Boshqa link - Instagram, YouTube va boshqalar\n\n' +
        "❌ Bekor qilish uchun 'Bekor qilish' tugmasini bosing",
      { reply_markup: keyboard },
    );
  }

  private async deleteMandatoryChannel(ctx: BotContext) {
    const admin = await this.getAdmin(ctx);
    if (!admin) return;

    const channelId = parseInt(ctx.match![1] as string);
    await this.channelService.delete(channelId);

    await ctx.answerCallbackQuery({ text: '✅ Majburiy kanal ochirildi' });
    await this.showMandatoryChannels(ctx);
  }

  private async showChannelHistory(ctx: BotContext) {
    const admin = await this.getAdmin(ctx);
    if (!admin) return;

    const keyboard = new Keyboard()
      .text("📋 Hammasini ko'rish")
      .text("🔍 Link bo'yicha qidirish")
      .row()
      .text('🔙 Orqaga')
      .resized();

    await ctx.reply('📊 Majburiy kanallar tarixi:\n\n' + 'Tanlang:', {
      reply_markup: keyboard,
    });
  }

  private async showAllChannelsHistory(ctx: BotContext) {
    const admin = await this.getAdmin(ctx);
    if (!admin) return;

    const channels = await this.channelService.findAllWithHistory();

    if (channels.length === 0) {
      await ctx.reply(
        '📊 Hech qanday kanal topilmadi.',
        AdminKeyboard.getAdminMainMenu(admin.role),
      );
      return;
    }

    let message = '📊 <b>Majburiy kanallar tarixi:</b>\n\n';

    const activeChannels = channels.filter((ch) => ch.isActive);
    const inactiveChannels = channels.filter((ch) => !ch.isActive);

    if (activeChannels.length > 0) {
      message += '✅ <b>Faol kanallar:</b>\n\n';
      activeChannels.forEach((ch, index) => {
        message += `${index + 1}. <b>${ch.channelName}</b>\n`;
        message += `   🔗 ${ch.channelLink}\n`;
        message += `   📁 Turi: ${ch.type === 'PUBLIC' ? 'Public' : ch.type === 'PRIVATE' ? 'Private' : 'Boshqa'}\n`;
        message += `   👥 A'zolar: ${ch.currentMembers}`;

        if (ch.memberLimit) {
          message += ` / ${ch.memberLimit}`;
          const percentage = (
            (ch.currentMembers / ch.memberLimit) *
            100
          ).toFixed(1);
          message += ` (${percentage}%)`;
        } else {
          message += ' (Cheksiz)';
        }

        message += '\n';

        if (ch.type === 'PRIVATE' && ch.pendingRequests > 0) {
          message += `   ⏳ Kutilayotgan so'rovlar: ${ch.pendingRequests}\n`;
        }

        message += `   📅 Qo'shilgan: ${new Date(ch.createdAt).toLocaleDateString('uz-UZ')}\n\n`;
      });
    }

    if (inactiveChannels.length > 0) {
      message +=
        "\n❌ <b>Nofaol kanallar (limit to'lgan yoki o'chirilgan):</b>\n\n";
      inactiveChannels.forEach((ch, index) => {
        message += `${index + 1}. <b>${ch.channelName}</b>\n`;
        message += `   🔗 ${ch.channelLink}\n`;
        message += `   📁 Turi: ${ch.type === 'PUBLIC' ? 'Public' : ch.type === 'PRIVATE' ? 'Private' : 'Boshqa'}\n`;
        message += `   👥 Jami qo'shilganlar: ${ch.currentMembers}`;

        if (ch.memberLimit) {
          message += ` / ${ch.memberLimit}`;
        }

        message += '\n';
        message += `   📅 Qo'shilgan: ${new Date(ch.createdAt).toLocaleDateString('uz-UZ')}\n\n`;
      });
    }

    const keyboard = new Keyboard()
      .text("🔍 Link bo'yicha qidirish")
      .row()
      .text('🗑️ Tarixni tozalash')
      .row()
      .text('🔙 Orqaga')
      .resized();

    await ctx.reply(message, {
      parse_mode: 'HTML',
      reply_markup: keyboard,
    });
  }

  private async startSearchChannelByLink(ctx: BotContext) {
    const admin = await this.getAdmin(ctx);
    if (!admin || !ctx.from) return;

    await this.sessionService.startSession(
      Number(admin.telegramId),
      AdminState.SEARCH_CHANNEL_BY_LINK,
    );

    const keyboard = new Keyboard().text('❌ Bekor qilish').resized();

    await ctx.reply(
      '🔍 Kanal linkini yuboring:\n\n' +
        'Misol: https://t.me/mychannel\n\n' +
        "❌ Bekor qilish uchun 'Bekor qilish' tugmasini bosing",
      { reply_markup: keyboard },
    );
  }

  private async searchChannelByLink(ctx: BotContext, link: string) {
    const admin = await this.getAdmin(ctx);
    if (!admin) return;

    const channel = await this.channelService.findByLink(link);

    if (!channel) {
      await ctx.reply(
        "❌ Bunday link bilan kanal topilmadi.\n\nIltimos, to'g'ri link yuboring.",
        AdminKeyboard.getCancelButton(),
      );
      return;
    }

    this.sessionService.clearSession(ctx.from!.id);

    let message = `📊 <b>Kanal ma'lumotlari:</b>\n\n`;
    message += `📢 <b>${channel.channelName}</b>\n`;
    message += `🔗 ${channel.channelLink}\n`;
    message += `📁 Turi: ${channel.type === 'PUBLIC' ? 'Public' : channel.type === 'PRIVATE' ? 'Private' : 'Boshqa'}\n`;

    // Check if channel is truly active
    let isReallyActive = channel.isActive;
    let inactiveReason = '';

    if (channel.memberLimit && channel.currentMembers >= channel.memberLimit) {
      isReallyActive = false;
      inactiveReason = " (Limit to'lgan)";
    }

    message += `📊 Holat: ${isReallyActive ? '✅ Faol' : '❌ Nofaol'}${inactiveReason}\n`;
    message += `👥 A'zolar: ${channel.currentMembers}`;

    if (channel.memberLimit) {
      message += ` / ${channel.memberLimit}`;
      const percentage = (
        (channel.currentMembers / channel.memberLimit) *
        100
      ).toFixed(1);
      message += ` (${percentage}%)`;
    } else {
      message += ' (Cheksiz)';
    }

    message += '\n';

    if (channel.type === 'PRIVATE' && channel.pendingRequests > 0) {
      message += `⏳ Kutilayotgan so'rovlar: ${channel.pendingRequests}\n`;
    }

    message += `📅 Qo'shilgan: ${new Date(channel.createdAt).toLocaleDateString('uz-UZ')}\n`;

    // Add note if database says it's inactive but no obvious reason
    if (!channel.isActive && !inactiveReason) {
      message += `\n⚠️ Qayd: Kanal database'da nofaol deb belgilangan.`;
    }

    await ctx.reply(message, {
      parse_mode: 'HTML',
    });

    await ctx.reply('Tanlang:', AdminKeyboard.getAdminMainMenu(admin.role));
  }

  private async showDatabaseChannels(ctx: BotContext) {
    const admin = await this.getAdmin(ctx);
    if (!admin) return;

    const channels = await this.channelService.findAllDatabase();
    if (channels.length === 0) {
      const keyboard = new Keyboard()
        .text("➕ Database kanal qo'shish")
        .row()
        .text('🔙 Orqaga')
        .resized();

      await ctx.reply("💾 Hech qanday database kanal yo'q.", {
        reply_markup: keyboard,
      });
      return;
    }

    let message = '💾 **Database kanallar:**\n\n';
    channels.forEach((ch, i) => {
      message += `${i + 1}. ${ch.channelName}\n`;
    });

    message += "\n📌 Kanalga o'tish uchun quyidagi raqamlardan birini tanlang:";

    const inlineKeyboard = new InlineKeyboard();
    channels.forEach((ch, i) => {
      inlineKeyboard.text(`${i + 1}`, `goto_db_channel_${ch.channelId}`);
      if ((i + 1) % 3 === 0) {
        inlineKeyboard.row();
      }
    });
    if (channels.length % 3 !== 0) {
      inlineKeyboard.row();
    }

    // Add delete buttons
    inlineKeyboard.text("🗑 O'chirish", 'show_delete_db_channels').row();

    await ctx.reply(message, {
      parse_mode: 'Markdown',
      reply_markup: inlineKeyboard,
    });

    const keyboard = new Keyboard()
      .text("➕ Database kanal qo'shish")
      .row()
      .text('🔙 Orqaga')
      .resized();

    await ctx.reply('Boshqaruv:', { reply_markup: keyboard });
  }

  private async showDeleteDatabaseChannels(ctx: BotContext) {
    const admin = await this.getAdmin(ctx);
    if (!admin) return;

    await ctx.answerCallbackQuery();

    const channels = await this.channelService.findAllDatabase();

    let message = '💾 **Database kanallar:**\n\n';
    channels.forEach((ch, i) => {
      message += `${i + 1}. ${ch.channelName}\n`;
      message += `   ID: ${ch.channelId}\n`;
      if (ch.channelLink) {
        message += `   Link: ${ch.channelLink}\n`;
      }
      message += `\n`;
    });

    message += "\n🗑 O'chirish uchun kanalni tanlang:";

    const inlineKeyboard = new InlineKeyboard();
    channels.forEach((ch) => {
      inlineKeyboard
        .text(`🗑 ${ch.channelName}`, `delete_db_channel_${ch.id}`)
        .row();
    });
    inlineKeyboard.text('🔙 Orqaga', 'back_to_db_channels').row();

    await ctx.editMessageText(message, {
      parse_mode: 'Markdown',
      reply_markup: inlineKeyboard,
    });
  }

  private async gotoDbChannel(ctx: BotContext) {
    const admin = await this.getAdmin(ctx);
    if (!admin) return;

    await ctx.answerCallbackQuery();

    const channelId = ctx.match![1] as string;

    try {
      // Get channel info
      const chat = await this.grammyBot.bot.api.getChat(channelId);

      let channelLink = '';
      if ('username' in chat && chat.username) {
        channelLink = `https://t.me/${chat.username}`;
      } else {
        // Try to get invite link for private channels
        try {
          const inviteLink =
            await this.grammyBot.bot.api.exportChatInviteLink(channelId);
          channelLink = inviteLink;
        } catch (error) {
          this.logger.error('Error getting invite link:', error);
        }
      }

      if (channelLink) {
        const keyboard = new InlineKeyboard().url(
          "📱 Kanalga o'tish",
          channelLink,
        );

        await ctx.reply(
          `📢 Kanal: ${chat.title}\n\n` +
            `Quyidagi tugma orqali kanalga o'tishingiz mumkin:`,
          { reply_markup: keyboard },
        );
      } else {
        await ctx.reply(
          '❌ Kanal linkini olishda xatolik yuz berdi.\n' +
            `Kanal ID: \`${channelId}\`\n\n` +
            "Kanalga qo'lda kirish uchun ID dan foydalaning.",
          { parse_mode: 'Markdown' },
        );
      }
    } catch (error) {
      this.logger.error('Error getting channel:', error);
      await ctx.reply(
        '❌ Kanalga ulanishda xatolik yuz berdi.\n' +
          'Botning kanalda admin ekanligiga ishonch hosil qiling.',
      );
    }
  }

  private async startAddDatabaseChannel(ctx: BotContext) {
    const admin = await this.getAdmin(ctx);
    if (!admin || !ctx.from) return;

    await this.sessionService.startSession(
      Number(admin.telegramId),
      AdminState.ADD_DATABASE_CHANNEL,
    );

    const keyboard = new Keyboard().text('❌ Bekor qilish').resized();

    await ctx.reply(
      '📝 Database kanalning ID sini yuboring:\n\n' +
        'Masalan: -1001234567890\n\n' +
        "❌ Bekor qilish uchun 'Bekor qilish' tugmasini bosing",
      { reply_markup: keyboard },
    );
  }

  private async deleteDatabaseChannel(ctx: BotContext) {
    const admin = await this.getAdmin(ctx);
    if (!admin) return;

    const channelId = parseInt(ctx.match![1] as string);
    await this.channelService.deleteDatabaseChannel(channelId);

    await ctx.answerCallbackQuery({ text: '✅ Database kanal ochirildi' });
    await this.showDeleteDatabaseChannels(ctx);
  }

  // ==================== PAYMENT MANAGEMENT ====================
  private async showPaymentsMenu(ctx: BotContext) {
    const admin = await this.getAdmin(ctx);
    if (!admin) return;

    // Clear any existing session to mark we're in payment menu
    if (ctx.from) {
      this.sessionService.clearSession(ctx.from.id);
    }

    await ctx.reply(
      "💳 To'lovlar bo'limi",
      AdminKeyboard.getPaymentManagementMenu(),
    );
  }

  private async showPendingPayments(ctx: BotContext) {
    const admin = await this.getAdmin(ctx);
    if (!admin) return;

    const payments = await this.paymentService.findPending();
    if (payments.length === 0) {
      await ctx.reply("📥 Yangi to'lovlar yo'q.");
      return;
    }

    for (const payment of payments) {
      const message = `
💳 **To'lov #${payment.id}**
👤 Foydalanuvchi: ${payment.user.firstName || 'N/A'}
💰 Summa: ${payment.amount} ${payment.currency}
📅 Davomiyligi: ${payment.duration} kun
🕐 Sana: ${payment.createdAt.toLocaleString('uz-UZ')}
      `;

      const keyboard = new InlineKeyboard()
        .text('✅ Tasdiqlash', `approve_payment_${payment.id}`)
        .text('❌ Rad etish', `reject_payment_${payment.id}`);

      await ctx.api.sendPhoto(ctx.chat!.id, payment.receiptFileId, {
        caption: message,
        parse_mode: 'Markdown',
        reply_markup: keyboard,
      });
    }
  }

  private async showApprovedPayments(ctx: BotContext) {
    const admin = await this.getAdmin(ctx);
    if (!admin) return;

    const payments = await this.paymentService.findByStatus('APPROVED');
    if (payments.length === 0) {
      await ctx.reply("✅ Tasdiqlangan to'lovlar yo'q.");
      return;
    }

    let message = "✅ **Tasdiqlangan to'lovlar:**\n\n";
    payments.slice(0, 20).forEach((payment, index) => {
      message += `${index + 1}. 👤 ${payment.user.firstName || 'N/A'}\n`;
      message += `   💰 ${payment.amount} ${payment.currency}\n`;
      message += `   📅 ${payment.createdAt.toLocaleDateString('uz-UZ')}\n\n`;
    });

    if (payments.length > 20) {
      message += `\n... va yana ${payments.length - 20} ta`;
    }

    await ctx.reply(message, { parse_mode: 'Markdown' });
  }

  private async showRejectedPayments(ctx: BotContext) {
    const admin = await this.getAdmin(ctx);
    if (!admin) return;

    const payments = await this.paymentService.findByStatus('REJECTED');
    if (payments.length === 0) {
      await ctx.reply("❌ Rad etilgan to'lovlar yo'q.");
      return;
    }

    let message = "❌ **Rad etilgan to'lovlar:**\n\n";
    payments.slice(0, 20).forEach((payment, index) => {
      message += `${index + 1}. 👤 ${payment.user.firstName || 'N/A'}\n`;
      message += `   💰 ${payment.amount} ${payment.currency}\n`;
      message += `   📅 ${payment.createdAt.toLocaleDateString('uz-UZ')}\n\n`;
    });

    if (payments.length > 20) {
      message += `\n... va yana ${payments.length - 20} ta`;
    }

    await ctx.reply(message, { parse_mode: 'Markdown' });
  }

  private async showPaymentStatistics(ctx: BotContext) {
    const admin = await this.getAdmin(ctx);
    if (!admin) return;

    const stats = await this.paymentService.getStatistics();

    const message = `
📊 **To'lovlar statistikasi**

📦 Jami to'lovlar: ${stats.totalPayments}
✅ Tasdiqlangan: ${stats.approvedCount}
❌ Rad etilgan: ${stats.rejectedCount}
⏳ Kutilmoqda: ${stats.pendingCount}

💰 Jami summa: ${stats.totalRevenue || 0} UZS
    `.trim();

    await ctx.reply(message, { parse_mode: 'Markdown' });
  }

  private async approvePayment(ctx: BotContext) {
    const admin = await this.getAdmin(ctx);
    if (!admin || !ctx.from) return;

    await ctx.answerCallbackQuery();

    const paymentId = parseInt(ctx.match![1] as string);
    const payment = await this.paymentService.findById(paymentId);

    if (!payment) {
      await ctx.reply("❌ To'lov topilmadi.");
      return;
    }

    // Start session to ask for duration
    this.sessionService.startSession(ctx.from.id, AdminState.APPROVE_PAYMENT);
    this.sessionService.updateSessionData(ctx.from.id, {
      paymentId,
      userId: payment.userId,
      amount: payment.amount,
    });

    const keyboard = new Keyboard()
      .text('30 kun (1 oy)')
      .text('90 kun (3 oy)')
      .row()
      .text('180 kun (6 oy)')
      .text('365 kun (1 yil)')
      .row()
      .text('❌ Bekor qilish')
      .resized();

    await ctx.reply(
      `💎 **Premium berish**\n\n` +
        `👤 Foydalanuvchi: ${payment.user.firstName}\n` +
        `💰 Summa: ${payment.amount.toLocaleString()} UZS\n\n` +
        `📅 Necha kunlik premium berasiz?\n` +
        `Kunlar sonini yozing yoki pastdagi tugmalardan tanlang:`,
      { parse_mode: 'Markdown', reply_markup: keyboard },
    );
  }

  private async rejectPayment(ctx: BotContext) {
    const admin = await this.getAdmin(ctx);
    if (!admin || !ctx.from) return;

    await ctx.answerCallbackQuery();

    const paymentId = parseInt(ctx.match![1] as string);
    const payment = await this.paymentService.findById(paymentId);

    if (!payment) {
      await ctx.reply("❌ To'lov topilmadi.");
      return;
    }

    // Start session to ask for rejection reason
    this.sessionService.startSession(ctx.from.id, AdminState.REJECT_PAYMENT);
    this.sessionService.updateSessionData(ctx.from.id, {
      paymentId,
      userId: payment.userId,
    });

    const keyboard = new Keyboard()
      .text("Noto'g'ri chek")
      .text('Pul tushmagan')
      .row()
      .text('Boshqa sabab')
      .text('❌ Bekor qilish')
      .resized();

    await ctx.reply(
      `❌ **To'lovni rad etish**\n\n` +
        `👤 Foydalanuvchi: ${payment.user.firstName}\n` +
        `💰 Summa: ${payment.amount.toLocaleString()} UZS\n\n` +
        `📝 Rad etish sababini yozing:`,
      { parse_mode: 'Markdown', reply_markup: keyboard },
    );
  }

  // ==================== ADMIN MANAGEMENT ====================
  private async showAdminsList(ctx: BotContext) {
    const admin = await this.getAdmin(ctx);
    if (!admin || admin.role !== 'SUPERADMIN') {
      await ctx.reply("❌ Sizda admin boshqarish huquqi yo'q.");
      return;
    }

    try {
      const admins = await this.adminService.findAll();
      let message = '👥 **Adminlar royxati:**\n\n';

      if (admins.length === 0) {
        message += "Hozircha adminlar yo'q.\n\n";
      } else {
        admins.forEach((a, i) => {
          const roleEmoji =
            a.role === 'SUPERADMIN' ? '👑' : a.role === 'MANAGER' ? '👨‍💼' : '👥';

          // Show who created this admin
          const creatorInfo =
            a.createdBy === ctx.from?.id.toString()
              ? ' (✅ Siz yaratdingiz)'
              : '';

          message += `${i + 1}. ${roleEmoji} @${a.username || 'N/A'}${creatorInfo}\n`;
          message += `   📋 Rol: ${a.role}\n`;
          message += `   🆔 ID: \`${a.telegramId}\`\n`;
          message += `   📅 Qo'shilgan: ${a.createdAt.toLocaleDateString('uz-UZ')}\n\n`;
        });
      }

      const keyboard = new InlineKeyboard();

      // Only show delete button for admins that:
      // 1. Were created by current admin (createdBy matches)
      // 2. OR were created after current admin (createdAt is later)
      const currentAdmin = await this.adminService.getAdminByTelegramId(
        ctx.from!.id.toString(),
      );

      const deletableAdmins = admins.filter((a) => {
        // Can't delete yourself
        if (a.telegramId === ctx.from?.id.toString()) return false;

        // Can delete if you created this admin
        if (a.createdBy === ctx.from?.id.toString()) return true;

        // Can delete if this admin was created after you
        if (currentAdmin && a.createdAt > currentAdmin.createdAt) return true;

        return false;
      });

      if (deletableAdmins.length > 0) {
        deletableAdmins.forEach((a) => {
          const roleEmoji =
            a.role === 'SUPERADMIN' ? '👑' : a.role === 'MANAGER' ? '👨‍💼' : '👥';
          keyboard
            .text(
              `🗑 ${roleEmoji} ${a.username || a.telegramId}`,
              `delete_admin_${a.telegramId}`,
            )
            .row();
        });
      }

      keyboard.text("➕ Admin qo'shish", 'add_new_admin').row();
      keyboard.text('🔙 Orqaga', 'back_to_admin_menu');

      await ctx.reply(message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard,
      });
    } catch (error) {
      this.logger.error('Error showing admins list:', error);
      await ctx.reply(
        "❌ Adminlar royxatini ko'rsatishda xatolik yuz berdi.\n\n" +
          "Iltimos, qayta urinib ko'ring.",
      );
    }
  }

  private async startAddingAdmin(ctx: BotContext) {
    const admin = await this.getAdmin(ctx);
    if (!admin || admin.role !== 'SUPERADMIN') {
      await ctx.answerCallbackQuery({
        text: "❌ Sizda admin qo'shish huquqi yo'q.",
      });
      return;
    }

    if (!ctx.from) return;

    await this.sessionService.startSession(ctx.from.id, AdminState.ADD_ADMIN);

    const keyboard = new Keyboard().text('❌ Bekor qilish').resized();

    await ctx.reply(
      '📝 Yangi admin Telegram ID sini yuboring:\n\n' +
        'Masalan: 123456789\n\n' +
        "❌ Bekor qilish uchun 'Bekor qilish' tugmasini bosing",
      { reply_markup: keyboard },
    );
    await ctx.answerCallbackQuery();
  }

  private async deleteAdmin(ctx: BotContext) {
    const admin = await this.getAdmin(ctx);
    if (!admin || admin.role !== 'SUPERADMIN') {
      await ctx.answerCallbackQuery({
        text: "❌ Sizda admin o'chirish huquqi yo'q.",
      });
      return;
    }

    try {
      const adminTelegramId = ctx.match![1] as string;

      // Check if trying to delete themselves
      if (adminTelegramId === ctx.from?.id.toString()) {
        await ctx.answerCallbackQuery({
          text: "❌ O'zingizni o'chira olmaysiz!",
          show_alert: true,
        });
        return;
      }

      // Get the admin to be deleted
      const adminToDelete =
        await this.adminService.getAdminByTelegramId(adminTelegramId);

      if (!adminToDelete) {
        await ctx.answerCallbackQuery({
          text: '❌ Admin topilmadi.',
          show_alert: true,
        });
        return;
      }

      // Get current admin details
      const currentAdmin = await this.adminService.getAdminByTelegramId(
        ctx.from!.id.toString(),
      );

      if (!currentAdmin) {
        await ctx.answerCallbackQuery({
          text: '❌ Xatolik yuz berdi.',
          show_alert: true,
        });
        return;
      }

      // Check if allowed to delete:
      // 1. Admin was created by current user
      // 2. OR admin was created after current user
      const canDelete =
        adminToDelete.createdBy === ctx.from!.id.toString() ||
        adminToDelete.createdAt > currentAdmin.createdAt;

      if (!canDelete) {
        await ctx.answerCallbackQuery({
          text: "❌ Siz faqat o'zingiz yaratgan yoki o'zingizdan keyin qo'shilgan adminlarni o'chira olasiz!",
          show_alert: true,
        });
        return;
      }

      await this.adminService.deleteAdmin(adminTelegramId);

      await ctx.answerCallbackQuery({ text: '✅ Admin ochirildi' });

      // Edit the current message to remove the deleted admin
      await ctx.editMessageText('✅ Admin muvaffaqiyatli ochirildi!');

      // Show updated admin list
      setTimeout(() => {
        this.showAdminsList(ctx);
      }, 1000);
    } catch (error) {
      this.logger.error('Error deleting admin:', error);
      await ctx.answerCallbackQuery({
        text: "❌ Admin o'chirishda xatolik yuz berdi.",
        show_alert: true,
      });
    }
  }

  private async handleRoleSelection(ctx: BotContext) {
    const admin = await this.getAdmin(ctx);
    if (!admin || admin.role !== 'SUPERADMIN') {
      await ctx.answerCallbackQuery({
        text: "❌ Sizda admin qo'shish huquqi yo'q.",
      });
      return;
    }

    // Extract role and telegramId from callback data: select_admin_role_ROLE_telegramId
    const match = ctx.callbackQuery!.data!.match(
      /^select_admin_role_(ADMIN|MANAGER|SUPERADMIN)_(.+)$/,
    );
    if (!match) {
      await ctx.answerCallbackQuery({ text: "❌ Noto'g'ri ma'lumot" });
      return;
    }

    const role = match[1] as 'ADMIN' | 'MANAGER' | 'SUPERADMIN';
    const telegramId = match[2];

    // Retrieve session data
    const session = this.sessionService.getSession(ctx.from.id);
    const username = session?.data?.username || telegramId;

    try {
      // Create admin with selected role
      await this.adminService.createAdmin({
        telegramId,
        username,
        role,
        createdBy: ctx.from.id.toString(),
      });

      // Clear session
      this.sessionService.clearSession(ctx.from.id);

      // Show success message
      const roleNames = {
        ADMIN: '👥 Admin',
        MANAGER: '👨‍💼 Manager',
        SUPERADMIN: '👑 SuperAdmin',
      };

      await ctx.editMessageText(
        `✅ *${roleNames[role]} muvaffaqiyatli qo'shildi!*\n\n` +
          `👤 Foydalanuvchi: @${username}\n` +
          `🆔 Telegram ID: \`${telegramId}\`\n` +
          `📋 Rol: ${roleNames[role]}`,
        { parse_mode: 'Markdown' },
      );

      await ctx.answerCallbackQuery({ text: "✅ Admin qo'shildi!" });

      // Return to admin management
      setTimeout(() => {
        this.showAdminsList(ctx);
      }, 2000);
    } catch (error) {
      await ctx.answerCallbackQuery({
        text: "❌ Xatolik yuz berdi. Iltimos, qayta urinib ko'ring.",
      });

      await ctx.reply(`❌ Admin qo'shishda xatolik:\n${error.message}`, {
        parse_mode: 'Markdown',
      });

      this.sessionService.clearSession(ctx.from.id);
    }
  }

  // ==================== SETTINGS ====================
  private async showSettings(ctx: BotContext) {
    const admin = await this.getAdmin(ctx);
    if (!admin || admin.role !== 'SUPERADMIN') {
      await ctx.reply("❌ Sizda sozlamalarni o'zgartirish huquqi yo'q.");
      return;
    }

    const premiumSettings = await this.premiumService.getSettings();
    const botSettings = await this.settingsService.getSettings();

    const message = `
⚙️ **BOT SOZLAMALARI**

💎 **Premium narxlar:**
├ 1 oy: ${premiumSettings.monthlyPrice} ${premiumSettings.currency}
├ 3 oy: ${premiumSettings.threeMonthPrice} ${premiumSettings.currency}
├ 6 oy: ${premiumSettings.sixMonthPrice} ${premiumSettings.currency}
└ 1 yil: ${premiumSettings.yearlyPrice} ${premiumSettings.currency}

💳 **Karta ma'lumotlari:**
├ Raqam: ${premiumSettings.cardNumber}
└ Egasi: ${premiumSettings.cardHolder}

📱 **Bot ma'lumotlari:**
├ Support: @${botSettings.supportUsername}
└ Admin chat: ${botSettings.adminNotificationChat}
    `;

    const keyboard = new InlineKeyboard()
      .text("💰 Narxlarni o'zgartirish", 'edit_prices')
      .row()
      .text("💳 Karta ma'lumotlarini o'zgartirish", 'edit_card')
      .row()
      .text("📞 Aloqa bo'limini tahrirlash", 'edit_contact')
      .row()
      .text('🔙 Orqaga', 'back_to_admin_menu');

    await ctx.reply(message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard,
    });
  }

  private async startEditingPrices(ctx: BotContext) {
    const admin = await this.getAdmin(ctx);
    if (!admin || admin.role !== 'SUPERADMIN') {
      await ctx.answerCallbackQuery({ text: "❌ Ruxsat yo'q" });
      return;
    }

    if (!ctx.from) return;

    await this.sessionService.startSession(
      ctx.from.id,
      AdminState.EDIT_PREMIUM_PRICES,
    );

    const keyboard = new Keyboard().text('❌ Bekor qilish').resized();

    await ctx.reply(
      "💰 1 oylik premium narxini kiriting (so'mda):\n\n" +
        'Masalan: 25000\n\n' +
        "❌ Bekor qilish uchun 'Bekor qilish' tugmasini bosing",
      { reply_markup: keyboard },
    );
    await ctx.answerCallbackQuery();
  }

  private async startEditingCard(ctx: BotContext) {
    const admin = await this.getAdmin(ctx);
    if (!admin || admin.role !== 'SUPERADMIN') {
      await ctx.answerCallbackQuery({ text: "❌ Ruxsat yo'q" });
      return;
    }

    if (!ctx.from) return;

    await this.sessionService.startSession(
      ctx.from.id,
      AdminState.EDIT_CARD_INFO,
    );

    const keyboard = new Keyboard().text('❌ Bekor qilish').resized();

    await ctx.reply(
      '💳 Yangi karta raqamini kiriting:\n\n' +
        'Masalan: 8600 1234 5678 9012\n\n' +
        "❌ Bekor qilish uchun 'Bekor qilish' tugmasini bosing",
      { reply_markup: keyboard },
    );
    await ctx.answerCallbackQuery();
  }

  private async startEditingContactMessage(ctx: BotContext) {
    const admin = await this.getAdmin(ctx);
    if (!admin || admin.role !== 'SUPERADMIN') {
      await ctx.answerCallbackQuery({ text: "❌ Ruxsat yo'q" });
      return;
    }

    if (!ctx.from) return;

    await this.sessionService.startSession(
      ctx.from.id,
      AdminState.EDIT_CONTACT_MESSAGE,
    );

    const settings = await this.settingsService.getSettings();
    const currentMessage =
      settings.contactMessage || 'Hozircha matn kiritilmagan';

    const keyboard = new Keyboard().text('❌ Bekor qilish').resized();

    await ctx.reply(
      `📞 **Aloqa bo'limi matnini kiriting:**\n\n` +
        `Hozirgi matn:\n${currentMessage}\n\n` +
        `Yangi matnni yuboring (Markdown formatida):\n` +
        `Masalan:\n` +
        `📞 **Aloqa**\\n\\n` +
        `Savollaringiz bo'lsa murojaat qiling:\\n` +
        `👤 Admin: @username\\n` +
        `📱 Telefon: +998901234567\n\n` +
        "❌ Bekor qilish uchun 'Bekor qilish' tugmasini bosing",
      {
        reply_markup: keyboard,
        parse_mode: 'Markdown',
      },
    );
    await ctx.answerCallbackQuery();
  }

  private async handleContactMessageEditing(
    ctx: BotContext,
    text: string,
    session: any,
  ) {
    const admin = await this.getAdmin(ctx);
    if (!admin || !ctx.from) return;

    try {
      // Update contact message in database
      await this.settingsService.updateContactMessage(text);

      this.sessionService.clearSession(ctx.from.id);

      await ctx.reply(
        "✅ Aloqa bo'limi matni muvaffaqiyatli yangilandi!\n\n" +
          'Userlar endi "📞 Aloqa" tugmasini bosganida yangi matnni ko\'rishadi.',
        AdminKeyboard.getAdminMainMenu(admin.role),
      );
    } catch (error) {
      this.logger.error('Error updating contact message:', error);
      await ctx.reply(
        "❌ Xatolik yuz berdi. Iltimos qaytadan urinib ko'ring.",
        AdminKeyboard.getCancelButton(),
      );
    }
  }

  private async backToAdminMenu(ctx: BotContext) {
    const admin = await this.getAdmin(ctx);
    if (!admin) return;

    await ctx.editMessageText('🏠 Asosiy menyu');
    await ctx.reply(
      '👨‍💼 Admin panel',
      AdminKeyboard.getAdminMainMenu(admin.role),
    );
  }

  // ==================== BROADCAST ====================
  private async startBroadcast(ctx: BotContext) {
    const admin = await this.getAdmin(ctx);
    if (!admin || admin.role !== 'SUPERADMIN') {
      await ctx.reply("❌ Sizda reklama yuborish huquqi yo'q.");
      return;
    }

    const message = `
📣 **Reklama yuborish**

Qaysi guruhga xabar yubormoqchisiz?
    `.trim();

    const keyboard = new InlineKeyboard()
      .text('📢 Hammaga', 'broadcast_all')
      .row()
      .text('💎 Faqat Premium', 'broadcast_premium')
      .text('🆓 Faqat Oddiy', 'broadcast_free')
      .row()
      .text('🎬 Kino premyera', 'broadcast_premiere')
      .row()
      .text('⭐️ Telegram Premium', 'broadcast_telegram_premium')
      .row()
      .text('🔙 Orqaga', 'back_to_admin_menu');

    await ctx.reply(message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard,
    });
  }

  private async handleBroadcastType(ctx: BotContext) {
    if (!ctx.callbackQuery || !('data' in ctx.callbackQuery) || !ctx.from)
      return;

    const callbackData = ctx.callbackQuery.data;
    await ctx.answerCallbackQuery();

    const broadcastType = callbackData.replace('broadcast_', '').toUpperCase();

    // Start broadcast session
    this.sessionService.startSession(ctx.from.id, 'BROADCASTING' as any);
    this.sessionService.updateSessionData(ctx.from.id, { broadcastType });

    const keyboard = new Keyboard().text('❌ Bekor qilish').resized();

    await ctx.reply(
      "📝 Yubormoqchi bo'lgan xabaringizni yuboring:\n\n" +
        "(Matn, rasm yoki video bo'lishi mumkin)",
      { reply_markup: keyboard },
    );
  }

  // ==================== WEB PANEL ====================
  private async showWebPanel(ctx: BotContext) {
    const admin = await this.getAdmin(ctx);
    if (!admin) {
      await ctx.reply('❌ Siz admin emassiz!');
      return;
    }

    try {
      // Use WEB_PANEL_URL from env or construct from PORT
      const webPanelUrl =
        process.env.WEB_PANEL_URL ||
        `http://localhost:${process.env.PORT || 3001}`;
      const adminPanelUrl = `${webPanelUrl}/admin?token=${admin.telegramId}`;

      const keyboard = new InlineKeyboard()
        .url("🌐 Admin Panelga o'tish", adminPanelUrl)
        .row()
        .text('🔙 Orqaga', 'back_to_admin_menu');
      await ctx.reply(
        `🌐 Web Admin Panel\n\n` +
          `👤 Admin: ${admin.username || admin.telegramId}\n` +
          `🔐 Rol: ${admin.role}\n\n` +
          `Quyidagi tugmani bosib admin panelga o'ting:`,
        {
          reply_markup: keyboard,
        },
      );
    } catch (error) {
      this.logger.error('Error showing web panel:', error);
      this.logger.error('Error stack:', error?.stack);
      this.logger.error('Error message:', error?.message);
      await ctx.reply('❌ Web panel linkini yaratishda xatolik yuz berdi.');
    }
  }

  // ==================== SESSION TEXT HANDLERS ====================
  private async handleFieldCreationSteps(
    ctx: BotContext,
    text: string,
    session: any,
  ) {
    const admin = await this.getAdmin(ctx);
    if (!admin || !ctx.from) return;

    switch (session.step) {
      case 0: // Field name
        this.sessionService.updateSessionData(ctx.from.id, { name: text });
        this.sessionService.nextStep(ctx.from.id);
        await ctx.reply(
          '📝 Kanal ID sini yuboring:\n\nMasalan: -1001234567890',
          AdminKeyboard.getCancelButton(),
        );
        break;

      case 1: // Channel ID
        const channelId = text.trim();
        if (!channelId.startsWith('-')) {
          await ctx.reply(
            "❌ Kanal ID noto'g'ri formatda!\n\nKanal ID '-' belgisi bilan boshlanishi kerak.\nMasalan: -1001234567890",
            AdminKeyboard.getCancelButton(),
          );
          return;
        }

        this.sessionService.updateSessionData(ctx.from.id, { channelId });
        this.sessionService.nextStep(ctx.from.id);
        await ctx.reply(
          '🔗 Kanal linkini yuboring:\n\nMasalan: https://t.me/+abcd1234',
          AdminKeyboard.getCancelButton(),
        );
        break;

      case 2: // Channel link
        const channelLink = text.trim();
        const data = session.data;

        try {
          await this.fieldService.create({
            name: data.name,
            channelId: data.channelId,
            channelLink,
          });

          this.sessionService.clearSession(ctx.from.id);
          await ctx.reply(
            '✅ Field muvaffaqiyatli yaratildi!',
            AdminKeyboard.getAdminMainMenu(admin.role),
          );
        } catch (error) {
          this.logger.error('Failed to create field', error);
          await ctx.reply(
            "❌ Field yaratishda xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring.",
            AdminKeyboard.getAdminMainMenu(admin.role),
          );
          this.sessionService.clearSession(ctx.from.id);
        }
        break;
    }
  }

  private async handleDatabaseChannelCreationSteps(
    ctx: BotContext,
    text: string,
    session: any,
  ) {
    const admin = await this.getAdmin(ctx);
    if (!admin || !ctx.from) return;

    switch (session.step) {
      case 0: // Channel ID
        const channelId = text.trim();
        if (!channelId.startsWith('-')) {
          await ctx.reply(
            "❌ Kanal ID noto'g'ri formatda!\n\nKanal ID '-' belgisi bilan boshlanishi kerak.\nMasalan: -1001234567890",
            AdminKeyboard.getCancelButton(),
          );
          return;
        }

        // Try to get channel info
        try {
          const chat = await ctx.api.getChat(channelId);
          const channelName = 'title' in chat ? chat.title : channelId;

          // Try to get channel link if it's a public channel
          let channelLink: string | undefined;
          if ('username' in chat && chat.username) {
            channelLink = `https://t.me/${chat.username}`;
          }

          await this.channelService.createDatabaseChannel({
            channelId,
            channelName,
            channelLink,
            isActive: true,
          });

          this.sessionService.clearSession(ctx.from.id);
          const linkInfo = channelLink ? `\n🔗 ${channelLink}` : '';
          await ctx.reply(
            `✅ Database kanal muvaffaqiyatli qo'shildi!\n\n📢 ${channelName}\n🆔 ${channelId}${linkInfo}`,
            AdminKeyboard.getAdminMainMenu(admin.role),
          );
        } catch (error) {
          this.logger.error(
            'Failed to get channel info or create channel',
            error,
          );
          await ctx.reply(
            "❌ Kanal ma'lumotlarini olishda xatolik yuz berdi.\n\nBotning kanalda admin ekanligiga ishonch hosil qiling va qaytadan urinib ko'ring.",
            AdminKeyboard.getCancelButton(),
          );
        }
        break;
    }
  }

  private async handleMandatoryChannelCreationSteps(
    ctx: BotContext,
    text: string,
    session: any,
  ) {
    const admin = await this.getAdmin(ctx);
    if (!admin || !ctx.from) return;

    switch (session.step) {
      case 0: // Channel type selection
        let channelType: 'PUBLIC' | 'PRIVATE' | 'EXTERNAL';

        if (text === '🌐 Public kanal') {
          channelType = 'PUBLIC';
          this.sessionService.updateSessionData(ctx.from.id, { channelType });
          this.sessionService.nextStep(ctx.from.id);
          await ctx.reply(
            '🔗 Kanal linkini yuboring:\n\nMasalan: https://t.me/mychannel',
            AdminKeyboard.getCancelButton(),
          );
        } else if (text === '🔒 Private kanal') {
          channelType = ChannelType.PRIVATE;
          this.sessionService.updateSessionData(ctx.from.id, { channelType });
          this.sessionService.nextStep(ctx.from.id);
          await ctx.reply(
            '🔗 Kanal invite linkini yuboring:\n\nMasalan: https://t.me/+abc123xyz',
            AdminKeyboard.getCancelButton(),
          );
        } else if (text === '🔗 Boshqa link') {
          channelType = ChannelType.EXTERNAL;
          this.sessionService.updateSessionData(ctx.from.id, { channelType });
          // Skip Step 1 (ID verification) for external channels - they don't need Telegram ID
          this.sessionService.nextStep(ctx.from.id); // Go to step 1
          this.sessionService.nextStep(ctx.from.id); // Then skip to step 2
          await ctx.reply(
            '📝 Kanal/Guruh nomini kiriting:\n\nMasalan: Instagram Sahifam, YouTube Kanal',
            AdminKeyboard.getCancelButton(),
          );
        }
        break;

      case 1: // Channel link (for PUBLIC/PRIVATE)
        const channelLink = text.trim();
        const data = session.data;

        // Check if we're waiting for private channel ID
        if (data.waitingForPrivateChannelId) {
          // Validate ID format
          if (!channelLink.startsWith('-')) {
            await ctx.reply(
              "❌ Kanal ID noto'g'ri formatda!\n\n" +
                "Kanal ID '-' belgisi bilan boshlanishi kerak.\n" +
                'Masalan: -1001234567890',
              AdminKeyboard.getCancelButton(),
            );
            return;
          }

          try {
            // Verify channel exists and bot is admin
            const chat = await ctx.api.getChat(channelLink);
            const botMember = await ctx.api.getChatMember(
              channelLink,
              ctx.me.id,
            );

            if (
              botMember.status !== 'administrator' &&
              botMember.status !== 'creator'
            ) {
              await ctx.reply(
                '❌ Bot kanalda admin emas!\n\n' +
                  "Iltimos, botni kanalga admin qiling va qayta urinib ko'ring.",
                AdminKeyboard.getCancelButton(),
              );
              return;
            }

            const channelName = 'title' in chat ? chat.title : channelLink;

            this.sessionService.updateSessionData(ctx.from.id, {
              channelId: channelLink,
              channelName,
              waitingForPrivateChannelId: false,
            });

            this.sessionService.nextStep(ctx.from.id);

            const keyboard = new Keyboard()
              .text('♾️ Cheksiz')
              .text('🔢 Limitli')
              .row()
              .text('❌ Bekor qilish')
              .resized();

            await ctx.reply(
              '🔢 Kanal uchun limitni tanlang:\n\n' +
                "♾️ Cheksiz - Kanal doim majburiy bo'ladi (admin o'chirmaguncha)\n" +
                "🔢 Limitli - Ma'lum sondagi a'zolar qo'shilgandan keyin avtomatik o'chiriladi\n\n" +
                'Tanlang:',
              { reply_markup: keyboard },
            );
          } catch (error) {
            this.logger.error('Failed to verify private channel', error);
            await ctx.reply(
              '❌ Kanal topilmadi yoki bot admin emas!\n\n' +
                '✅ Botning kanalda admin ekanligiga ishonch hosil qiling.\n' +
                "✅ Kanal ID to'g'ri ekanligiga ishonch hosil qiling.",
              AdminKeyboard.getCancelButton(),
            );
          }
          return;
        }

        // Validate link format
        if (!channelLink.startsWith('https://t.me/')) {
          await ctx.reply(
            "❌ Link noto'g'ri formatda!\n\nLink 'https://t.me/' bilan boshlanishi kerak.\nMasalan: https://t.me/mychannel yoki https://t.me/+abc123",
            AdminKeyboard.getCancelButton(),
          );
          return;
        }

        // Verify channel and get info
        try {
          let channelId: string;
          let channelName: string;

          if (
            channelLink.includes('/+') ||
            channelLink.includes('/joinchat/')
          ) {
            // PRIVATE channel - can't validate via link alone
            // Ask for channel ID directly
            await ctx.reply(
              "🔒 Private kanal uchun ID kerak bo'ladi.\n\n" +
                '📱 Kanal ID sini olish uchun:\n' +
                '1️⃣ Kanalga @userinfobot ni admin qiling\n' +
                '2️⃣ Kanalda biror xabar yuboring\n' +
                '3️⃣ Bot sizga kanal ID sini beradi\n\n' +
                '🆔 Kanal ID sini yuboring:\n' +
                'Masalan: -1001234567890',
              AdminKeyboard.getCancelButton(),
            );
            // Save the link but wait for ID
            this.sessionService.updateSessionData(ctx.from.id, {
              channelLink,
              waitingForPrivateChannelId: true,
            });
            return; // Stay on step 1
          } else {
            // PUBLIC channel - extract username and validate
            const username = channelLink.split('/').pop();
            if (!username) {
              await ctx.reply(
                "❌ Link noto'g'ri formatda!",
                AdminKeyboard.getCancelButton(),
              );
              return;
            }

            const channelIdentifier = username.startsWith('@')
              ? username
              : `@${username}`;

            // Get channel info
            const chat = await ctx.api.getChat(channelIdentifier);
            channelId = String(chat.id);
            channelName = 'title' in chat ? chat.title : channelIdentifier;

            // Verify bot is admin
            const botMember = await ctx.api.getChatMember(channelId, ctx.me.id);
            if (
              botMember.status !== 'administrator' &&
              botMember.status !== 'creator'
            ) {
              await ctx.reply(
                '❌ Bot kanalda admin emas!\n\n' +
                  "Iltimos, botni kanalga admin qiling va qayta urinib ko'ring.",
                AdminKeyboard.getCancelButton(),
              );
              return;
            }

            this.sessionService.updateSessionData(ctx.from.id, {
              channelId,
              channelName,
              channelLink,
            });
          }
        } catch (error) {
          this.logger.error('Failed to get channel info', error);
          await ctx.reply(
            '❌ Kanal topilmadi yoki bot admin emas!\n\n' +
              '✅ Botning kanalda admin ekanligiga ishonch hosil qiling.\n' +
              "✅ Kanal linki to'g'ri ekanligiga ishonch hosil qiling.",
            AdminKeyboard.getCancelButton(),
          );
          return;
        }

        this.sessionService.nextStep(ctx.from.id);

        const keyboard = new Keyboard()
          .text('♾️ Cheksiz')
          .text('🔢 Limitli')
          .row()
          .text('❌ Bekor qilish')
          .resized();

        await ctx.reply(
          '🔢 Kanal uchun limitni tanlang:\n\n' +
            "♾️ Cheksiz - Kanal doim majburiy bo'ladi (admin o'chirmaguncha)\n" +
            "🔢 Limitli - Ma'lum sondagi a'zolar qo'shilgandan keyin avtomatik o'chiriladi\n\n" +
            'Tanlang:',
          { reply_markup: keyboard },
        );
        break;

      case 2: // Limit selection (PUBLIC/PRIVATE) or External name
        const input = text.trim();
        const sessionData = session.data;

        if (sessionData.channelType === ChannelType.EXTERNAL) {
          // For EXTERNAL channels (Instagram, Facebook, etc.)
          // No ID verification needed - these are not Telegram channels
          this.sessionService.updateSessionData(ctx.from.id, {
            channelName: input,
          });
          this.sessionService.nextStep(ctx.from.id);
          await ctx.reply(
            '🔗 Linkni yuboring:\n\nMasalan:\n- https://instagram.com/username\n- https://youtube.com/@channel\n- https://facebook.com/page',
            AdminKeyboard.getCancelButton(),
          );
        } else {
          // For PUBLIC/PRIVATE, handle limit selection
          if (input === '♾️ Cheksiz') {
            // Create channel with no limit
            await this.createChannelWithLimit(ctx, admin, sessionData, null);
          } else if (input === '🔢 Limitli') {
            this.sessionService.nextStep(ctx.from.id);
            await ctx.reply(
              "🔢 Nechta a'zo qo'shilgandan keyin kanal o'chirilsin?\n\n" +
                'Masalan: 1000\n\n' +
                'Faqat raqam kiriting:',
              AdminKeyboard.getCancelButton(),
            );
          } else {
            await ctx.reply(
              "❌ Noto'g'ri tanlov! Tugmalardan birini bosing.",
              AdminKeyboard.getCancelButton(),
            );
          }
        }
        break;

      case 3:
        const step3Input = text.trim();
        const step3Data = session.data;

        if (step3Data.channelType === ChannelType.EXTERNAL) {
          try {
            await this.channelService.createMandatoryChannel({
              channelId: step3Input,
              channelName: step3Data.channelName,
              channelLink: step3Input,
              type: ChannelType.EXTERNAL,
              isActive: true,
              memberLimit: null,
            });

            this.sessionService.clearSession(ctx.from.id);
            await ctx.reply(
              `✅ Tashqi link muvaffaqiyatli qo'shildi!\n\n` +
                `📢 ${step3Data.channelName}\n` +
                `🔗 ${step3Input}\n` +
                `📁 Turi: Tashqi link`,
              AdminKeyboard.getAdminMainMenu(admin.role),
            );
          } catch (error) {
            this.logger.error('Failed to create external channel', error);
            await ctx.reply(
              '❌ Xatolik yuz berdi.',
              AdminKeyboard.getCancelButton(),
            );
          }
        } else {
          // For PUBLIC/PRIVATE, this is the limit number
          const limitNumber = parseInt(step3Input);
          if (isNaN(limitNumber) || limitNumber <= 0) {
            await ctx.reply(
              "❌ Noto'g'ri format! Musbat son kiriting.\n\nMasalan: 1000",
              AdminKeyboard.getCancelButton(),
            );
            return;
          }

          await this.createChannelWithLimit(ctx, admin, step3Data, limitNumber);
        }
        break;
    }
  }

  private async createChannelWithLimit(
    ctx: BotContext,
    admin: any,
    data: any,
    memberLimit: number | null,
  ) {
    try {
      // Channel ID and name already verified and saved in session
      await this.channelService.createMandatoryChannel({
        channelId: data.channelId,
        channelName: data.channelName,
        channelLink: data.channelLink,
        type: data.channelType,
        isActive: true,
        memberLimit,
      });

      this.sessionService.clearSession(ctx.from!.id);

      const limitText =
        memberLimit === null ? 'Cheksiz' : `Limit: ${memberLimit} ta a'zo`;

      await ctx.reply(
        `✅ Majburiy kanal muvaffaqiyatli qo'shildi!\n\n` +
          `📢 ${data.channelName}\n` +
          `🔗 ${data.channelLink}\n` +
          `📁 Turi: ${data.channelType === 'PUBLIC' ? 'Public kanal' : 'Private kanal'}\n` +
          `🔢 ${limitText}`,
        AdminKeyboard.getAdminMainMenu(admin.role),
      );
    } catch (error) {
      this.logger.error('Failed to create mandatory channel', error);
      await ctx.reply(
        "❌ Kanal qo'shishda xatolik yuz berdi.\n\nBotning kanalda admin ekanligiga ishonch hosil qiling.",
        AdminKeyboard.getCancelButton(),
      );
    }
  }

  private async handleAdminCreationSteps(
    ctx: BotContext,
    text: string,
    session: any,
  ) {
    const admin = await this.getAdmin(ctx);
    if (!admin || !ctx.from) return;

    const telegramId = text.trim();

    try {
      // Check if user exists in Telegram
      const user = await ctx.api.getChat(telegramId);
      const username = 'username' in user ? user.username : undefined;

      // Save user data in session
      this.sessionService.updateSessionData(ctx.from.id, {
        telegramId,
        username: username || telegramId,
      });

      // Show role selection with descriptions
      const message = `
👤 **Admin qo'shish**

✅ Foydalanuvchi topildi:
🆔 ${username ? '@' + username : telegramId}
🆔 ID: ${telegramId}

💼 **Rol tanlang:**

👥 **ADMIN**
├ Kino va serial yuklash
├ Statistikani ko'rish
└ Fieldlarni boshqarish

👨‍💼 **MANAGER**
├ Admin qila oladigan barcha narsa
├ Majburiy kanallar boshqarish
├ Database kanallar boshqarish
└ To'lovlarni boshqarish

👑 **SUPERADMIN**
├ Manager qila oladigan barcha narsa
├ Adminlar boshqarish
├ Reklama yuborish
├ Bot sozlamalari
└ To'liq nazorat

Qaysi rol berasiz?
      `.trim();

      const keyboard = new InlineKeyboard()
        .text('👥 Admin', `select_admin_role_ADMIN_${telegramId}`)
        .row()
        .text('👨‍💼 Manager', `select_admin_role_MANAGER_${telegramId}`)
        .row()
        .text('👑 SuperAdmin', `select_admin_role_SUPERADMIN_${telegramId}`);

      await ctx.reply(message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard,
      });
    } catch (error) {
      this.logger.error('Failed to get user info', error);
      await ctx.reply(
        "❌ Foydalanuvchi topilmadi yoki xatolik yuz berdi.\n\nIltimos, to'g'ri Telegram ID kiriting.",
        AdminKeyboard.getCancelButton(),
      );
    }
  }

  private async handlePriceEditingSteps(
    ctx: BotContext,
    text: string,
    session: any,
  ) {
    const admin = await this.getAdmin(ctx);
    if (!admin || !ctx.from) return;

    const price = parseInt(text);
    if (isNaN(price) || price <= 0) {
      await ctx.reply(
        "❌ Narx noto'g'ri formatda!\n\nIltimos, faqat raqam kiriting.\nMasalan: 25000",
        AdminKeyboard.getCancelButton(),
      );
      return;
    }

    switch (session.step) {
      case 0: // Monthly price
        this.sessionService.updateSessionData(ctx.from.id, {
          monthlyPrice: price,
        });
        this.sessionService.nextStep(ctx.from.id);
        await ctx.reply(
          "💰 3 oylik premium narxini kiriting (so'mda):\n\nMasalan: 70000",
          AdminKeyboard.getCancelButton(),
        );
        break;

      case 1: // 3 months price
        this.sessionService.updateSessionData(ctx.from.id, {
          threeMonthPrice: price,
        });
        this.sessionService.nextStep(ctx.from.id);
        await ctx.reply(
          "💰 6 oylik premium narxini kiriting (so'mda):\n\nMasalan: 130000",
          AdminKeyboard.getCancelButton(),
        );
        break;

      case 2: // 6 months price
        this.sessionService.updateSessionData(ctx.from.id, {
          sixMonthPrice: price,
        });
        this.sessionService.nextStep(ctx.from.id);
        await ctx.reply(
          "💰 1 yillik premium narxini kiriting (so'mda):\n\nMasalan: 250000",
          AdminKeyboard.getCancelButton(),
        );
        break;

      case 3: // Yearly price
        const data = session.data;
        try {
          await this.premiumService.updatePrices({
            monthlyPrice: data.monthlyPrice,
            threeMonthPrice: data.threeMonthPrice,
            sixMonthPrice: data.sixMonthPrice,
            yearlyPrice: price,
          });

          this.sessionService.clearSession(ctx.from.id);
          await ctx.reply(
            '✅ Narxlar muvaffaqiyatli yangilandi!',
            AdminKeyboard.getAdminMainMenu(admin.role),
          );
        } catch (error) {
          this.logger.error('Failed to update prices', error);
          await ctx.reply(
            '❌ Narxlarni yangilashda xatolik yuz berdi.',
            AdminKeyboard.getAdminMainMenu(admin.role),
          );
          this.sessionService.clearSession(ctx.from.id);
        }
        break;
    }
  }

  private async handleCardEditingSteps(
    ctx: BotContext,
    text: string,
    session: any,
  ) {
    const admin = await this.getAdmin(ctx);
    if (!admin || !ctx.from) return;

    switch (session.step) {
      case 0: // Card number
        this.sessionService.updateSessionData(ctx.from.id, {
          cardNumber: text.trim(),
        });
        this.sessionService.nextStep(ctx.from.id);
        await ctx.reply(
          '💳 Karta egasining ismini kiriting:\n\nMasalan: AZIZ KHAMIDOV',
          AdminKeyboard.getCancelButton(),
        );
        break;

      case 1: // Card holder
        const data = session.data;
        try {
          await this.premiumService.updateCardInfo({
            cardNumber: data.cardNumber,
            cardHolder: text.trim(),
          });

          this.sessionService.clearSession(ctx.from.id);
          await ctx.reply(
            "✅ Karta ma'lumotlari muvaffaqiyatli yangilandi!",
            AdminKeyboard.getAdminMainMenu(admin.role),
          );
        } catch (error) {
          this.logger.error('Failed to update card info', error);
          await ctx.reply(
            "❌ Karta ma'lumotlarini yangilashda xatolik yuz berdi.",
            AdminKeyboard.getAdminMainMenu(admin.role),
          );
          this.sessionService.clearSession(ctx.from.id);
        }
        break;
    }
  }

  private async handleSerialCreationSteps(
    ctx: BotContext,
    text: string,
    session: any,
  ) {
    const admin = await this.getAdmin(ctx);
    if (!admin || !ctx.from) return;

    // Check if we're in episode uploading step
    if (session.step === 6) {
      // UPLOADING_EPISODES step (new serial)
      if (text.includes('qism yuklash') || text === '✅ Tugatish') {
        await this.serialManagementService.handleContinueOrFinish(ctx, text);
        return;
      } else if (text === '✅ Ha, field kanalga tashla') {
        await this.serialManagementService.finalizNewSerial(ctx, true);
        return;
      } else if (text === "❌ Yo'q, faqat saqlash") {
        await this.serialManagementService.finalizNewSerial(ctx, false);
        return;
      }
    }

    // Check if we're adding episodes to existing serial
    if (session.step === 7) {
      // ADDING_EPISODES step (existing serial)
      if (text.includes('qism yuklash') || text === '✅ Tugatish') {
        if (text === '✅ Tugatish') {
          // Ask about updating field channel
          const keyboard = new Keyboard()
            .text('✅ Ha, field kanalga yangilash')
            .row()
            .text("❌ Yo'q, faqat saqlash")
            .resized();

          await ctx.reply(
            '📺 Qismlar tayyorlandi!\n\nField kanaldagi posterni yangilashmi?',
            { reply_markup: keyboard },
          );
          return;
        } else {
          // Continue adding more episodes
          const data = session.data;
          await ctx.reply(
            `📹 ${data.nextEpisodeNumber}-qism videosini yuboring:`,
            AdminKeyboard.getCancelButton(),
          );
          return;
        }
      } else if (text === '✅ Ha, field kanalga yangilash') {
        await this.serialManagementService.finalizeAddingEpisodes(ctx, true);
        return;
      } else if (text === "❌ Yo'q, faqat saqlash") {
        await this.serialManagementService.finalizeAddingEpisodes(ctx, false);
        return;
      }
    }

    switch (session.step) {
      case SerialCreateStep.CODE:
        const code = parseInt(text);
        if (isNaN(code) || code <= 0) {
          await ctx.reply(
            "❌ Kod faqat raqamlardan iborat bo'lishi kerak!\nMasalan: 12345\n\nIltimos, qaytadan kiriting:",
            AdminKeyboard.getCancelButton(),
          );
          return;
        }

        // Check if code is available (both Movie and Serial)
        const existingSerial = await this.serialService.findByCode(
          code.toString(),
        );

        // Check if code is used by a movie
        const existingMovie = await this.movieService.findByCode(
          code.toString(),
        );

        // If adding episodes to existing content and code belongs to movie
        if (existingMovie && session.data?.isAddingEpisode) {
          await this.serialManagementService.handleAddEpisodeCode(ctx, code);
          return;
        }

        if (existingMovie) {
          await ctx.reply(
            `❌ ${code} kodi kino uchun ishlatilgan!\n\n🎬 ${existingMovie.title}\n\n⚠️ Serial uchun boshqa kod tanlang:`,
            AdminKeyboard.getCancelButton(),
          );
          return;
        }

        // If adding episodes to existing content and code belongs to serial
        if (existingSerial && session.data?.isAddingEpisode) {
          await this.serialManagementService.handleAddEpisodeCode(ctx, code);
          return;
        }

        if (existingSerial) {
          // Find nearest available codes
          const nearestCodes =
            await this.serialService.findNearestAvailableCodes(code, 5);
          const codesList =
            nearestCodes.length > 0
              ? `\n\n📋 Eng yaqin bo'sh kodlar:\n${nearestCodes.map((c) => `• ${c}`).join('\n')}`
              : '';

          await ctx.reply(
            `❌ ${code} kodi allaqachon ishlatilmoqda!\n\n` +
              `📺 ${existingSerial.title}\n` +
              `🎭 Janr: ${existingSerial.genre}\n` +
              `📊 Qismlar: ${existingSerial.totalEpisodes}` +
              codesList +
              `\n\n⚠️ Boshqa kod kiriting:`,
            AdminKeyboard.getCancelButton(),
          );
          return;
        }

        this.sessionService.updateSessionData(ctx.from.id, { code });
        this.sessionService.setStep(ctx.from.id, SerialCreateStep.TITLE);
        await ctx.reply(
          'Serial nomini kiriting:\nMasalan: Game of Thrones',
          AdminKeyboard.getCancelButton(),
        );
        break;

      case SerialCreateStep.TITLE:
        if (text === "➕ Yangi qism qo'shish") {
          // Continue with existing serial
          const data = session.data;
          this.sessionService.updateSessionData(ctx.from.id, {
            isAddingEpisode: true,
            serialId: data.existingSerial.id,
            nextEpisode: data.existingSerial.totalEpisodes + 1,
          });

          await ctx.reply(
            `📹 Serial "${data.existingSerial.title}" uchun ${data.existingSerial.totalEpisodes + 1}-qism videosini yuboring:`,
            AdminKeyboard.getCancelButton(),
          );
          return;
        }

        this.sessionService.updateSessionData(ctx.from.id, { title: text });
        this.sessionService.setStep(ctx.from.id, SerialCreateStep.GENRE);
        await ctx.reply(
          '🎭 Janr kiriting:\nMasalan: Drama, Action',
          AdminKeyboard.getCancelButton(),
        );
        break;

      case SerialCreateStep.GENRE:
        this.sessionService.updateSessionData(ctx.from.id, { genre: text });
        this.sessionService.setStep(ctx.from.id, SerialCreateStep.DESCRIPTION);

        const keyboard = new Keyboard()
          .text('Next')
          .row()
          .text('❌ Bekor qilish')
          .resized();
        await ctx.reply(
          "📝 Tavsif kiriting:\n\n⏭ O'tkazib yuborish uchun 'Next' yozing",
          { reply_markup: keyboard },
        );
        break;

      case SerialCreateStep.DESCRIPTION:
        if (text.toLowerCase() === 'next') {
          this.sessionService.updateSessionData(ctx.from.id, {
            description: null,
          });
        } else {
          this.sessionService.updateSessionData(ctx.from.id, {
            description: text,
          });
        }
        this.sessionService.setStep(ctx.from.id, SerialCreateStep.FIELD);

        // Show fields list
        const allFields = await this.fieldService.findAll();
        if (allFields.length === 0) {
          await ctx.reply(
            '❌ Hech qanday field topilmadi. Avval field yarating.',
          );
          this.sessionService.clearSession(ctx.from.id);
          return;
        }

        let message = '📁 Qaysi fieldni tanlaysiz?\n\n';
        allFields.forEach((field, index) => {
          message += `${index + 1}. ${field.name}\n`;
        });
        message += '\nRaqamini kiriting (masalan: 1)';

        this.sessionService.updateSessionData(ctx.from.id, {
          fields: allFields,
        });
        await ctx.reply(message, AdminKeyboard.getCancelButton());
        break;

      case SerialCreateStep.FIELD:
        const fieldIndex = parseInt(text) - 1;
        const userFields = session.data.fields;

        if (
          isNaN(fieldIndex) ||
          fieldIndex < 0 ||
          fieldIndex >= userFields.length
        ) {
          await ctx.reply("❌ Noto'g'ri raqam. Iltimos qaytadan kiriting:");
          return;
        }

        this.sessionService.updateSessionData(ctx.from.id, {
          selectedField: userFields[fieldIndex],
          fieldId: userFields[fieldIndex].id,
        });
        this.sessionService.setStep(ctx.from.id, SerialCreateStep.PHOTO);

        await ctx.reply(
          '🖼 Serial rasmini (poster) yuboring:',
          AdminKeyboard.getCancelButton(),
        );
        break;
    }
  }

  private async handleVideoAttachmentSteps(
    ctx: BotContext,
    text: string,
    session: any,
  ) {
    const admin = await this.getAdmin(ctx);
    if (!admin || !ctx.from) return;

    const code = parseInt(text);
    if (isNaN(code) || code <= 0) {
      await ctx.reply(
        "❌ Kod faqat raqamlardan iborat bo'lishi kerak!\nMasalan: 12345\n\nIltimos, qaytadan kiriting:",
        AdminKeyboard.getCancelButton(),
      );
      return;
    }

    const movie = await this.movieService.findByCode(code.toString());
    if (!movie) {
      await ctx.reply(
        '❌ Bu kod bilan kino topilmadi!\n\nBoshqa kod kiriting:',
        AdminKeyboard.getCancelButton(),
      );
      return;
    }

    if (movie.videoFileId) {
      await ctx.reply(
        `❌ Bu kinoda allaqachon video bor!\n\n🎬 ${movie.title}\n\nBoshqa kod kiriting:`,
        AdminKeyboard.getCancelButton(),
      );
      return;
    }

    this.sessionService.updateSessionData(ctx.from.id, {
      movieId: movie.id,
      movieCode: code,
      movieTitle: movie.title,
    });
    this.sessionService.nextStep(ctx.from.id);

    await ctx.reply(
      `📹 "${movie.title}" kinosi uchun video yuboring:`,
      AdminKeyboard.getCancelButton(),
    );
  }

  private async handleBroadcastMessage(
    ctx: BotContext,
    text: string,
    session: any,
  ) {
    if (!ctx.from) return;

    const admin = await this.getAdmin(ctx);
    if (!admin) return;

    const broadcastType = session.data.broadcastType;
    const message = ctx.message;

    // Start broadcasting
    await ctx.reply('📤 Xabar yuborilmoqda... Iltimos kuting.');

    try {
      // Get users based on type
      let users;
      if (broadcastType === 'PREMIUM') {
        users = await this.premiumService.getPremiumUsers();
      } else if (broadcastType === 'FREE') {
        users = await this.userService.findAll();
        const premiumUsers = await this.premiumService.getPremiumUsers();
        const premiumIds = premiumUsers.map((u) => u.id);
        users = users.filter((u) => !premiumIds.includes(u.id));
      } else {
        // ALL
        users = await this.userService.findAll();
      }

      let successCount = 0;
      let failCount = 0;

      for (const user of users) {
        try {
          // Forward message to preserve "forward from" metadata
          if (message) {
            await ctx.api.copyMessage(
              user.telegramId,
              ctx.chat.id,
              message.message_id,
              { protect_content: false },
            );
          } else {
            // Fallback to sending text
            await ctx.api.sendMessage(user.telegramId, text);
          }
          successCount++;

          // Delay to avoid flood
          await new Promise((resolve) => setTimeout(resolve, 50));
        } catch (error) {
          failCount++;
          this.logger.error(
            `Failed to send to user ${user.telegramId}:`,
            error,
          );
        }
      }

      this.sessionService.clearSession(ctx.from.id);

      await ctx.reply(
        `✅ Xabar yuborish yakunlandi!\n\n` +
          `📊 Jami: ${users.length}\n` +
          `✅ Yuborildi: ${successCount}\n` +
          `❌ Xato: ${failCount}`,
        AdminKeyboard.getAdminMainMenu(admin.role),
      );
    } catch (error) {
      this.logger.error('Broadcasting error:', error);
      await ctx.reply(
        '❌ Xabar yuborishda xatolik yuz berdi.',
        AdminKeyboard.getAdminMainMenu(admin.role),
      );
      this.sessionService.clearSession(ctx.from.id);
    }
  }

  // ==================== PAYMENT APPROVAL ====================
  private async handleApprovePaymentSteps(
    ctx: BotContext,
    text: string,
    session: any,
  ) {
    const admin = await this.getAdmin(ctx);
    if (!admin || !ctx.from) return;

    const { paymentId, userId, amount } = session.data;

    // Parse duration from text or button
    let durationDays: number;

    if (text === '30 kun (1 oy)') {
      durationDays = 30;
    } else if (text === '90 kun (3 oy)') {
      durationDays = 90;
    } else if (text === '180 kun (6 oy)') {
      durationDays = 180;
    } else if (text === '365 kun (1 yil)') {
      durationDays = 365;
    } else {
      // Try to parse as number
      durationDays = parseInt(text);
      if (isNaN(durationDays) || durationDays <= 0) {
        await ctx.reply(
          "❌ Noto'g'ri format! Kunlar sonini kiriting (masalan: 30) yoki pastdagi tugmalardan tanlang.",
        );
        return;
      }
    }

    try {
      // Approve payment and give premium
      await this.paymentService.approve(paymentId, admin.id, durationDays);

      // Get payment details
      const payment = await this.paymentService.findById(paymentId);

      // Send notification to user
      try {
        const expiresDate = new Date();
        expiresDate.setDate(expiresDate.getDate() + durationDays);

        await this.grammyBot.bot.api.sendMessage(
          payment.user.telegramId,
          `✅ **To'lovingiz tasdiqlandi!**\n\n` +
            `💎 Premium: Faol\n` +
            `⏱ Muddati: ${durationDays} kun\n` +
            `📅 Tugash sanasi: ${expiresDate.toLocaleDateString('uz-UZ')}\n\n` +
            `🎉 Endi barcha imkoniyatlardan foydalanishingiz mumkin!`,
          { parse_mode: 'Markdown' },
        );
      } catch (error) {
        this.logger.error('Error notifying user:', error);
      }

      // Clear session and show success
      this.sessionService.clearSession(ctx.from.id);

      await ctx.reply(
        `✅ To'lov tasdiqlandi!\n\n` +
          `👤 Foydalanuvchi: ${payment.user.firstName}\n` +
          `💎 Premium muddati: ${durationDays} kun\n` +
          `💰 Summa: ${amount.toLocaleString()} UZS`,
        AdminKeyboard.getAdminMainMenu(admin.role),
      );
    } catch (error) {
      this.logger.error('Error approving payment:', error);
      await ctx.reply(
        "❌ To'lovni tasdiqlashda xatolik yuz berdi.",
        AdminKeyboard.getAdminMainMenu(admin.role),
      );
      this.sessionService.clearSession(ctx.from.id);
    }
  }

  private async handleRejectPaymentSteps(
    ctx: BotContext,
    text: string,
    session: any,
  ) {
    const admin = await this.getAdmin(ctx);
    if (!admin || !ctx.from) return;

    const { paymentId, userId } = session.data;

    // Use predefined reason or custom text
    let reason = text;
    if (text === "Noto'g'ri chek") {
      reason = "Yuborilgan chek noto'g'ri yoki o'qib bo'lmaydi";
    } else if (text === 'Pul tushmagan') {
      reason = "To'lov hali kartaga tushmagan";
    } else if (text === 'Boshqa sabab') {
      await ctx.reply(
        '📝 Rad etish sababini yozing:',
        AdminKeyboard.getCancelButton(),
      );
      return;
    }

    try {
      // Reject payment
      await this.paymentService.reject(paymentId, admin.id, reason);

      // Get payment details
      const payment = await this.paymentService.findById(paymentId);

      // Increment ban counter
      const updatedUser = await this.prisma.user.update({
        where: { id: payment.userId },
        data: { premiumBanCount: { increment: 1 } },
      });

      const banCount = updatedUser.premiumBanCount;

      // Send notification to user with warning
      try {
        let message = '';

        if (banCount === 1) {
          // First warning
          message =
            `❌ **To'lovingiz rad etildi**\n\n` +
            `📝 Sabab: ${reason}\n\n` +
            `⚠️ **Ogohlantirish!**\n` +
            `Siz to'lov qilishda yolg'on ma'lumotlardan foydalandingiz. Agar bu holat yana takrorlansa, botning bu funksiyasi siz uchun butunlay yopiladi.\n\n` +
            `🚨 Ogohlantirish: 1/2`;
        } else if (banCount >= 2) {
          // Second warning - ban user
          await this.prisma.user.update({
            where: { id: payment.userId },
            data: {
              isPremiumBanned: true,
              premiumBannedAt: new Date(),
            },
          });

          message =
            `❌ **To'lovingiz rad etildi**\n\n` +
            `📝 Sabab: ${reason}\n\n` +
            `🚫 **Premium'dan foydalanish bloklandi!**\n` +
            `Siz botda yolg'on to'lov ma'lumotlarini ishlatganingiz uchun Premium'dan endi foydalana olmaysiz.\n\n` +
            `ℹ️ Blokni faqat admin ochishi mumkin.`;
        }

        await this.grammyBot.bot.api.sendMessage(
          payment.user.telegramId,
          message,
          { parse_mode: 'Markdown' },
        );
      } catch (error) {
        this.logger.error('Error notifying user:', error);
      }

      // Clear session and show success
      this.sessionService.clearSession(ctx.from.id);

      await ctx.reply(
        `❌ To'lov rad etildi!\n\n` +
          `👤 Foydalanuvchi: ${payment.user.firstName}\n` +
          `📝 Sabab: ${reason}\n` +
          `⚠️ Ogohlantirish: ${banCount}/2` +
          (banCount >= 2 ? '\n\n🚫 Foydalanuvchi premiumdan bloklandi!' : ''),
        AdminKeyboard.getAdminMainMenu(admin.role),
      );
    } catch (error) {
      this.logger.error('Error rejecting payment:', error);
      await ctx.reply(
        "❌ To'lovni rad etishda xatolik yuz berdi.",
        AdminKeyboard.getAdminMainMenu(admin.role),
      );
      this.sessionService.clearSession(ctx.from.id);
    }
  }

  private async startPremiereBroadcast(ctx: any) {
    try {
      // Answer callback query first
      if (ctx.callbackQuery) {
        await ctx.answerCallbackQuery();
      }

      // Get admin info
      let admin;
      try {
        admin = await this.adminService.getAdminByTelegramId(
          String(ctx.from.id),
        );
      } catch (adminError) {
        this.logger.error('Error fetching admin:', adminError);
        console.error('ADMIN ERROR:', adminError);
        if (adminError instanceof Error) {
          this.logger.error('Error message:', adminError.message);
          this.logger.error('Error stack:', adminError.stack);
        }
        throw adminError;
      }

      if (!admin) {
        await ctx.reply('⛔️ Admin topilmadi.');
        return;
      }

      // Start session
      this.sessionService.startSession(
        ctx.from.id,
        AdminState.BROADCAST_PREMIERE,
      );
      this.sessionService.updateSessionData(ctx.from.id, {});

      await ctx.reply(
        '🎬 Kino yoki serial kodini kiriting:\n\n' + 'Masalan: 100 200 300',
        {
          reply_markup: {
            keyboard: [[{ text: '❌ Bekor qilish' }]],
            resize_keyboard: true,
          },
        },
      );
    } catch (error) {
      this.logger.error('Error starting premiere broadcast:', error);
      console.error('PREMIERE ERROR:', error);
      if (error instanceof Error) {
        this.logger.error('Error message:', error.message);
        this.logger.error('Error name:', error.name);
        this.logger.error('Error stack:', error.stack);
      } else {
        this.logger.error('Non-Error object thrown:', typeof error, error);
      }
      try {
        await ctx.reply('❌ Xatolik yuz berdi.');
      } catch (replyError) {
        this.logger.error('Could not send error reply:', replyError);
      }
    }
  }

  private async handlePremiereBroadcastSteps(
    ctx: any,
    text: string,
    session: any,
  ) {
    try {
      // Check for cancel
      if (text === '❌ Bekor qilish') {
        this.sessionService.clearSession(ctx.from.id);
        const admin = await this.adminService.getAdminByTelegramId(
          String(ctx.from.id),
        );
        await ctx.reply(
          '❌ Bekor qilindi',
          AdminKeyboard.getAdminMainMenu(admin?.role || 'ADMIN'),
        );
        return;
      }

      // Parse code - check if serial (starts with 's') or movie
      const isSerial = text.toLowerCase().startsWith('s');
      const code = isSerial ? text.substring(1) : text;

      if (!code || isNaN(Number(code))) {
        await ctx.reply(
          "❌ Noto'g'ri format! Masalan: 100 yoki s200\n\nQayta kiriting:",
        );
        return;
      }

      const codeNumber = parseInt(code);

      // Fetch content
      let content: any;
      let contentType: string;

      if (isSerial) {
        content = await this.prisma.serial.findUnique({
          where: { code: codeNumber },
          include: {
            episodes: true,
            field: true,
          },
        });
        contentType = 'serial';
      } else {
        content = await this.prisma.movie.findUnique({
          where: { code: codeNumber },
          include: {
            episodes: true,
            field: true,
          },
        });
        contentType = 'movie';
      }

      if (!content) {
        await ctx.reply(
          '❌ Kontent topilmadi!\n\nQayta kiriting yoki ❌ Bekor qilish tugmasini bosing:',
        );
        return;
      }

      // Get field info for channel link
      const field =
        content.field ||
        (await this.prisma.field.findUnique({
          where: { id: content.fieldId },
        }));

      // Get bot username
      const botInfo = await ctx.api.getMe();
      const botUsername = botInfo.username || 'bot';

      // Ask if admin wants to send to field channel
      const keyboard = new InlineKeyboard()
        .text(
          '📢 Ha, field kanalga yuborish',
          `send_to_field_${contentType}_${codeNumber}`,
        )
        .row()
        .text(
          '👥 Faqat foydalanuvchilarga',
          `broadcast_premiere_${contentType}_${codeNumber}`,
        )
        .row()
        .text('❌ Bekor qilish', 'cancel_premiere');

      // Get channel link - use channelLink field if available
      let channelLink = field?.channelLink || '';
      if (!channelLink && field?.name) {
        channelLink = `@${field.name}`;
      } else if (!channelLink) {
        channelLink = '@Kanal';
      }

      // Format message
      const caption =
        '╭────────────────────\n' +
        `├‣  ${isSerial ? 'Serial' : 'Kino'} nomi : ${content.title}\n` +
        `├‣  ${isSerial ? 'Serial' : 'Kino'} kodi: ${isSerial ? 's' : ''}${content.code}\n` +
        `├‣  Qism: ${content.episodes?.length || 0}\n` +
        `├‣  Janrlari: ${content.genre || "Noma'lum"}\n` +
        `├‣  Kanal: ${channelLink}\n` +
        '╰────────────────────\n' +
        `▶️ ${isSerial ? 'Serialning' : 'Kinoning'} to'liq qismini @${botUsername} dan tomosha qilishingiz mumkin!`;

      // Send preview to admin
      if (content.posterFileId) {
        await ctx.replyWithPhoto(content.posterFileId, {
          caption:
            "🎬 Premyera e'loni\n\n" +
            caption +
            '\n\n📢 Bu kontentni qayerga yubormoqchisiz?',
          reply_markup: keyboard,
        });
      } else {
        await ctx.reply(
          "🎬 Premyera e'loni\n\n" +
            caption +
            '\n\n📢 Bu kontentni qayerga yubormoqchisiz?',
          {
            reply_markup: keyboard,
          },
        );
      }

      // Save data to session
      this.sessionService.updateSession(ctx.from.id, {
        state: AdminState.BROADCAST_PREMIERE,
        data: {
          contentType,
          code: codeNumber,
          caption,
          poster: content.posterFileId,
          fieldId: content.fieldId,
          fieldChannelId: field?.channelId,
          databaseChannelId: field?.databaseChannelId,
        },
      });
    } catch (error) {
      this.logger.error('Error handling premiere broadcast steps:', error);
      await ctx.reply("❌ Xatolik yuz berdi. Qaytadan urinib ko'ring.");
      this.sessionService.clearSession(ctx.from.id);
    }
  }

  private async confirmPremiereBroadcast(ctx: any) {
    try {
      await ctx.answerCallbackQuery('📤 Yuborilmoqda...');

      // Get session data
      const session = this.sessionService.getSession(ctx.from.id);
      if (!session || !session.data) {
        await ctx.reply("❌ Ma'lumot topilmadi. Qaytadan urinib ko'ring.");
        return;
      }

      const { caption, poster, contentType, code } = session.data;

      // Get all active users
      const users = await this.prisma.user.findMany({
        where: { isBlocked: false },
      });

      // Get bot username
      const botInfo = await ctx.api.getMe();
      const botUsername = botInfo.username || 'bot';

      // Send to all users
      let successCount = 0;
      let failCount = 0;

      await ctx.editMessageReplyMarkup({
        reply_markup: { inline_keyboard: [] },
      });
      const statusMsg = await ctx.reply(
        `📤 Yuborish boshlandi...\n\n👥 Jami: ${users.length}\n✅ Yuborildi: 0\n❌ Xatolik: 0`,
      );

      for (const user of users) {
        try {
          // Create deep link button
          const deepLink = `https://t.me/${botUsername}?start=${contentType}_${code}`;
          const keyboard = {
            inline_keyboard: [[{ text: '▶️ Tomosha qilish', url: deepLink }]],
          };

          if (poster) {
            await ctx.api.sendPhoto(user.telegramId, poster, {
              caption,
              reply_markup: keyboard,
            });
          } else {
            await ctx.api.sendMessage(user.telegramId, caption, {
              reply_markup: keyboard,
            });
          }

          successCount++;

          // Update status every 10 users
          if (successCount % 10 === 0) {
            await ctx.api.editMessageText(
              ctx.chat.id,
              statusMsg.message_id,
              `📤 Yuborilmoqda...\n\n👥 Jami: ${users.length}\n✅ Yuborildi: ${successCount}\n❌ Xatolik: ${failCount}`,
            );
          }

          // Sleep to avoid rate limits (30 messages per second max)
          await new Promise((resolve) => setTimeout(resolve, 35));
        } catch (error) {
          failCount++;
          this.logger.error(`Error sending to user ${user.telegramId}:`, error);
        }
      }

      // Final status
      await ctx.api.editMessageText(
        ctx.chat.id,
        statusMsg.message_id,
        `✅ Yuborish tugadi!\n\n👥 Jami: ${users.length}\n✅ Yuborildi: ${successCount}\n❌ Xatolik: ${failCount}`,
      );

      // Clear session
      this.sessionService.clearSession(ctx.from.id);

      const admin = await this.adminService.getAdminByTelegramId(
        String(ctx.from.id),
      );
      await ctx.reply(
        "✅ Premyera e'loni yuborildi!",
        AdminKeyboard.getAdminMainMenu(admin?.role || 'ADMIN'),
      );
    } catch (error) {
      this.logger.error('Error confirming premiere broadcast:', error);
      await ctx.reply('❌ Xatolik yuz berdi.');
      this.sessionService.clearSession(ctx.from.id);
    }
  }

  private async startTelegramPremiumBroadcast(ctx: any) {
    try {
      // Answer callback query first
      if (ctx.callbackQuery) {
        await ctx.answerCallbackQuery();
      }
      let admin;
      try {
        admin = await this.adminService.getAdminByTelegramId(
          String(ctx.from.id),
        );
      } catch (adminError) {
        this.logger.error('Error fetching admin:', adminError);
        console.error('ADMIN ERROR (Telegram Premium):', adminError);
        if (adminError instanceof Error) {
          this.logger.error('Error message:', adminError.message);
          this.logger.error('Error stack:', adminError.stack);
        }
        throw adminError;
      }

      if (!admin) {
        await ctx.reply('⛔️ Admin topilmadi.');
        return;
      }

      // Get count of Telegram Premium users
      let premiumUserCount = 0;
      try {
        premiumUserCount = await this.prisma.user.count({
          where: {
            hasTelegramPremium: true,
            isBlocked: false,
          },
        });
      } catch (dbError) {
        this.logger.error('Database error counting premium users:', dbError);
        // Continue with count = 0
      }

      // Start session
      this.sessionService.startSession(
        ctx.from.id,
        AdminState.BROADCAST_TELEGRAM_PREMIUM,
      );
      this.sessionService.updateSessionData(ctx.from.id, {});

      await ctx.reply(
        `⭐️ Telegram Premium foydalanuvchilarga xabar yuborish\n\n` +
          `👥 Telegram Premium foydalanuvchilar soni: ${premiumUserCount}\n\n` +
          `📝 Yubormoqchi bo'lgan xabaringizni kiriting:`,
        {
          reply_markup: {
            keyboard: [[{ text: '❌ Bekor qilish' }]],
            resize_keyboard: true,
          },
        },
      );
    } catch (error) {
      this.logger.error('Error starting Telegram Premium broadcast:', error);
      console.error('TELEGRAM PREMIUM ERROR:', error);
      if (error instanceof Error) {
        this.logger.error('Error message:', error.message);
        this.logger.error('Error name:', error.name);
        this.logger.error('Error stack:', error.stack);
      } else {
        this.logger.error('Non-Error object thrown:', typeof error, error);
      }
      try {
        await ctx.reply('❌ Xatolik yuz berdi.');
      } catch (replyError) {
        this.logger.error('Could not send error reply:', replyError);
      }
    }
  }

  private async handleTelegramPremiumBroadcastSteps(
    ctx: any,
    text: string,
    session: any,
  ) {
    try {
      // Check for cancel
      if (text === '❌ Bekor qilish') {
        this.sessionService.clearSession(ctx.from.id);
        const admin = await this.adminService.getAdminByTelegramId(
          String(ctx.from.id),
        );
        await ctx.reply(
          '❌ Bekor qilindi',
          AdminKeyboard.getAdminMainMenu(admin?.role || 'ADMIN'),
        );
        return;
      }

      // Get message text
      const message = text;

      // Get all Telegram Premium users
      const telegramPremiumUsers = await this.prisma.user.findMany({
        where: {
          hasTelegramPremium: true,
          isBlocked: false,
        },
      });

      // Show confirmation
      await ctx.reply(
        `📤 Quyidagi xabar barcha Telegram Premium foydalanuvchilarga yuboriladi:\n\n` +
          `━━━━━━━━━━━━━━━━━━\n${message}\n━━━━━━━━━━━━━━━━━━\n\n` +
          `👥 Qabul qiluvchilar: ${telegramPremiumUsers.length} ta\n\n` +
          `Tasdiqlaysizmi?`,
        {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: '✅ Tasdiqlash',
                  callback_data: 'confirm_telegram_premium_broadcast',
                },
                {
                  text: '❌ Bekor qilish',
                  callback_data: 'cancel_telegram_premium_broadcast',
                },
              ],
            ],
          },
        },
      );

      // Save message to session
      this.sessionService.updateSession(ctx.from.id, {
        state: AdminState.BROADCAST_TELEGRAM_PREMIUM,
        data: {
          message,
          userCount: telegramPremiumUsers.length,
        },
      });
    } catch (error) {
      this.logger.error(
        'Error handling Telegram Premium broadcast steps:',
        error,
      );
      await ctx.reply("❌ Xatolik yuz berdi. Qaytadan urinib ko'ring.");
      this.sessionService.clearSession(ctx.from.id);
    }
  }

  private async confirmTelegramPremiumBroadcast(ctx: any) {
    try {
      await ctx.answerCallbackQuery('📤 Yuborilmoqda...');

      // Get session data
      const session = this.sessionService.getSession(ctx.from.id);
      if (!session || !session.data) {
        await ctx.reply("❌ Ma'lumot topilmadi. Qaytadan urinib ko'ring.");
        return;
      }

      const { message } = session.data;

      // Get all Telegram Premium users
      const telegramPremiumUsers = await this.prisma.user.findMany({
        where: {
          hasTelegramPremium: true,
          isBlocked: false,
        },
      });

      // Send to all Telegram Premium users
      let successCount = 0;
      let failCount = 0;

      await ctx.editMessageReplyMarkup({
        reply_markup: { inline_keyboard: [] },
      });
      const statusMsg = await ctx.reply(
        `📤 Yuborish boshlandi...\n\n👥 Jami: ${telegramPremiumUsers.length}\n✅ Yuborildi: 0\n❌ Xatolik: 0`,
      );

      for (const user of telegramPremiumUsers) {
        try {
          await ctx.api.sendMessage(user.telegramId, message, {
            parse_mode: 'HTML',
          });

          successCount++;

          // Update status every 10 users
          if (successCount % 10 === 0) {
            await ctx.api.editMessageText(
              ctx.chat.id,
              statusMsg.message_id,
              `📤 Yuborilmoqda...\n\n👥 Jami: ${telegramPremiumUsers.length}\n✅ Yuborildi: ${successCount}\n❌ Xatolik: ${failCount}`,
            );
          }

          // Sleep to avoid rate limits
          await new Promise((resolve) => setTimeout(resolve, 35));
        } catch (error) {
          failCount++;
          this.logger.error(`Error sending to user ${user.telegramId}:`, error);
        }
      }

      // Final status
      await ctx.api.editMessageText(
        ctx.chat.id,
        statusMsg.message_id,
        `✅ Yuborish tugadi!\n\n👥 Jami: ${telegramPremiumUsers.length}\n✅ Yuborildi: ${successCount}\n❌ Xatolik: ${failCount}`,
      );

      // Clear session
      this.sessionService.clearSession(ctx.from.id);

      const admin = await this.adminService.getAdminByTelegramId(
        String(ctx.from.id),
      );
      await ctx.reply(
        '✅ Xabar Telegram Premium foydalanuvchilarga yuborildi!',
        AdminKeyboard.getAdminMainMenu(admin?.role || 'ADMIN'),
      );
    } catch (error) {
      this.logger.error('Error confirming Telegram Premium broadcast:', error);
      await ctx.reply('❌ Xatolik yuz berdi.');
      this.sessionService.clearSession(ctx.from.id);
    }
  }

  private async showAllUsers(ctx: BotContext) {
    try {
      const admin = await this.getAdmin(ctx);
      if (!admin) return;

      // Get all users with pagination
      const users = await this.prisma.user.findMany({
        take: 50, // Show first 50 users
        orderBy: [{ createdAt: 'desc' }],
        select: {
          id: true,
          telegramId: true,
          username: true,
          firstName: true,
          lastName: true,
          isPremium: true,
          isBlocked: true,
          hasTelegramPremium: true,
          createdAt: true,
        },
      });

      if (users.length === 0) {
        await ctx.reply('❌ Foydalanuvchilar topilmadi.');
        return;
      }

      let message = '👥 **Barcha foydalanuvchilar** (50 ta):\n\n';

      users.forEach((user, index) => {
        const status = user.isBlocked ? '🚫' : user.isPremium ? '💎' : '👤';
        const username = user.username ? `@${user.username}` : "Username yo'q";
        const name = user.firstName || "Ism yo'q";

        message += `${index + 1}. ${status} ${name} (${username})\n`;
        message += `   ID: \`${user.telegramId}\`\n`;
        if (user.hasTelegramPremium) message += `   ⭐️ Telegram Premium\n`;
        message += `\n`;
      });

      await ctx.reply(message, { parse_mode: 'Markdown' });
    } catch (error) {
      this.logger.error('Error showing all users:', error);
      this.logger.error('Error details:', {
        message: error?.message,
        stack: error?.stack,
        code: error?.code,
      });
      await ctx.reply('❌ Xatolik yuz berdi.');
    }
  }

  private async startBlockUser(ctx: BotContext) {
    try {
      const admin = await this.getAdmin(ctx);
      if (!admin) return;

      // Start session
      this.sessionService.startSession(ctx.from!.id, AdminState.BLOCK_USER);
      this.sessionService.updateSessionData(ctx.from!.id, {});

      await ctx.reply(
        '🚫 **Foydalanuvchini bloklash**\n\n' +
          'Bloklash uchun foydalanuvchining username yoki Telegram ID raqamini kiriting:\n\n' +
          '📝 Username: @username yoki username\n' +
          '🆔 Telegram ID: 123456789\n\n' +
          'Ikkalasidan birini kiriting.',
        {
          parse_mode: 'Markdown',
          reply_markup: {
            keyboard: [[{ text: '❌ Bekor qilish' }]],
            resize_keyboard: true,
          },
        },
      );
    } catch (error) {
      this.logger.error('Error starting block user:', error);
      await ctx.reply('❌ Xatolik yuz berdi.');
    }
  }

  private async handleBlockUserSteps(ctx: any, text: string, session: any) {
    try {
      // Check for cancel
      if (text === '❌ Bekor qilish') {
        this.sessionService.clearSession(ctx.from.id);
        const admin = await this.adminService.getAdminByTelegramId(
          String(ctx.from.id),
        );
        await ctx.reply(
          '❌ Bekor qilindi',
          AdminKeyboard.getAdminMainMenu(admin?.role || 'ADMIN'),
        );
        return;
      }

      // Check if input is numeric (Telegram ID) or text (username)
      const isNumeric = /^\d+$/.test(text.trim());
      let user;

      if (isNumeric) {
        // Search by Telegram ID
        const telegramId = text.trim();
        user = await this.prisma.user.findFirst({
          where: { telegramId: telegramId },
        });
      } else {
        // Parse username (remove @ if exists)
        const username = text.startsWith('@') ? text.substring(1) : text;
        // Search by username
        user = await this.prisma.user.findFirst({
          where: { username: username },
        });
      }

      if (!user) {
        await ctx.reply(
          '❌ Foydalanuvchi topilmadi!\n\n' +
            "Iltimos, to'g'ri username yoki Telegram ID kiriting:",
        );
        return;
      }

      // Check if already blocked
      if (user.isBlocked) {
        await ctx.reply(
          `⚠️ Bu foydalanuvchi allaqachon bloklangan!\n\n` +
            `👤 Ism: ${user.firstName || "Noma'lum"}\n` +
            `📝 Username: @${user.username}\n` +
            `🚫 Bloklangan sana: ${user.blockedAt?.toLocaleString('uz-UZ') || "Noma'lum"}`,
        );
        this.sessionService.clearSession(ctx.from.id);
        return;
      }

      // Show confirmation
      await ctx.reply(
        `⚠️ **Tasdiqlash**\n\n` +
          `Haqiqatdan ham quyidagi foydalanuvchini bloklaysizmi?\n\n` +
          `👤 Ism: ${user.firstName || "Noma'lum"}\n` +
          `📝 Username: @${user.username}\n` +
          `🆔 Telegram ID: \`${user.telegramId}\`\n` +
          `📅 Ro'yxatdan o'tgan: ${user.createdAt.toLocaleString('uz-UZ')}\n\n` +
          `Bu foydalanuvchi botdan qaytib foydalana olmaydi!`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: '✅ Ha, bloklash',
                  callback_data: `confirm_block_user_${user.id}`,
                },
                {
                  text: "❌ Yo'q",
                  callback_data: 'cancel_block_user',
                },
              ],
            ],
          },
        },
      );

      // Save user ID to session
      this.sessionService.updateSession(ctx.from.id, {
        state: AdminState.BLOCK_USER,
        data: { userId: user.id, username: user.username },
      });
    } catch (error) {
      this.logger.error('Error handling block user steps:', error);
      await ctx.reply("❌ Xatolik yuz berdi. Qaytadan urinib ko'ring.");
      this.sessionService.clearSession(ctx.from.id);
    }
  }

  private async confirmBlockUser(ctx: any) {
    try {
      await ctx.answerCallbackQuery();

      // Get session data
      const session = this.sessionService.getSession(ctx.from.id);
      if (!session || !session.data || !session.data.userId) {
        await ctx.reply("❌ Ma'lumot topilmadi. Qaytadan urinib ko'ring.");
        return;
      }

      const { userId, username } = session.data;

      // Block user
      const user = await this.prisma.user.update({
        where: { id: userId },
        data: {
          isBlocked: true,
          blockedAt: new Date(),
          blockReason: `Admin tomonidan bloklangan: ${ctx.from.username || ctx.from.id}`,
        },
      });

      // Clear session
      this.sessionService.clearSession(ctx.from.id);

      // Edit message to remove buttons
      await ctx.editMessageReplyMarkup({
        reply_markup: { inline_keyboard: [] },
      });

      const admin = await this.adminService.getAdminByTelegramId(
        String(ctx.from.id),
      );
      await ctx.reply(
        `✅ Foydalanuvchi bloklandi!\n\n` +
          `👤 Ism: ${user.firstName || "Noma'lum"}\n` +
          `📝 Username: @${username}\n` +
          `🚫 Bloklangan sana: ${new Date().toLocaleString('uz-UZ')}`,
        AdminKeyboard.getAdminMainMenu(admin?.role || 'ADMIN'),
      );
    } catch (error) {
      this.logger.error('Error confirming block user:', error);
      this.logger.error('Error details:', {
        message: error?.message,
        stack: error?.stack,
        code: error?.code,
      });
      await ctx.reply("❌ Xatolik yuz berdi. Admin bilan bog'laning.");
      this.sessionService.clearSession(ctx.from.id);
    }
  }

  // ==================== UNBLOCK USER ====================
  private async startUnblockUser(ctx: BotContext) {
    try {
      const admin = await this.getAdmin(ctx);
      if (!admin) return;

      // Start session
      this.sessionService.startSession(ctx.from!.id, AdminState.UNBLOCK_USER);
      this.sessionService.updateSessionData(ctx.from!.id, {});

      await ctx.reply(
        '✅ **Foydalanuvchini blokdan ochish**\n\n' +
          'Blokdan ochish uchun foydalanuvchining username yoki Telegram ID raqamini kiriting:\n\n' +
          '📝 Username: @username yoki username\n' +
          '🆔 Telegram ID: 123456789\n\n' +
          'Ikkalasidan birini kiriting.',
        {
          parse_mode: 'Markdown',
          reply_markup: {
            keyboard: [[{ text: '❌ Bekor qilish' }]],
            resize_keyboard: true,
          },
        },
      );
    } catch (error) {
      this.logger.error('Error starting unblock user:', error);
      await ctx.reply('❌ Xatolik yuz berdi.');
    }
  }

  private async handleUnblockUserSteps(ctx: any, text: string, session: any) {
    try {
      // Check for cancel
      if (text === '❌ Bekor qilish') {
        this.sessionService.clearSession(ctx.from.id);
        const admin = await this.adminService.getAdminByTelegramId(
          String(ctx.from.id),
        );
        await ctx.reply(
          '❌ Bekor qilindi',
          AdminKeyboard.getAdminMainMenu(admin?.role || 'ADMIN'),
        );
        return;
      }

      // Check if input is numeric (Telegram ID) or text (username)
      const isNumeric = /^\d+$/.test(text.trim());
      let user;

      if (isNumeric) {
        // Search by Telegram ID
        const telegramId = text.trim();
        user = await this.prisma.user.findFirst({
          where: { telegramId: telegramId },
        });
      } else {
        // Parse username (remove @ if exists)
        const username = text.startsWith('@') ? text.substring(1) : text;
        // Search by username
        user = await this.prisma.user.findFirst({
          where: { username: username },
        });
      }

      if (!user) {
        await ctx.reply(
          '❌ Foydalanuvchi topilmadi!\n\n' +
            "Iltimos, to'g'ri username yoki Telegram ID kiriting:",
        );
        return;
      }

      // Check if not blocked
      if (!user.isBlocked) {
        await ctx.reply(
          `⚠️ Bu foydalanuvchi bloklanmagan!\n\n` +
            `👤 Ism: ${user.firstName || "Noma'lum"}\n` +
            `📝 Username: @${user.username}\n` +
            `✅ Holati: Faol`,
        );
        this.sessionService.clearSession(ctx.from.id);
        return;
      }

      // Show confirmation
      await ctx.reply(
        `⚠️ **Tasdiqlash**\n\n` +
          `Haqiqatdan ham quyidagi foydalanuvchini blokdan ochasizmi?\n\n` +
          `👤 Ism: ${user.firstName || "Noma'lum"}\n` +
          `📝 Username: @${user.username}\n` +
          `🆔 Telegram ID: \`${user.telegramId}\`\n` +
          `🚫 Bloklangan: ${user.blockedAt?.toLocaleString('uz-UZ') || "Noma'lum"}\n` +
          `📝 Sabab: ${user.blockReason || "Noma'lum"}\n\n` +
          `Bu foydalanuvchi qayta botdan foydalana oladi!`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: '✅ Ha, ochish',
                  callback_data: `confirm_unblock_user_${user.id}`,
                },
                {
                  text: "❌ Yo'q",
                  callback_data: 'cancel_unblock_user',
                },
              ],
            ],
          },
        },
      );

      // Save user ID to session
      this.sessionService.updateSession(ctx.from.id, {
        state: AdminState.UNBLOCK_USER,
        data: { userId: user.id, username: user.username },
      });
    } catch (error) {
      this.logger.error('Error handling unblock user steps:', error);
      await ctx.reply("❌ Xatolik yuz berdi. Qaytadan urinib ko'ring.");
      this.sessionService.clearSession(ctx.from.id);
    }
  }

  private async confirmUnblockUser(ctx: any) {
    try {
      await ctx.answerCallbackQuery();

      // Get session data
      const session = this.sessionService.getSession(ctx.from.id);
      if (!session || !session.data || !session.data.userId) {
        await ctx.reply("❌ Ma'lumot topilmadi. Qaytadan urinib ko'ring.");
        return;
      }

      const { userId, username } = session.data;

      // Unblock user
      const user = await this.prisma.user.update({
        where: { id: userId },
        data: {
          isBlocked: false,
          blockedAt: null,
          blockReason: null,
        },
      });

      // Clear session
      this.sessionService.clearSession(ctx.from.id);

      // Edit message to remove buttons
      await ctx.editMessageReplyMarkup({
        reply_markup: { inline_keyboard: [] },
      });

      const admin = await this.adminService.getAdminByTelegramId(
        String(ctx.from.id),
      );
      await ctx.reply(
        `✅ Foydalanuvchi blokdan ochildi!\n\n` +
          `👤 Ism: ${user.firstName || "Noma'lum"}\n` +
          `📝 Username: @${username}\n` +
          `✅ Holati: Faol\n` +
          `📅 Sana: ${new Date().toLocaleString('uz-UZ')}`,
        AdminKeyboard.getAdminMainMenu(admin?.role || 'ADMIN'),
      );
    } catch (error) {
      this.logger.error('Error confirming unblock user:', error);
      this.logger.error('Error details:', {
        message: error?.message,
        stack: error?.stack,
        code: error?.code,
      });
      await ctx.reply("❌ Xatolik yuz berdi. Admin bilan bog'laning.");
      this.sessionService.clearSession(ctx.from.id);
    }
  }

  // ==================== PREMIUM BANNED USERS ====================
  private async showPremiumBannedUsersMenu(ctx: BotContext) {
    try {
      const admin = await this.getAdmin(ctx);
      if (!admin) return;

      // Store context so we know where to go back
      if (ctx.from) {
        this.sessionService.updateSessionData(ctx.from.id, {
          menuContext: 'premium_banned',
        });
      }

      const keyboard = new Keyboard()
        .text("👥 Hamma userlarni ko'rish")
        .text('🔍 Qidirish')
        .row()
        .text("💳 To'lovlar menyusiga qaytish");

      await ctx.reply(
        '🚫 **Premium banned users**\n\n' +
          "Yolg'on to'lov ma'lumotlarini ishlatgan va premium'dan bloklangan foydalanuvchilar.",
        {
          parse_mode: 'Markdown',
          reply_markup: keyboard.resized(),
        },
      );
    } catch (error) {
      this.logger.error('Error showing premium banned users menu:', error);
      await ctx.reply('❌ Xatolik yuz berdi.');
    }
  }

  private async showAllPremiumBannedUsers(ctx: BotContext) {
    try {
      const admin = await this.getAdmin(ctx);
      if (!admin) return;

      const bannedUsers = await this.prisma.user.findMany({
        where: { isPremiumBanned: true },
        orderBy: { premiumBannedAt: 'desc' },
        take: 50,
      });

      if (bannedUsers.length === 0) {
        await ctx.reply("✅ Premium'dan bloklangan foydalanuvchilar yo'q.");
        return;
      }

      let message = '🚫 **Premium banned users** (50 ta):\n\n';

      bannedUsers.forEach((user, index) => {
        const username = user.username ? `@${user.username}` : "Username yo'q";
        const name = user.firstName || "Ism yo'q";
        const banDate = user.premiumBannedAt
          ? user.premiumBannedAt.toLocaleDateString('uz-UZ')
          : "Noma'lum";

        message += `${index + 1}. ${name} (${username})\n`;
        message += `   ID: \`${user.telegramId}\`\n`;
        message += `   ⚠️ Ogohlantirish: ${user.premiumBanCount}/2\n`;
        message += `   📅 Ban sanasi: ${banDate}\n\n`;
      });

      message +=
        '\n🔍 Foydalanuvchini qidirish uchun "Qidirish" tugmasini bosing.';

      await ctx.reply(message, { parse_mode: 'Markdown' });
    } catch (error) {
      this.logger.error('Error showing all premium banned users:', error);
      await ctx.reply('❌ Xatolik yuz berdi.');
    }
  }

  private async startSearchPremiumBannedUser(ctx: BotContext) {
    try {
      const admin = await this.getAdmin(ctx);
      if (!admin || !ctx.from) return;

      this.sessionService.startSession(
        ctx.from.id,
        AdminState.UNBAN_PREMIUM_USER,
      );
      this.sessionService.updateSessionData(ctx.from.id, { step: 'search' });

      await ctx.reply(
        '🔍 Foydalanuvchini qidirish\n\n' +
          'Username (@ belgisisiz) yoki User ID ni kiriting:',
        AdminKeyboard.getCancelButton(),
      );
    } catch (error) {
      this.logger.error('Error starting search premium banned user:', error);
      await ctx.reply('❌ Xatolik yuz berdi.');
    }
  }

  private async handleUnbanPremiumUserSteps(
    ctx: BotContext,
    text: string,
    session: any,
  ) {
    try {
      const admin = await this.getAdmin(ctx);
      if (!admin || !ctx.from) return;

      const step = session.data?.step || 'search';

      if (step === 'search') {
        // Search user by username or ID
        let user = null;

        // Try to find by username (remove @ if present)
        const username = text.replace('@', '');
        user = await this.prisma.user.findFirst({
          where: {
            OR: [{ username: username }, { telegramId: text }],
          },
        });

        if (!user) {
          await ctx.reply(
            '❌ Foydalanuvchi topilmadi.\n\n' +
              'Qaytadan kiriting yoki bekor qiling:',
            AdminKeyboard.getCancelButton(),
          );
          return;
        }

        if (!user.isPremiumBanned) {
          await ctx.reply(
            "⚠️ Bu foydalanuvchi premium'dan bloklanmagan.\n\n" +
              'Boshqa foydalanuvchini qidiring:',
            AdminKeyboard.getCancelButton(),
          );
          return;
        }

        // Show confirmation
        const username_display = user.username
          ? `@${user.username}`
          : "Username yo'q";
        const banDate = user.premiumBannedAt
          ? user.premiumBannedAt.toLocaleDateString('uz-UZ')
          : "Noma'lum";

        await ctx.reply(
          `📋 **Foydalanuvchi topildi:**\n\n` +
            `👤 Ism: ${user.firstName || "Noma'lum"}\n` +
            `📝 Username: ${username_display}\n` +
            `🆔 ID: \`${user.telegramId}\`\n` +
            `⚠️ Ogohlantirish: ${user.premiumBanCount}/2\n` +
            `📅 Ban sanasi: ${banDate}\n\n` +
            `❓ Haqiqatdan ham bu foydalanuvchini premium ban'dan ochmoqchimisiz?`,
          {
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: '✅ Ha, ochish',
                    callback_data: `confirm_unban_premium_${user.id}`,
                  },
                  { text: "❌ Yo'q", callback_data: 'cancel_unban_premium' },
                ],
              ],
            },
          },
        );

        // Update session
        this.sessionService.updateSessionData(ctx.from.id, {
          step: 'confirm',
          userId: user.id,
          username: user.username,
        });
      }
    } catch (error) {
      this.logger.error('Error handling unban premium user steps:', error);
      await ctx.reply('❌ Xatolik yuz berdi.');
      this.sessionService.clearSession(ctx.from.id);
    }
  }

  private async confirmUnbanPremiumUser(ctx: any) {
    try {
      await ctx.answerCallbackQuery();

      // Get session data
      const session = this.sessionService.getSession(ctx.from.id);
      if (!session || !session.data || !session.data.userId) {
        await ctx.reply("❌ Ma'lumot topilmadi. Qaytadan urinib ko'ring.");
        return;
      }

      const { userId, username } = session.data;

      // Unban user from premium
      const user = await this.prisma.user.update({
        where: { id: userId },
        data: {
          isPremiumBanned: false,
          premiumBannedAt: null,
          premiumBanCount: 0, // Reset counter
        },
      });

      // Notify user
      try {
        await this.grammyBot.bot.api.sendMessage(
          user.telegramId,
          '✅ **Yaxshi xabar!**\n\n' +
            'Sizning premium ban blokingiz ochildi. Endi premium sotib olishingiz mumkin.\n\n' +
            "💡 Iltimos, to'g'ri to'lov ma'lumotlarini yuboring.",
          { parse_mode: 'Markdown' },
        );
      } catch (error) {
        this.logger.error('Error notifying user:', error);
      }

      // Clear session
      this.sessionService.clearSession(ctx.from.id);

      // Edit message to remove buttons
      await ctx.editMessageReplyMarkup({
        reply_markup: { inline_keyboard: [] },
      });

      const admin = await this.adminService.getAdminByTelegramId(
        String(ctx.from.id),
      );
      await ctx.reply(
        `✅ Foydalanuvchi premium ban'dan ochildi!\n\n` +
          `👤 Ism: ${user.firstName || "Noma'lum"}\n` +
          `📝 Username: @${username || "Noma'lum"}\n` +
          `🔓 Ochilgan sana: ${new Date().toLocaleString('uz-UZ')}`,
        AdminKeyboard.getAdminMainMenu(admin?.role || 'ADMIN'),
      );
    } catch (error) {
      this.logger.error('Error confirming unban premium user:', error);
      await ctx.reply('❌ Xatolik yuz berdi.');
      this.sessionService.clearSession(ctx.from.id);
    }
  }

  private async cancelUnbanPremium(ctx: any) {
    try {
      await ctx.answerCallbackQuery();
      await ctx.editMessageReplyMarkup({
        reply_markup: { inline_keyboard: [] },
      });

      this.sessionService.clearSession(ctx.from.id);

      const admin = await this.adminService.getAdminByTelegramId(
        String(ctx.from.id),
      );
      await ctx.reply(
        '❌ Bekor qilindi.',
        AdminKeyboard.getAdminMainMenu(admin?.role || 'ADMIN'),
      );
    } catch (error) {
      this.logger.error('Error canceling unban premium:', error);
    }
  }

  // ==================== DELETE CONTENT BY CODE ====================
  private async startDeleteContent(ctx: BotContext) {
    const admin = await this.getAdmin(ctx);
    if (!admin) return;

    // Check permission
    if (admin.role !== 'SUPERADMIN' && !admin.canDeleteContent) {
      await ctx.reply("❌ Sizda kontent o'chirish huquqi yo'q!");
      return;
    }

    this.sessionService.createSession(ctx.from.id, AdminState.DELETE_CONTENT);

    await ctx.reply(
      "🗑️ **Kontent o'chirish**\n\n" +
        '🔢 Kino yoki serial kodini kiriting:\n\n' +
        '**Misol:** 100, 200, 350\n\n' +
        '⚠️ **Ogohlantirish:**\n' +
        '• Bu amal qaytarilmaydi!\n' +
        "• Barcha qismlar va tarix o'chiriladi\n" +
        "• Kod bo'sh holatga qaytadi",
      { parse_mode: 'Markdown', reply_markup: { remove_keyboard: true } },
    );
  }

  private async handleDeleteContentSteps(ctx: BotContext) {
    const session = this.sessionService.getSession(ctx.from.id);
    if (!session || session.state !== AdminState.DELETE_CONTENT) return;

    const text = ctx.message?.text?.trim();
    if (!text) return;

    // Parse code: just a number
    const codeMatch = text.match(/^(\d+)$/);

    if (!codeMatch) {
      await ctx.reply(
        "❌ Noto'g'ri format!\n\n" + 'Faqat raqam kiriting, masalan: 100, 200',
      );
      return;
    }

    const code = codeMatch[1];

    try {
      // Check if movie exists
      const movie = await this.prisma.movie.findUnique({
        where: { code: parseInt(code) },
      });

      // Check if serial exists
      const serial = await this.prisma.serial.findUnique({
        where: { code: parseInt(code) },
      });

      if (movie) {
        await this.deleteMovieByCode(ctx, code);
      } else if (serial) {
        await this.deleteSerialByCode(ctx, code);
      } else {
        await ctx.reply(`❌ ${code} kodli kontent topilmadi!`);
      }
    } catch (error) {
      this.logger.error('Error deleting content:', error);
      await ctx.reply('❌ Xatolik yuz berdi: ' + error.message);
    }

    this.sessionService.clearSession(ctx.from.id);
  }

  private async deleteMovieByCode(ctx: BotContext, code: string) {
    const movie = await this.prisma.movie.findUnique({
      where: { code: parseInt(code) },
      include: { episodes: true },
    });

    if (!movie) {
      await ctx.reply(`❌ ${code} kodli kino topilmadi!`);
      return;
    }

    // Confirmation
    const keyboard = new InlineKeyboard()
      .text(`✅ Ha, o'chirish`, `confirm_delete_movie_${code}`)
      .text('❌ Bekor qilish', 'cancel_delete_content');

    await ctx.reply(
      `⚠️ **Tasdiqlash kerak!**\n\n` +
        `🎬 Kino: ${movie.title}\n` +
        `🆔 Kod: ${code}\n` +
        `📹 Qismlar: ${movie.episodes.length}\n\n` +
        `Bu kinoni va unga bog'langan barcha ma'lumotlarni o'chirmoqchimisiz?`,
      { parse_mode: 'Markdown', reply_markup: keyboard },
    );
  }

  private async deleteSerialByCode(ctx: BotContext, code: string) {
    const serial = await this.prisma.serial.findUnique({
      where: { code: parseInt(code) },
      include: { episodes: true },
    });

    if (!serial) {
      await ctx.reply(`❌ ${code} kodli serial topilmadi!`);
      return;
    }

    // Confirmation
    const keyboard = new InlineKeyboard()
      .text(`✅ Ha, o'chirish`, `confirm_delete_serial_${code}`)
      .text('❌ Bekor qilish', 'cancel_delete_content');

    await ctx.reply(
      `⚠️ **Tasdiqlash kerak!**\n\n` +
        `📺 Serial: ${serial.title}\n` +
        `🆔 Kod: ${code}\n` +
        `📹 Qismlar: ${serial.episodes.length}\n\n` +
        `Bu serialni va unga bog'langan barcha ma'lumotlarni o'chirmoqchimisiz?`,
      { parse_mode: 'Markdown', reply_markup: keyboard },
    );
  }

  private async confirmDeleteMovie(ctx: any) {
    const code = ctx.match[1];

    try {
      await ctx.answerCallbackQuery();
      await ctx.editMessageReplyMarkup({
        reply_markup: { inline_keyboard: [] },
      });

      const movie = await this.prisma.movie.findUnique({
        where: { code: parseInt(code) },
        include: {
          episodes: true,
          field: {
            include: {
              databaseChannel: true,
            },
          },
        },
      });

      if (!movie) {
        await ctx.reply(`❌ ${code} kodli kino topilmadi!`);
        return;
      }

      // Delete message from field channel if exists
      if (movie.channelMessageId && movie.field?.channelId) {
        try {
          await ctx.api.deleteMessage(
            movie.field.channelId,
            movie.channelMessageId,
          );
        } catch (error) {
          // Silently ignore error
        }
      }

      // Delete message from database channel if exists
      if (movie.channelMessageId && movie.field?.databaseChannel?.channelId) {
        try {
          await ctx.api.deleteMessage(
            movie.field.databaseChannel.channelId,
            movie.channelMessageId,
          );
        } catch (error) {
          // Silently ignore error
        }
      }

      // Delete all episodes
      await this.prisma.movieEpisode.deleteMany({
        where: { movieId: movie.id },
      });

      // Delete watch history
      await this.prisma.watchHistory.deleteMany({
        where: { movieId: movie.id },
      });

      // Delete the movie
      await this.prisma.movie.delete({
        where: { id: movie.id },
      });

      const admin = await this.adminService.getAdminByTelegramId(
        String(ctx.from.id),
      );
      await ctx.reply(
        `✅ **Kino muvaffaqiyatli o'chirildi!**\n\n` +
          `🎬 Nomi: ${movie.title}\n` +
          `🆔 Kod: ${code}\n` +
          `📹 O'chirilgan qismlar: ${movie.episodes.length}\n` +
          `📤 Kanallardan o'chirildi: ${movie.channelMessageId ? 'Ha' : "Yo'q"}\n\n` +
          `Kod endi bo'sh va qayta ishlatilishi mumkin.`,
        {
          parse_mode: 'Markdown',
          reply_markup: AdminKeyboard.getAdminMainMenu(admin?.role || 'ADMIN'),
        },
      );
    } catch (error) {
      this.logger.error('Error confirming delete movie:', error);
      await ctx.reply('❌ Xatolik yuz berdi: ' + error.message);
    }
  }

  private async confirmDeleteSerial(ctx: any) {
    const code = ctx.match[1];

    try {
      await ctx.answerCallbackQuery();
      await ctx.editMessageReplyMarkup({
        reply_markup: { inline_keyboard: [] },
      });

      const serial = await this.prisma.serial.findUnique({
        where: { code: parseInt(code) },
        include: {
          episodes: true,
          field: {
            include: {
              databaseChannel: true,
            },
          },
        },
      });

      if (!serial) {
        await ctx.reply(`❌ ${code} kodli serial topilmadi!`);
        return;
      }

      // Delete message from field channel if exists
      if (serial.channelMessageId && serial.field?.channelId) {
        try {
          await ctx.api.deleteMessage(
            serial.field.channelId,
            serial.channelMessageId,
          );
        } catch (error) {
          // Silently ignore error
        }
      }

      // Delete message from database channel if exists
      if (serial.channelMessageId && serial.field?.databaseChannel?.channelId) {
        try {
          await ctx.api.deleteMessage(
            serial.field.databaseChannel.channelId,
            serial.channelMessageId,
          );
        } catch (error) {
          // Silently ignore error
        }
      }

      // Delete all episodes
      await this.prisma.episode.deleteMany({
        where: { serialId: serial.id },
      });

      // Delete watch history
      await this.prisma.watchHistory.deleteMany({
        where: { serialId: serial.id },
      });

      // Delete the serial
      await this.prisma.serial.delete({
        where: { id: serial.id },
      });

      const admin = await this.adminService.getAdminByTelegramId(
        String(ctx.from.id),
      );
      await ctx.reply(
        `✅ **Serial muvaffaqiyatli o'chirildi!**\n\n` +
          `📺 Nomi: ${serial.title}\n` +
          `🆔 Kod: ${code}\n` +
          `📹 O'chirilgan qismlar: ${serial.episodes.length}\n` +
          `📤 Kanallardan o'chirildi: ${serial.channelMessageId ? 'Ha' : "Yo'q"}\n\n` +
          `Kod endi bo'sh va qayta ishlatilishi mumkin.`,
        {
          parse_mode: 'Markdown',
          reply_markup: AdminKeyboard.getAdminMainMenu(admin?.role || 'ADMIN'),
        },
      );
    } catch (error) {
      this.logger.error('Error confirming delete serial:', error);
      await ctx.reply('❌ Xatolik yuz berdi: ' + error.message);
    }
  }

  private async cancelDeleteContent(ctx: any) {
    try {
      await ctx.answerCallbackQuery();
      await ctx.editMessageReplyMarkup({
        reply_markup: { inline_keyboard: [] },
      });

      this.sessionService.clearSession(ctx.from.id);

      const admin = await this.adminService.getAdminByTelegramId(
        String(ctx.from.id),
      );
      await ctx.reply(
        "❌ O'chirish bekor qilindi.",
        AdminKeyboard.getAdminMainMenu(admin?.role || 'ADMIN'),
      );
    } catch (error) {
      this.logger.error('Error canceling delete:', error);
    }
  }

  // ==================== CLEAR CHANNEL HISTORY ====================
  private async clearChannelHistory(ctx: BotContext) {
    const admin = await this.getAdmin(ctx);
    if (!admin) return;

    // Only SuperAdmin can clear history
    if (admin.role !== 'SUPERADMIN') {
      await ctx.reply('❌ Faqat SuperAdmin tarixni tozalashi mumkin!');
      return;
    }

    const keyboard = new InlineKeyboard()
      .text('✅ Ha, tozalash', 'confirm_clear_history')
      .text('❌ Bekor qilish', 'cancel_clear_history');

    await ctx.reply(
      '⚠️ **Tasdiqlash kerak!**\n\n' +
        "Barcha majburiy kanallar tarixi o'chiriladi:\n" +
        "• Nofaol kanallar o'chiriladi\n" +
        '• Faol kanallar saqlanadi\n' +
        "• A'zolar va statistika tozalanadi\n\n" +
        'Davom etishni xohlaysizmi?',
      { parse_mode: 'Markdown', reply_markup: keyboard },
    );
  }

  private async confirmClearHistory(ctx: any) {
    try {
      await ctx.answerCallbackQuery('🗑️ Tozalanmoqda...');
      await ctx.editMessageReplyMarkup({
        reply_markup: { inline_keyboard: [] },
      });

      // Delete all inactive channels
      const result = await this.prisma.mandatoryChannel.deleteMany({
        where: { isActive: false },
      });

      // Reset active channels' member counts and pending requests
      await this.prisma.mandatoryChannel.updateMany({
        where: { isActive: true },
        data: {
          currentMembers: 0,
          pendingRequests: 0,
        },
      });

      const admin = await this.adminService.getAdminByTelegramId(
        String(ctx.from.id),
      );
      await ctx.reply(
        '✅ **Tarix muvaffaqiyatli tozalandi!**\n\n' +
          `🗑️ O'chirilgan nofaol kanallar: ${result.count}\n` +
          '📊 Faol kanallar statistikasi tozalandi\n\n' +
          'Tarix qaytadan boshlanadi.',
        {
          parse_mode: 'Markdown',
          reply_markup: AdminKeyboard.getAdminMainMenu(admin?.role || 'ADMIN'),
        },
      );
    } catch (error) {
      this.logger.error('Error clearing channel history:', error);
      await ctx.reply('❌ Xatolik yuz berdi: ' + error.message);
    }
  }

  // ==================== SEND TO FIELD CHANNEL ====================
  private async sendToFieldChannel(ctx: any) {
    try {
      await ctx.answerCallbackQuery('📤 Field kanalga yuborilmoqda...');

      const session = this.sessionService.getSession(ctx.from.id);
      if (!session || !session.data) {
        await ctx.reply("❌ Ma'lumot topilmadi.");
        return;
      }

      const { contentType, code, caption, poster, fieldId, databaseChannelId } =
        session.data;

      // First, try to get field channel
      let targetChannelId: string | null = null;
      let targetChannelName: string | null = null;

      // Option 1: Use field's direct channelId
      if (fieldId) {
        const field = await this.prisma.field.findUnique({
          where: { id: fieldId },
          include: { databaseChannel: true },
        });

        if (field) {
          // Use database channel if exists
          if (field.databaseChannel) {
            targetChannelId = field.databaseChannel.channelId;
            targetChannelName = field.databaseChannel.channelName;
          }
          // Otherwise use field's own channelId (this is for posting to field channel directly)
          else if (field.channelId) {
            targetChannelId = field.channelId;
            targetChannelName = field.name;
          }
        }
      }

      if (!targetChannelId) {
        await ctx.reply(
          "❌ Field kanal topilmadi! Bu kontent field kanalga bog'lanmagan.",
        );
        return;
      }

      // Send to field channel
      try {
        // Get bot username for deep link
        const botInfo = await ctx.api.getMe();
        const botUsername = botInfo.username || 'bot';

        // Create deep link button
        const deepLink = `https://t.me/${botUsername}?start=${contentType === 'serial' ? 's' : ''}${code}`;
        const keyboard = new InlineKeyboard().url(
          '▶️ Tomosha qilish',
          deepLink,
        );

        if (poster) {
          await ctx.api.sendPhoto(targetChannelId, poster, {
            caption: caption,
            reply_markup: keyboard,
          });
        } else {
          await ctx.api.sendMessage(targetChannelId, caption, {
            reply_markup: keyboard,
          });
        }

        await ctx.editMessageReplyMarkup({
          reply_markup: { inline_keyboard: [] },
        });

        const admin = await this.adminService.getAdminByTelegramId(
          String(ctx.from.id),
        );
        await ctx.reply(
          '✅ Field kanalga yuborildi!\n\n' +
            `📢 Kanal: ${targetChannelName}\n` +
            `🎬 Kontent: ${contentType === 'movie' ? 'Kino' : 'Serial'}\n` +
            `🆔 Kod: ${code}\n\n` +
            'Foydalanuvchilarga ham yuborish uchun "Kino premyera" ni qayta bosing.',
          {
            reply_markup: AdminKeyboard.getAdminMainMenu(
              admin?.role || 'ADMIN',
            ),
          },
        );
      } catch (error) {
        this.logger.error('Error sending to field channel:', error);
        await ctx.reply(
          '❌ Field kanalga yuborishda xatolik: ' + error.message,
        );
      }

      this.sessionService.clearSession(ctx.from.id);
    } catch (error) {
      this.logger.error('Error in sendToFieldChannel:', error);
      await ctx.reply('❌ Xatolik yuz berdi.');
    }
  }

  // ==================== BROADCAST PREMIERE TO USERS ====================
  private async broadcastPremiereToUsers(ctx: any) {
    try {
      await ctx.answerCallbackQuery('📤 Foydalanuvchilarga yuborilmoqda...');
      await ctx.editMessageReplyMarkup({
        reply_markup: { inline_keyboard: [] },
      });

      const session = this.sessionService.getSession(ctx.from.id);
      if (!session || !session.data) {
        await ctx.reply("❌ Ma'lumot topilmadi.");
        return;
      }

      const { caption, poster, contentType, code } = session.data;

      // Get all active users
      const users = await this.prisma.user.findMany({
        where: { isBlocked: false },
      });

      // Get bot username
      const botInfo = await ctx.api.getMe();
      const botUsername = botInfo.username || 'bot';

      // Send to all users
      let successCount = 0;
      let failCount = 0;

      const statusMsg = await ctx.reply(
        `📤 Yuborish boshlandi...\n\n👥 Jami: ${users.length}\n✅ Yuborildi: 0\n❌ Xatolik: 0`,
      );

      for (const user of users) {
        try {
          // Create deep link button
          const deepLink = `https://t.me/${botUsername}?start=${contentType === 'serial' ? 's' : ''}${code}`;
          const keyboard = new InlineKeyboard().url(
            '▶️ Tomosha qilish',
            deepLink,
          );

          if (poster) {
            await ctx.api.sendPhoto(user.telegramId, poster, {
              caption: caption,
              reply_markup: keyboard,
            });
          } else {
            await ctx.api.sendMessage(user.telegramId, caption, {
              reply_markup: keyboard,
            });
          }

          successCount++;

          // Update status every 50 users
          if (successCount % 50 === 0) {
            await ctx.api.editMessageText(
              statusMsg.chat.id,
              statusMsg.message_id,
              `📤 Yuborish davom etmoqda...\n\n👥 Jami: ${users.length}\n✅ Yuborildi: ${successCount}\n❌ Xatolik: ${failCount}`,
            );
          }

          // Delay to avoid rate limits
          await new Promise((resolve) => setTimeout(resolve, 50));
        } catch (error) {
          failCount++;
          this.logger.error(
            `Failed to send to user ${user.telegramId}:`,
            error,
          );
        }
      }

      // Final status
      await ctx.api.editMessageText(
        statusMsg.chat.id,
        statusMsg.message_id,
        `✅ **Yuborish yakunlandi!**\n\n` +
          `👥 Jami: ${users.length}\n` +
          `✅ Yuborildi: ${successCount}\n` +
          `❌ Xatolik: ${failCount}`,
        { parse_mode: 'Markdown' },
      );

      const admin = await this.adminService.getAdminByTelegramId(
        String(ctx.from.id),
      );
      await ctx.reply(
        "🎉 Premyera e'loni muvaffaqiyatli yuborildi!",
        AdminKeyboard.getAdminMainMenu(admin?.role || 'ADMIN'),
      );

      this.sessionService.clearSession(ctx.from.id);
    } catch (error) {
      this.logger.error('Error in broadcastPremiereToUsers:', error);
      await ctx.reply('❌ Xatolik yuz berdi.');
    }
  }
}

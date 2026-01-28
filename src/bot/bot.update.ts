import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BotContext } from './bot.context';
import { GrammyBotService } from '../common/grammy/grammy-bot.module';

@Injectable()
export class BotUpdate implements OnModuleInit {
  private readonly logger = new Logger(BotUpdate.name);

  constructor(
    private prisma: PrismaService,
    private grammyBot: GrammyBotService,
  ) {}

  onModuleInit() {
    this.logger.log('🔧 BotUpdate initializing...');
    try {
      this.grammyBot.bot.callbackQuery(
        'check_subscription',
        this.checkSubscription.bind(this),
      );
      this.logger.log('✅ BotUpdate initialized successfully');
    } catch (error) {
      this.logger.error('❌ Failed to initialize BotUpdate');
      this.logger.error(`Error: ${error.message}`);
      this.logger.error('Stack:', error.stack);
      throw error;
    }
  }

  private async checkSubscription(ctx: BotContext) {
    if (!ctx.from) return;

    this.logger.log(`📋 Checking subscription for user ${ctx.from.id}`);

    try {
      await ctx.answerCallbackQuery();

      const channels = await this.prisma.mandatoryChannel.findMany({
        where: { isActive: true },
        orderBy: { order: 'asc' },
      });

      this.logger.log(`Found ${channels.length} active mandatory channels`);

      if (channels.length === 0) {
        await ctx.reply("✅ Hech qanday majburiy kanal yo'q!");
        return;
      }

      const notJoined: typeof channels = [];

      for (const channel of channels) {
        try {
          const member = await ctx.api.getChatMember(
            channel.channelId,
            ctx.from.id,
          );
          if (!['member', 'administrator', 'creator'].includes(member.status)) {
            notJoined.push(channel);
          }
        } catch (error) {
          this.logger.error(
            `❌ Error checking subscription for channel ${channel.channelId} (${channel.channelName}):`,
          );
          this.logger.error(`Error: ${error.message}`);
          this.logger.error(`User: ${ctx.from.id}`);
          notJoined.push(channel);
        }
      }

      if (notJoined.length === 0) {
        this.logger.log(`✅ User ${ctx.from.id} is subscribed to all channels`);
        await ctx.editMessageText("✅ Siz barcha kanallarga obuna bo'lgansiz!");
      } else {
        this.logger.log(
          `⚠️ User ${ctx.from.id} needs to subscribe to ${notJoined.length} channel(s)`,
        );
      }
    } catch (error) {
      this.logger.error(
        `❌ Error in checkSubscription for user ${ctx.from?.id}`,
      );
      this.logger.error(`Error: ${error.message}`);
      this.logger.error('Stack:', error.stack);
    }
  }
}

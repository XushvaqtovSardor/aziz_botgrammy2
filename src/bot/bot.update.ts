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
    // Register handlers
    this.grammyBot.bot.callbackQuery(
      'check_subscription',
      this.checkSubscription.bind(this),
    );

    this.logger.debug('Bot handlers registered');
  }

  private async checkSubscription(ctx: BotContext) {
    if (!ctx.from) return;

    this.logger.debug(`User ${ctx.from.id} checking subscription`);

    await ctx.answerCallbackQuery();

    const channels = await this.prisma.mandatoryChannel.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });

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
          `Error checking subscription for channel ${channel.channelId}:`,
          error.message,
        );
        notJoined.push(channel);
      }
    }

    if (notJoined.length === 0) {
      this.logger.debug(`User ${ctx.from.id} is subscribed to all channels`);
      await ctx.editMessageText("✅ Siz barcha kanallarga obuna bo'lgansiz!");
    } else {
      this.logger.debug(
        `User ${ctx.from.id} not subscribed to ${notJoined.length} channels`,
      );
    }
  }
}

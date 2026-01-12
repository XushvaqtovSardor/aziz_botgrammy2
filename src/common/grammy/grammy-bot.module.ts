import { Module, OnModuleInit, Injectable, Logger } from '@nestjs/common';
import { Bot } from 'grammy';
import { BotContext } from '../../bot/bot.context';

@Injectable()
export class GrammyBotService implements OnModuleInit {
  private readonly logger = new Logger(GrammyBotService.name);
  public bot: Bot<BotContext>;
  public botUsername: string;

  constructor() {
    const token = process.env.BOT_TOKEN;
    if (!token) {
      throw new Error('BOT_TOKEN is not defined in environment variables');
    }
    this.bot = new Bot<BotContext>(token);
    this.logger.debug('Grammy Bot instance created');
  }

  async onModuleInit() {
    // Error handling
    this.bot.catch((err) => {
      this.logger.error('Grammy Bot error:', err);
    });

    // Log middleware
    this.bot.use(async (ctx, next) => {
      if (ctx.message && 'text' in ctx.message) {
        this.logger.debug(
          `[TELEGRAM] Message from ${ctx.from?.id}: "${ctx.message.text}"`,
        );
      }
      await next();
    });

    // Note: Don't start bot here - it will be started in main.ts after all handlers are registered
    this.logger.debug('Grammy Bot middleware configured');
  }

  async startBot() {
    try {
      await this.bot.start({
        onStart: ({ username }) => {
          this.botUsername = username;
          this.logger.debug(`🤖 Grammy Bot @${username} started successfully!`);
        },
      });
    } catch (error) {
      this.logger.error('Failed to start Grammy Bot:', error);
      throw error;
    }
  }

  getBot(): Bot<BotContext> {
    return this.bot;
  }
}

@Module({
  providers: [GrammyBotService],
  exports: [GrammyBotService],
})
export class GrammyBotModule {}

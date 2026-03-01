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
      this.logger.error('❌ BOT_TOKEN is not defined in environment variables');
      throw new Error('BOT_TOKEN is not defined in  environment variables');
    }

    try {
      this.bot = new Bot<BotContext>(token);
    } catch (error) {
      this.logger.error('❌ Failed to create Grammy Bot instance');
      this.logger.error(`Error: ${error.message}`);
      this.logger.error('Stack:', error.stack);
      throw error;
    }
  }

  async onModuleInit() {
    try {
      this.bot.catch((err) => {
        this.logger.error('❌ Grammy Bot error caught:');
        this.logger.error(`Error message: ${err.message || 'Unknown error'}`);
        this.logger.error(`Error stack: ${err.stack || 'No stack trace'}`);
        if (err.error) {
          this.logger.error(`Telegram API Error: ${JSON.stringify(err.error)}`);
        }
      });

      this.bot.use(async (ctx, next) => {
        try {
          await next();
        } catch (error) {
          this.logger.error('❌ Error in middleware:');
          this.logger.error(`Error: ${error.message}`);
          this.logger.error('Stack:', error.stack);
          this.logger.error(
            `Update that caused error: ${JSON.stringify(ctx.update)}`,
          );
          throw error;
        }
      });
    } catch (error) {
      this.logger.error('❌ Failed to initialize GrammyBotService module');
      this.logger.error(`Error: ${error.message}`);
      this.logger.error('Stack:', error.stack);
      throw error;
    }
  }

  async startBot() {
    try {
      this.bot
        .start({
          onStart: ({ username }) => {
            this.botUsername = username;
          },
          drop_pending_updates: false,
          allowed_updates: [],
        })
        .catch((error) => {
          this.logger.error('❌ Bot polling error:');
          this.logger.error(`Error: ${error.message}`);
          this.logger.error(`Error type: ${error.constructor.name}`);
          // Don't throw - let bot retry automatically

          // Retry after 5 seconds
          setTimeout(() => {
            this.startBot().catch(() => {
              this.logger.error('❌ Retry failed');
            });
          }, 5000);
        });
    } catch (error) {
      this.logger.error('❌ Failed to start Grammy Bot');
      this.logger.error(`Error type: ${error.constructor.name}`);
      this.logger.error(`Error message: ${error.message}`);
      this.logger.error('Full error:', JSON.stringify(error, null, 2));
      this.logger.error('Stack:', error.stack);

      if (error.description) {
        this.logger.error(`Telegram API description: ${error.description}`);
      }

      if (error.error_code) {
        this.logger.error(`Telegram API error code: ${error.error_code}`);
      }

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

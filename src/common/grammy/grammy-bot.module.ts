import { Module, OnModuleInit, Injectable, Logger } from '@nestjs/common';
import { Bot } from 'grammy';
import { BotContext } from '../../bot/bot.context';

@Injectable()
export class GrammyBotService implements OnModuleInit {
  private readonly logger = new Logger(GrammyBotService.name);
  public bot: Bot<BotContext>;
  public botUsername: string;

  constructor() {
    this.logger.log('🔧 Initializing GrammyBotService...');

    const token = process.env.BOT_TOKEN;
    if (!token) {
      this.logger.error('❌ BOT_TOKEN is not defined in environment variables');
      throw new Error('BOT_TOKEN is not defined in  environment variables');
    }

    this.logger.log(`✅ Bot token found (length: ${token.length})`);

    try {
      this.bot = new Bot<BotContext>(token);
      this.logger.log('✅ Grammy Bot instance created successfully');
    } catch (error) {
      this.logger.error('❌ Failed to create Grammy Bot instance');
      this.logger.error(`Error: ${error.message}`);
      this.logger.error('Stack:', error.stack);
      throw error;
    }
  }

  async onModuleInit() {
    this.logger.log('🔧 GrammyBotService module initializing...');

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
          this.logger.debug(
            `📨 Received update: ${JSON.stringify(ctx.update).slice(0, 200)}...`,
          );
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

      this.logger.log('✅ GrammyBotService module initialized successfully');
    } catch (error) {
      this.logger.error('❌ Failed to initialize GrammyBotService module');
      this.logger.error(`Error: ${error.message}`);
      this.logger.error('Stack:', error.stack);
      throw error;
    }
  }

  async startBot() {
    this.logger.log('🚀 Starting Grammy Bot...');

    try {
      this.logger.log('📡 Attempting to connect to Telegram API...');

      console.log('✅ Bot is now polling for updates');
      await this.bot.start({
        onStart: ({ username }) => {
          this.botUsername = username;
          this.logger.log(`✅ Bot started successfully!`);
          this.logger.log(`👤 Bot username: @${username}`);
        },
        drop_pending_updates: true,
      });

      this.logger.log('✅ Bot is now polling for updates');
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

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { loggerConfig } from './common/config/logger.config';
import { Logger } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { GrammyBotService } from './common/grammy/grammy-bot.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  try {
    logger.log('🚀 Starting application...');
    logger.log(`📦 Node Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.log(`🤖 Bot Token exists: ${!!process.env.BOT_TOKEN}`);

    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
      logger: loggerConfig,
    });
    logger.log('✅ NestJS app created successfully');

    app.enableCors();
    logger.log('✅ CORS enabled');

    app.useStaticAssets(join(__dirname, '..', 'public'));
    logger.log('✅ Static assets configured');

    const port = process.env.PORT ?? 3000;
    logger.log(`🔌 Attempting to listen on port ${port}...`);

    await app.listen(port, '0.0.0.0');
    logger.log(`✅ Server is listening on port ${port}`);

    logger.log('🤖 Initializing Telegram bot...');
    const grammyBot = app.get(GrammyBotService);

    // Start bot in background - don't await
    grammyBot.startBot().catch((botError) => {
      logger.error('❌ Failed to initialize Telegram bot');
      logger.error(`Bot Error: ${botError.message}`);
      logger.warn('⚠️ Bot will retry automatically in background');
    });

    logger.log('✅ Telegram bot initialization started in background');
    logger.log('🔄 Bot will connect when network is available...');

    logger.log('🔧 Initializing default channel...');
    await initializeDefaultChannel(app);
    logger.log('✅ Application bootstrap completed successfully');

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      logger.log('🛑 Received SIGINT, gracefully shutting down...');
      try {
        await grammyBot.bot.stop();
      } catch (error) {
        logger.warn('⚠️ Bot was not running');
      }
      await app.close();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.log('🛑 Received SIGTERM, gracefully shutting down...');
      try {
        await grammyBot.bot.stop();
      } catch (error) {
        logger.warn('⚠️ Bot was not running');
      }
      await app.close();
      process.exit(0);
    });
  } catch (error) {
    logger.error('❌ Critical error during bootstrap');
    logger.error(`Error: ${error.message}`);
    logger.error('Stack:', error.stack);
    throw error;
  }
}

async function initializeDefaultChannel(app: NestExpressApplication) {
  const logger = new Logger('DatabaseChannelInit');

  try {
    const channelLink = process.env.DEFAULT_DATABASE_CHANNEL_LINK;
    const channelName =
      process.env.DEFAULT_DATABASE_CHANNEL_NAME || 'Default Database';

    if (!channelLink) {
      logger.log(
        'ℹ️ No default database channel configured (DEFAULT_DATABASE_CHANNEL_LINK not set)',
      );
      return;
    }

    logger.log(`🔍 Checking for default channel: ${channelName}`);

    const { ChannelService } =
      await import('./modules/channel/services/channel.service');
    const { PrismaService } = await import('./prisma/prisma.service');

    const prismaService = app.get(PrismaService);
    const channelService = new ChannelService(prismaService);

    const existingChannels = await channelService.findAllDatabase();
    const channelExists = existingChannels.some(
      (ch) => ch.channelName === channelName,
    );

    if (channelExists) {
      logger.log('✅ Default database channel already exists');
      return;
    }

    logger.log('✅ Database channel initialization completed');
  } catch (error) {
    const err = error as Error;
    logger.error(`❌ Failed to initialize database channel: ${err.message}`);
    logger.error('Database channel error stack:', err.stack);
  }
}

bootstrap().catch((error) => {
  const logger = new Logger('Bootstrap');
  const err = error as Error;
  logger.error('❌ Application failed to start');
  logger.error(`Error: ${err.message}`);
  logger.error('Stack:', err.stack);
  process.exit(1);
});

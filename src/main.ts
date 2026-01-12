import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { loggerConfig } from './common/config/logger.config';
import { Logger } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { GrammyBotService } from './common/grammy/grammy-bot.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: loggerConfig,
  });

  app.enableCors();

  app.useStaticAssets(join(__dirname, '..', 'public'));

  const port = process.env.PORT ?? 3000;

  await app.listen(port, '0.0.0.0');

  const logger = new Logger('Bootstrap');

  if (process.env.NODE_ENV !== 'production') {
    logger.log(`🚀 Application started on port ${port}`);
  }

  const grammyBot = app.get(GrammyBotService);
  await grammyBot.startBot();

  if (process.env.NODE_ENV !== 'production') {
    logger.log(`📱 Grammy Telegram Bot is running...`);
    logger.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.log(`📝 Logs directory: ./logs`);
    logger.log(
      `💾 Database: ${process.env.DATABASE_URL?.split('@')[1]?.split('?')[0] || 'Not configured'}`,
    );
  }

  await initializeDefaultChannel(app);
}

async function initializeDefaultChannel(app: NestExpressApplication) {
  const logger = new Logger('DatabaseChannelInit');
  const isDevelopment = process.env.NODE_ENV !== 'production';

  try {
    const channelLink = process.env.DEFAULT_DATABASE_CHANNEL_LINK;
    const channelName =
      process.env.DEFAULT_DATABASE_CHANNEL_NAME || 'Default Database';

    if (!channelLink) {
      if (isDevelopment) {
        logger.warn('⚠️  DEFAULT_DATABASE_CHANNEL_LINK not configured in .env');
      }
      return;
    }

    // Get ChannelService from the app
    const { ChannelService } =
      await import('./modules/channel/services/channel.service');
    const { PrismaService } = await import('./prisma/prisma.service');

    const prismaService = app.get(PrismaService);
    const channelService = new ChannelService(prismaService);

    if (isDevelopment) {
      logger.log(`📢 Checking database channel: ${channelName}`);
    }

    // Check if channel already exists in database
    const existingChannels = await channelService.findAllDatabase();
    const channelExists = existingChannels.some(
      (ch) => ch.channelName === channelName,
    );

    if (channelExists) {
      if (isDevelopment) {
        logger.log(`✅ Database channel "${channelName}" already configured`);
      }
      return;
    }

    // Since it's a private channel with invite link, we can't get the ID directly
    // The bot needs to be added as admin first, then admin can add via panel
    if (isDevelopment) {
      logger.log(`ℹ️  Database channel not found: ${channelName}`);
      logger.warn(`⚠️  Add bot as admin to channel: ${channelLink}`);
      logger.warn(
        `⚠️  Then use admin panel "💾 Database kanallar" to add the channel`,
      );
    }
  } catch (error) {
    const err = error as Error;
    logger.error(`❌ Failed to initialize database channel: ${err.message}`);
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

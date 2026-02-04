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
    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
      logger: loggerConfig,
    });

    app.enableCors();

    // Serve static files from public directory
    app.useStaticAssets(join(__dirname, '..', 'public'), {
      prefix: '/public/',
    });

    // Serve admin static files (CSS, JS, etc.)
    app.useStaticAssets(join(__dirname, '..', 'public', 'admin'), {
      prefix: '/admin/',
    });

    // Serve admin login page at /admin
    app.use('/admin', (req, res, next) => {
      if (req.url === '/' || req.url === '') {
        res.sendFile(join(__dirname, '..', 'public', 'admin', 'index.html'));
      } else if (req.url === '/dashboard' || req.url === '/dashboard.html') {
        res.sendFile(join(__dirname, '..', 'public', 'admin', 'dashboard.html'));
      } else {
        next();
      }
    });

    const port = process.env.PORT ?? 3000;
    const webUrl = process.env.WEB_URL || `http://localhost:${port}`;

    await app.listen(port, '0.0.0.0');

    logger.log(`\u2705 Server is running on: ${webUrl}`);
    logger.log(`\u2705 Admin panel: ${webUrl}/admin`);
    logger.log(`\u2705 API docs: ${webUrl}/api`);

    const grammyBot = app.get(GrammyBotService);

    // Start bot in background - don't await
    grammyBot.startBot().catch((botError) => {
      logger.error('❌ Failed to initialize Telegram bot');
      logger.error(`Bot Error: ${botError.message}`);
    });

    await initializeDefaultChannel(app);

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      try {
        await grammyBot.bot.stop();
      } catch (error) { }
      await app.close();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      try {
        await grammyBot.bot.stop();
      } catch (error) { }
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
      return;
    }

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
      return;
    }
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

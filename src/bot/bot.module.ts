import { Module } from '@nestjs/common';
import { BotUpdate } from './bot.update';
import { GrammyBotModule } from '../common/grammy/grammy-bot.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [GrammyBotModule, PrismaModule],
  providers: [BotUpdate],
})
export class BotModule {}

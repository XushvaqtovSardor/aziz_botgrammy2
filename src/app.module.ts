import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { BotModule } from './bot/bot.module';
import { PrismaModule } from './prisma/prisma.module';
import { LanguageModule } from './modules/language/language.module';
import { AdminModule } from './modules/admin/admin.module';
import { FieldModule } from './modules/field/field.module';
import { ChannelModule } from './modules/channel/channel.module';
import { ContentModule } from './modules/content/content.module';
import { PaymentModule } from './modules/payment/payment.module';
import { UserModule } from './modules/user/user.module';
import { BroadcastModule } from './modules/broadcast/broadcast.module';
import { SettingsModule } from './modules/settings/settings.module';
import { UserHandlersModule } from './modules/user/user-handlers.module';
import { AdminHandlersModule } from './modules/admin/admin-handlers.module';
import { AdminApiModule } from './modules/admin-api/admin-api.module';
import { GrammyBotModule } from './common/grammy/grammy-bot.module';

@Module({
  imports: [
    PrismaModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    GrammyBotModule,
    LanguageModule,
    AdminModule,
    FieldModule,
    ChannelModule,
    ContentModule,
    PaymentModule,
    UserModule,
    BroadcastModule,
    SettingsModule,
    AdminHandlersModule,
    UserHandlersModule,
    AdminApiModule,
    BotModule,
  ],
  controllers: [AppController],
})
export class AppModule {}

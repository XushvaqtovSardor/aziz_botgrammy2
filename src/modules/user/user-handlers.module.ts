import { Module } from '@nestjs/common';
import { UserModule } from './user.module';
import { LanguageModule } from '../language/language.module';
import { ChannelModule } from '../channel/channel.module';
import { ContentModule } from '../content/content.module';
import { PaymentModule } from '../payment/payment.module';
import { SettingsModule } from '../settings/settings.module';
import { FieldModule } from '../field/field.module';
import { AdminModule } from '../admin/admin.module';
import { GrammyBotModule } from '../../common/grammy/grammy-bot.module';
import { UserHandler } from './user.handler';

@Module({
  imports: [
    GrammyBotModule,
    UserModule,
    LanguageModule,
    ChannelModule,
    ContentModule,
    PaymentModule,
    SettingsModule,
    FieldModule,
    AdminModule,
  ],
  providers: [UserHandler],
  exports: [UserHandler],
})
export class UserHandlersModule {}

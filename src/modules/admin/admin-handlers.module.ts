import { Module } from '@nestjs/common';
import { AdminHandler } from './admin.handler';
import { AdminModule } from './admin.module';
import { UserModule } from '../user/user.module';
import { ContentModule } from '../content/content.module';
import { FieldModule } from '../field/field.module';
import { PaymentModule } from '../payment/payment.module';
import { BroadcastModule } from '../broadcast/broadcast.module';
import { ChannelModule } from '../channel/channel.module';
import { SettingsModule } from '../settings/settings.module';
import { GrammyBotModule } from '../../common/grammy/grammy-bot.module';

@Module({
  imports: [
    GrammyBotModule,
    AdminModule,
    UserModule,
    ContentModule,
    FieldModule,
    PaymentModule,
    BroadcastModule,
    ChannelModule,
    SettingsModule,
  ],
  providers: [AdminHandler],
  exports: [AdminHandler],
})
export class AdminHandlersModule {}

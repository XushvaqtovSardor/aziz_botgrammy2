import { Module } from '@nestjs/common';
import { AdminApiController } from './admin-api.controller';
import { AdminApiGuard } from './admin-api.guard';
import { AdminModule } from '../admin/admin.module';
import { UserModule } from '../user/user.module';
import { FieldModule } from '../field/field.module';
import { ChannelModule } from '../channel/channel.module';
import { ContentModule } from '../content/content.module';
import { PaymentModule } from '../payment/payment.module';

@Module({
  imports: [
    AdminModule,
    UserModule,
    FieldModule,
    ChannelModule,
    ContentModule,
    PaymentModule,
  ],
  controllers: [AdminApiController],
  providers: [AdminApiGuard],
})
export class AdminApiModule {}

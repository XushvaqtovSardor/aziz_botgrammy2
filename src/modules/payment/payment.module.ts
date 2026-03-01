import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentService } from './services/payment.service';
import { PremiumService } from './services/premium.service';
import { PaymeService } from './services/payme.service';
import { PaymentController } from './payment.controller';
import { PremiumGuard } from './guards/premium.guard';
import { PrismaModule } from '../../prisma/prisma.module';
import { GrammyBotModule } from '../../common/grammy/grammy-bot.module';

@Module({
  imports: [PrismaModule, ConfigModule, GrammyBotModule],
  controllers: [PaymentController],
  providers: [PaymentService, PremiumService, PaymeService, PremiumGuard],
  exports: [PaymentService, PremiumService, PaymeService, PremiumGuard],
})
export class PaymentModule {}

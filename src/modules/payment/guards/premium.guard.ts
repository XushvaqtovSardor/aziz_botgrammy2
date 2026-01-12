import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PaymentService } from '../services/payment.service';
import { PREMIUM_REQUIRED_KEY } from '../decorators/premium.decorator';
import { BotContext } from '../../../bot/bot.context';

@Injectable()
export class PremiumGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private paymentService: PaymentService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if premium is required
    const premiumRequired = this.reflector.getAllAndOverride<boolean>(
      PREMIUM_REQUIRED_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!premiumRequired) {
      return true;
    }

    // Get Telegram context
    const ctx = context.getArgByIndex(0) as BotContext;
    const telegramId = ctx.from?.id.toString();

    if (!telegramId) {
      return false;
    }

    // Check if user has active premium
    const hasPremium = await this.paymentService.checkPremiumStatus(telegramId);

    if (!hasPremium) {
      // Send message to user
      await ctx.reply(
        '❌ Bu funksiya faqat Premium foydalanuvchilar uchun\n\n' +
          "💎 Premium sotib olish uchun /premium buyrug'idan foydalaning",
      );
      return false;
    }

    return true;
  }
}

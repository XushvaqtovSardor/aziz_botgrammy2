import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  HttpStatus,
  HttpCode,
  Headers,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PaymentService } from './services/payment.service';
import { PaymeService } from './services/payme.service';
import { PremiumService } from './services/premium.service';
import { GrammyBotService } from '../../common/grammy/grammy-bot.module';

@Controller('payment')
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);

  constructor(
    private paymentService: PaymentService,
    private paymeService: PaymeService,
    private premiumService: PremiumService,
    private grammyBot: GrammyBotService,
  ) {}

  @Post('create')
  @HttpCode(HttpStatus.OK)
  async createPayment(
    @Body() body: { telegramId: string; amount: number; duration?: number },
  ) {
    try {
      if (!body.telegramId || !body.amount) {
        throw new BadRequestException('telegramId and amount are required');
      }

      const payment = await this.paymentService.createOnlinePayment({
        telegramId: body.telegramId,
        amount: body.amount,
        duration: body.duration || 30,
        provider: 'payme',
      });

      const paymentLink = this.paymeService.generatePaymentLink(
        payment.id,
        body.amount,
      );

      return {
        success: true,
        paymentId: payment.id,
        paymentLink,
        amount: body.amount,
        duration: body.duration || 30,
      };
    } catch (error) {
      this.logger.error('Error creating payment', error);
      throw error;
    }
  }

  @Post('webhook/payme')
  @HttpCode(HttpStatus.OK)
  async handlePaymeWebhook(@Headers() headers: any, @Body() body: any) {
    try {
      const isValid = this.paymeService.verifySignature({ headers });
      if (!isValid) {
        throw new BadRequestException('Invalid signature');
      }

      const result = await this.paymeService.handleWebhook(body);

      if (body.method === 'PerformTransaction') {
        await this.sendPaymentSuccessNotification(body.params.account.order_id);
      }

      return result;
    } catch (error) {
      this.logger.error('Error handling Payme webhook', error);
      return {
        error: {
          code: -32400,
          message: error.message,
        },
      };
    }
  }

  @Post('webhook/test')
  @HttpCode(HttpStatus.OK)
  async testWebhook(@Body() body: { paymentId: number; status: string }) {
    try {
      if (body.status === 'success') {
        const payment = await this.paymentService.processSuccessfulPayment({
          paymentId: body.paymentId,
        });

        await this.sendPaymentSuccessNotification(body.paymentId);

        return {
          success: true,
          message: 'Payment processed successfully',
          payment,
        };
      } else {
        await this.paymentService.markPaymentFailed(
          body.paymentId,
          'Test failure',
        );
        return {
          success: false,
          message: 'Payment marked as failed',
        };
      }
    } catch (error) {
      this.logger.error('Error in test webhook', error);
      throw error;
    }
  }

  @Get('status/:paymentId')
  async getPaymentStatus(@Param('paymentId') paymentId: string) {
    try {
      const payment = await this.paymentService.getPaymentById(
        parseInt(paymentId),
      );

      return {
        success: true,
        payment: {
          id: payment.id,
          status: payment.status,
          amount: payment.amount,
          createdAt: payment.createdAt,
          processedAt: payment.processedAt,
        },
      };
    } catch (error) {
      this.logger.error('Error getting payment status', error);
      throw error;
    }
  }

  @Get('premium-status/:telegramId')
  async checkPremiumStatus(@Param('telegramId') telegramId: string) {
    try {
      const isPremium =
        await this.paymentService.checkPremiumStatus(telegramId);

      return {
        success: true,
        isPremium,
      };
    } catch (error) {
      this.logger.error('Error checking premium status', error);
      throw error;
    }
  }

  private async sendPaymentSuccessNotification(paymentId: number) {
    try {
      const payment = await this.paymentService.getPaymentById(paymentId);

      if (payment && payment.user) {
        const message = `✅ To'lov qabul qilindi!\n🎉 Premium faollashtirildi\n\n💎 Premium muddati: ${payment.user.premiumTill ? payment.user.premiumTill.toLocaleDateString('uz-UZ') : 'N/A'}`;

        await this.grammyBot.bot.api.sendMessage(
          payment.user.telegramId,
          message,
        );
      }
    } catch (error) {
      this.logger.error('Error sending payment notification', error);
    }
  }

  @Get('history/:telegramId')
  async getPaymentHistory(@Param('telegramId') telegramId: string) {
    try {
      const payments = await this.paymentService.getPaymentHistory(telegramId);

      return {
        success: true,
        payments: payments.map((p) => ({
          id: p.id,
          amount: p.amount,
          status: p.status,
          provider: p.provider,
          createdAt: p.createdAt,
          processedAt: p.processedAt,
        })),
      };
    } catch (error) {
      this.logger.error('Error getting payment history', error);
      throw error;
    }
  }
}

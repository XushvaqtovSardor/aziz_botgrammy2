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

  /**
   * Create payment and return payment link
   */
  @Post('create')
  @HttpCode(HttpStatus.OK)
  async createPayment(
    @Body() body: { telegramId: string; amount: number; duration?: number },
  ) {
    try {
      this.logger.debug('Creating payment', body);

      // Validate input
      if (!body.telegramId || !body.amount) {
        throw new BadRequestException('telegramId and amount are required');
      }

      // Create payment record
      const payment = await this.paymentService.createOnlinePayment({
        telegramId: body.telegramId,
        amount: body.amount,
        duration: body.duration || 30,
        provider: 'payme',
      });

      // Generate payment link
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

  /**
   * Payme webhook handler
   */
  @Post('webhook/payme')
  @HttpCode(HttpStatus.OK)
  async handlePaymeWebhook(@Headers() headers: any, @Body() body: any) {
    try {
      this.logger.debug('Received Payme webhook', body);

      // Verify webhook signature
      const isValid = this.paymeService.verifySignature({ headers });
      if (!isValid) {
        throw new BadRequestException('Invalid signature');
      }

      // Handle webhook
      const result = await this.paymeService.handleWebhook(body);

      // If payment was successful, send notification to user
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

  /**
   * Manual webhook test endpoint (for development)
   */
  @Post('webhook/test')
  @HttpCode(HttpStatus.OK)
  async testWebhook(@Body() body: { paymentId: number; status: string }) {
    try {
      this.logger.debug('Test webhook received', body);

      if (body.status === 'success') {
        // Process payment
        const payment = await this.paymentService.processSuccessfulPayment({
          paymentId: body.paymentId,
        });

        // Send notification
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

  /**
   * Check payment status
   */
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

  /**
   * Check user premium status
   */
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

  /**
   * Send payment success notification to user via Telegram
   */
  private async sendPaymentSuccessNotification(paymentId: number) {
    try {
      const payment = await this.paymentService.getPaymentById(paymentId);

      if (payment && payment.user) {
        const message = `✅ To'lov qabul qilindi!\n🎉 Premium faollashtirildi\n\n💎 Premium muddati: ${payment.user.premiumTill ? payment.user.premiumTill.toLocaleDateString('uz-UZ') : 'N/A'}`;

        await this.grammyBot.bot.api.sendMessage(
          payment.user.telegramId,
          message,
        );

        this.logger.debug(
          `Payment success notification sent to user ${payment.user.telegramId}`,
        );
      }
    } catch (error) {
      this.logger.error('Error sending payment notification', error);
    }
  }

  /**
   * Get payment history
   */
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

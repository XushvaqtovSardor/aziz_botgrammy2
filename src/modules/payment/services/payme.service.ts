import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentService } from './payment.service';

@Injectable()
export class PaymeService {
  private readonly logger = new Logger(PaymeService.name);
  private readonly merchantId: string;
  private readonly merchantKey: string;
  private readonly merchantServiceId: string;

  constructor(
    private configService: ConfigService,
    private paymentService: PaymentService,
  ) {
    this.merchantId = this.configService.get('PAYME_MERCHANT_ID') || '';
    this.merchantKey = this.configService.get('PAYME_MERCHANT_KEY') || '';
    this.merchantServiceId =
      this.configService.get('PAYME_MERCHANT_SERVICE_ID') || '';
  }

  /**
   * Generate payment link for Payme
   */
  generatePaymentLink(paymentId: number, amount: number): string {
    // Convert amount to tiyin (1 UZS = 100 tiyin)
    const amountInTiyin = amount * 100;

    // Encode payment data
    const params = Buffer.from(
      `m=${this.merchantId};ac.order_id=${paymentId};a=${amountInTiyin}`,
    ).toString('base64');

    // Generate payment URL
    const paymentUrl = `https://checkout.paycom.uz/${params}`;

    this.logger.debug(
      `Generated Payme payment link for payment ${paymentId}: ${paymentUrl}`,
    );
    return paymentUrl;
  }

  /**
   * Verify webhook signature
   */
  verifySignature(request: any): boolean {
    const auth = request.headers.authorization;
    if (!auth) return false;

    const [type, credentials] = auth.split(' ');
    if (type !== 'Basic') return false;

    const decoded = Buffer.from(credentials, 'base64').toString('utf-8');
    const [username] = decoded.split(':');

    return username === this.merchantId;
  }

  /**
   * Handle Payme webhook
   */
  async handleWebhook(body: any) {
    this.logger.debug('Handling Payme webhook', body);

    const { method, params } = body;

    try {
      switch (method) {
        case 'CheckPerformTransaction':
          return this.checkPerformTransaction(params);
        case 'CreateTransaction':
          return this.createTransaction(params);
        case 'PerformTransaction':
          return this.performTransaction(params);
        case 'CancelTransaction':
          return this.cancelTransaction(params);
        case 'CheckTransaction':
          return this.checkTransaction(params);
        default:
          throw new Error('Method not found');
      }
    } catch (error) {
      this.logger.error('Webhook handling error', error);
      return {
        error: {
          code: -32400,
          message: error.message,
        },
      };
    }
  }

  /**
   * Check if transaction can be performed
   */
  private async checkPerformTransaction(params: {
    account: { order_id: number };
  }) {
    const { account } = params;
    const orderId = account.order_id;

    // Check if payment exists and is pending
    const payment = await this.paymentService.findById(orderId);

    if (!payment) {
      throw new Error('Order not found');
    }

    if (payment.status !== 'PENDING') {
      throw new Error('Order already processed');
    }

    return { allow: true };
  }

  /**
   * Create transaction
   */
  private async createTransaction(params: {
    id: string;
    account: { order_id: number };
  }) {
    const { id, account } = params;
    const orderId = account.order_id;

    // Check if payment exists
    const payment = await this.paymentService.findById(orderId);

    if (!payment) {
      throw new Error('Order not found');
    }

    // Update payment with transaction ID
    await this.paymentService.updateTransactionId(orderId, id);

    return {
      create_time: Date.now(),
      transaction: id,
      state: 1, // Transaction created
    };
  }

  /**
   * Perform transaction (complete payment)
   */
  private async performTransaction(params: {
    id: string;
    account: { order_id: number };
  }) {
    const { id, account } = params;

    // Find payment by order ID
    const payment = await this.paymentService.findById(account.order_id);

    if (!payment) {
      throw new Error('Transaction not found');
    }

    // Process payment
    await this.paymentService.processSuccessfulPayment({
      paymentId: payment.id,
    });

    return {
      perform_time: Date.now(),
      transaction: id,
      state: 2, // Transaction completed
    };
  }

  /**
   * Cancel transaction
   */
  private async cancelTransaction(params: {
    id: string;
    account: { order_id: number };
    reason?: number;
  }) {
    const { id, account, reason } = params;

    // Find payment by order ID
    const payment = await this.paymentService.findById(account.order_id);

    if (!payment) {
      throw new Error('Transaction not found');
    }

    // Mark payment as failed
    await this.paymentService.markPaymentFailed(
      payment.id,
      `Cancelled: ${reason || 'Unknown'}`,
    );

    return {
      cancel_time: Date.now(),
      transaction: id,
      state: -1, // Transaction cancelled
    };
  }

  /**
   * Check transaction status
   */
  private async checkTransaction(params: {
    id: string;
    account: { order_id: number };
  }) {
    const { account } = params;

    // Find payment by order ID
    const payment = await this.paymentService.findById(account.order_id);

    if (!payment) {
      throw new Error('Transaction not found');
    }

    let state = 1; // Default: created
    if (payment.status === 'SUCCESS') state = 2; // Completed
    if (payment.status === 'FAILED') state = -1; // Cancelled

    return {
      create_time: payment.createdAt.getTime(),
      perform_time: payment.processedAt?.getTime() || 0,
      cancel_time: 0,
      transaction: (payment as any).transactionId || '',
      state,
    };
  }

  /**
   * Generate test payment link for development
   */
  generateTestPaymentLink(paymentId: number, amount: number): string {
    return `https://test.paycom.uz/checkout?paymentId=${paymentId}&amount=${amount}`;
  }
}

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

  generatePaymentLink(paymentId: number, amount: number): string {
    const amountInTiyin = amount * 100;

    const params = Buffer.from(
      `m=${this.merchantId};ac.order_id=${paymentId};a=${amountInTiyin}`,
    ).toString('base64');

    const paymentUrl = `https://checkout.paycom.uz/${params}`;
    return paymentUrl;
  }

  verifySignature(request: any): boolean {
    const auth = request.headers.authorization;
    if (!auth) return false;

    const [type, credentials] = auth.split(' ');
    if (type !== 'Basic') return false;

    const decoded = Buffer.from(credentials, 'base64').toString('utf-8');
    const [username] = decoded.split(':');

    return username === this.merchantId;
  }

  async handleWebhook(body: any) {
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

  private async checkPerformTransaction(params: {
    account: { order_id: number };
  }) {
    const { account } = params;
    const orderId = account.order_id;

    const payment = await this.paymentService.findById(orderId);

    if (!payment) {
      throw new Error('Order not found');
    }

    if (payment.status !== 'PENDING') {
      throw new Error('Order already processed');
    }

    return { allow: true };
  }

  private async createTransaction(params: {
    id: string;
    account: { order_id: number };
  }) {
    const { id, account } = params;
    const orderId = account.order_id;

    const payment = await this.paymentService.findById(orderId);

    if (!payment) {
      throw new Error('Order not found');
    }

    await this.paymentService.updateTransactionId(orderId, id);

    return {
      create_time: Date.now(),
      transaction: id,
      state: 1, // Transaction created
    };
  }

  private async performTransaction(params: {
    id: string;
    account: { order_id: number };
  }) {
    const { id, account } = params;

    const payment = await this.paymentService.findById(account.order_id);

    if (!payment) {
      throw new Error('Transaction not found');
    }

    await this.paymentService.processSuccessfulPayment({
      paymentId: payment.id,
    });

    return {
      perform_time: Date.now(),
      transaction: id,
      state: 2, // Transaction completed
    };
  }

  private async cancelTransaction(params: {
    id: string;
    account: { order_id: number };
    reason?: number;
  }) {
    const { id, account, reason } = params;

    const payment = await this.paymentService.findById(account.order_id);

    if (!payment) {
      throw new Error('Transaction not found');
    }

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

  private async checkTransaction(params: {
    id: string;
    account: { order_id: number };
  }) {
    const { account } = params;

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

  generateTestPaymentLink(paymentId: number, amount: number): string {
    return `https://test.paycom.uz/checkout?paymentId=${paymentId}&amount=${amount}`;
  }
}

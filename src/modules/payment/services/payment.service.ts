import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaymentStatus } from '@prisma/client';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(private prisma: PrismaService) {}

  async create(
    userId: number,
    amount: number,
    receiptFileId: string,
    duration: number = 30,
  ) {
    return this.prisma.payment.create({
      data: {
        userId,
        amount,
        duration,
        receiptFileId,
        status: PaymentStatus.PENDING,
      },
      include: {
        user: true,
      },
    });
  }

  async findPending() {
    return this.prisma.payment.findMany({
      where: { status: PaymentStatus.PENDING },
      include: {
        user: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByStatus(status: PaymentStatus) {
    return this.prisma.payment.findMany({
      where: { status },
      include: {
        user: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: number) {
    return this.prisma.payment.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });
  }

  async findByUser(userId: number) {
    return this.prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approve(paymentId: number, adminId: number, durationDays: number) {
    const payment = await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.APPROVED,
        processedBy: String(adminId),
        processedAt: new Date(),
      },
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + durationDays);

    await this.prisma.user.update({
      where: { id: payment.userId },
      data: {
        isPremium: true,
        premiumExpiresAt: expiresAt,
      },
    });

    return payment;
  }

  async reject(paymentId: number, adminId: number, reason?: string) {
    return this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.REJECTED,
        processedBy: String(adminId),
        processedAt: new Date(),
        rejectionReason: reason,
      },
    });
  }

  async getStatistics() {
    const [
      totalPayments,
      totalRevenue,
      pendingCount,
      approvedCount,
      rejectedCount,
    ] = await Promise.all([
      this.prisma.payment.count(),
      this.prisma.payment.aggregate({
        where: { status: PaymentStatus.APPROVED },
        _sum: { amount: true },
      }),
      this.prisma.payment.count({ where: { status: PaymentStatus.PENDING } }),
      this.prisma.payment.count({ where: { status: PaymentStatus.APPROVED } }),
      this.prisma.payment.count({ where: { status: PaymentStatus.REJECTED } }),
    ]);

    return {
      totalPayments,
      totalRevenue: totalRevenue._sum.amount || 0,
      pendingCount,
      approvedCount,
      rejectedCount,
    };
  }

  async createOnlinePayment(data: {
    telegramId: string;
    amount: number;
    duration?: number;
    provider?: string;
  }) {
    const user = await this.prisma.user.findUnique({
      where: { telegramId: data.telegramId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const payment = await this.prisma.payment.create({
      data: {
        userId: user.id,
        amount: data.amount,
        duration: data.duration || 30,
        provider: data.provider || 'payme',
        status: PaymentStatus.PENDING,
      },
      include: {
        user: true,
      },
    });

    return payment;
  }

  async processSuccessfulPayment(data: {
    paymentId?: number;
    transactionId?: string;
  }) {
    const payment = await this.prisma.payment.findFirst({
      where: data.paymentId
        ? { id: data.paymentId }
        : { transactionId: data.transactionId },
      include: { user: true },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status === PaymentStatus.SUCCESS) {
      
      return payment;
    }

    const duration = payment.duration || 30;
    const premiumTill = new Date();
    premiumTill.setDate(premiumTill.getDate() + duration);

    const updatedPayment = await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.SUCCESS,
        processedAt: new Date(),
        user: {
          update: {
            isPremium: true,
            premiumTill: premiumTill,
            premiumExpiresAt: premiumTill,
          },
        },
      },
      include: { user: true },
    });

    return updatedPayment;
  }

  async markPaymentFailed(paymentId: number, reason?: string) {
    const payment = await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.FAILED,
        rejectionReason: reason,
        processedAt: new Date(),
      },
    });

    return payment;
  }

  async checkPremiumStatus(telegramId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { telegramId },
    });

    if (!user || !user.isPremium) {
      return false;
    }

    if (user.premiumTill && user.premiumTill < new Date()) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { isPremium: false },
      });
      return false;
    }

    return true;
  }

  async getPaymentHistory(telegramId: string) {
    const user = await this.prisma.user.findUnique({
      where: { telegramId },
      include: {
        payments: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user.payments;
  }

  async getPaymentById(paymentId: number) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { user: true },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  async updateTransactionId(paymentId: number, transactionId: string) {
    return this.prisma.payment.update({
      where: { id: paymentId },
      data: { transactionId },
    });
  }
}

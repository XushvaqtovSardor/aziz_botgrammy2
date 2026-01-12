import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class PremiumService {
  constructor(private prisma: PrismaService) {}

  async activatePremium(userId: number, durationDays: number) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + durationDays);

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        isPremium: true,
        premiumExpiresAt: expiresAt,
      },
    });
  }

  async deactivatePremium(userId: number) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        isPremium: false,
        premiumExpiresAt: null,
      },
    });
  }

  async checkPremiumStatus(userId: number): Promise<{
    isPremium: boolean;
    isExpired: boolean;
    expiresAt: Date | null;
  }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        isPremium: true,
        premiumExpiresAt: true,
      },
    });

    if (!user || !user.isPremium) {
      return { isPremium: false, isExpired: false, expiresAt: null };
    }

    const now = new Date();
    const isExpired = user.premiumExpiresAt && user.premiumExpiresAt < now;

    if (isExpired) {
      await this.deactivatePremium(userId);
      return {
        isPremium: false,
        isExpired: true,
        expiresAt: user.premiumExpiresAt,
      };
    }

    return {
      isPremium: true,
      isExpired: false,
      expiresAt: user.premiumExpiresAt,
    };
  }

  async getPremiumUsers() {
    return this.prisma.user.findMany({
      where: { isPremium: true },
      select: {
        id: true,
        telegramId: true,
        firstName: true,
        lastName: true,
        username: true,
        premiumExpiresAt: true,
      },
    });
  }

  async getPremiumSettings() {
    let settings = await this.prisma.premiumSettings.findFirst();

    if (!settings) {
      settings = await this.prisma.premiumSettings.create({
        data: {
          monthlyPrice: 50000,
          threeMonthPrice: 120000,
          sixMonthPrice: 200000,
          yearlyPrice: 350000,
          cardNumber: '8600 1234 5678 9012',
          cardHolder: 'ADMIN NAME',
          description:
            "Premium xususiyatlari: \n• Reklama yo'q\n• Cheksiz prosmotr",
        },
      });
    }

    return settings;
  }

  async getSettings() {
    return this.getPremiumSettings();
  }

  async updatePremiumSettings(data: {
    monthlyPrice?: number;
    threeMonthPrice?: number;
    sixMonthPrice?: number;
    yearlyPrice?: number;
    cardNumber?: string;
    cardHolder?: string;
    description?: string;
  }) {
    let settings = await this.prisma.premiumSettings.findFirst();

    if (!settings) {
      return this.prisma.premiumSettings.create({
        data: {
          monthlyPrice: data.monthlyPrice || 0,
          threeMonthPrice: data.threeMonthPrice || 0,
          sixMonthPrice: data.sixMonthPrice || 0,
          yearlyPrice: data.yearlyPrice || 0,
          currency: 'UZS',
          cardNumber: data.cardNumber || '',
          cardHolder: data.cardHolder || '',
          description: data.description || '',
        },
      });
    }

    return this.prisma.premiumSettings.update({
      where: { id: settings.id },
      data,
    });
  }

  async checkExpiredPremiums() {
    const now = new Date();

    const expiredUsers = await this.prisma.user.findMany({
      where: {
        isPremium: true,
        premiumExpiresAt: {
          lt: now,
        },
      },
    });

    for (const user of expiredUsers) {
      await this.deactivatePremium(user.id);
    }

    return expiredUsers.length;
  }

  async updatePrices(data: {
    monthlyPrice: number;
    threeMonthPrice: number;
    sixMonthPrice: number;
    yearlyPrice: number;
  }) {
    return this.updatePremiumSettings(data);
  }

  async updateCardInfo(data: { cardNumber: string; cardHolder: string }) {
    return this.updatePremiumSettings(data);
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Language } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findOrCreate(
    telegramId: string,
    data: {
      firstName?: string;
      lastName?: string;
      username?: string;
      languageCode?: string;
    },
  ) {
    let user = await this.prisma.user.findUnique({
      where: { telegramId },
    });

    if (!user) {
      const language = this.mapLanguageCode(data.languageCode);

      user = await this.prisma.user.create({
        data: {
          telegramId,
          firstName: data.firstName,
          lastName: data.lastName,
          username: data.username,
          language,
        },
      });
    }

    return user;
  }

  async findByTelegramId(telegramId: string) {
    return this.prisma.user.findUnique({
      where: { telegramId },
    });
  }

  async updateLanguage(telegramId: string, language: Language) {
    return this.prisma.user.update({
      where: { telegramId },
      data: { language },
    });
  }

  async blockUser(telegramId: string, reason?: string) {
    return this.prisma.user.update({
      where: { telegramId },
      data: {
        isBlocked: true,
        blockedAt: new Date(),
        blockReason: reason,
      },
    });
  }

  async unblockUser(telegramId: string) {
    return this.prisma.user.update({
      where: { telegramId },
      data: {
        isBlocked: false,
        blockedAt: null,
        blockReason: null,
      },
    });
  }

  async warnUser(telegramId: string) {
    return this.prisma.user.update({
      where: { telegramId },
      data: {
        warningCount: {
          increment: 1,
        },
      },
    });
  }

  async resetWarnings(telegramId: string) {
    return this.prisma.user.update({
      where: { telegramId },
      data: {
        warningCount: 0,
      },
    });
  }

  async getAllUsers() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAll() {
    return this.getAllUsers();
  }

  async getUserStatistics() {
    const [totalUsers, premiumUsers, blockedUsers, activeUsers] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.count({ where: { isPremium: true } }),
        this.prisma.user.count({ where: { isBlocked: true } }),
        this.prisma.user.count({
          where: {
            lastActivity: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
            },
          },
        }),
      ]);

    return {
      totalUsers,
      premiumUsers,
      blockedUsers,
      activeUsers,
    };
  }

  async updateLastActivity(telegramId: string) {
    return this.prisma.user.update({
      where: { telegramId },
      data: { lastActivity: new Date() },
    });
  }

  async getPremiumBannedUsers() {
    return this.prisma.user.findMany({
      where: { isPremiumBanned: true },
      orderBy: { premiumBannedAt: 'desc' },
    });
  }

  async unbanFromPremium(telegramId: string) {
    return this.prisma.user.update({
      where: { telegramId },
      data: {
        isPremiumBanned: false,
        premiumBannedAt: null,
        premiumBanCount: 0,
      },
    });
  }

  private mapLanguageCode(languageCode?: string): Language {
    if (!languageCode) return Language.UZ;

    const code = languageCode.toLowerCase();
    if (code.startsWith('ru')) return Language.RU;
    if (code.startsWith('en')) return Language.EN;
    return Language.UZ;
  }
}

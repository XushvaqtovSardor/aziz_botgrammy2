import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { BroadcastType } from '@prisma/client';

interface BroadcastResult {
  total: number;
  success: number;
  failed: number;
  failedUsers: number[];
}

@Injectable()
export class BroadcastService {
  constructor(private prisma: PrismaService) { }

  async create(data: {
    type: BroadcastType;
    messageText: string;
    createdBy: string;
    mediaFileId?: string;
  }) {
    return this.prisma.broadcast.create({
      data: {
        type: data.type,
        messageText: data.messageText,
        createdBy: data.createdBy,
        mediaFileId: data.mediaFileId,
        status: 'PENDING',
      },
    });
  }

  async findAll() {
    return this.prisma.broadcast.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async sendBroadcast(bot: any, broadcastId: number): Promise<BroadcastResult> {
    const broadcast = await this.prisma.broadcast.findUnique({
      where: { id: broadcastId },
    });

    if (!broadcast) {
      throw new Error('Broadcast not found');
    }
    const users = await this.getTargetUsers(broadcast.type);

    const result: BroadcastResult = {
      total: users.length,
      success: 0,
      failed: 0,
      failedUsers: [],
    };
    await this.updateStatus(broadcastId, 'IN_PROGRESS');
    for (const user of users) {
      try {
        await this.sendToUser(bot, user.telegramId, broadcast);
        result.success++;
        await this.delay(50);
      } catch (error) {
        result.failed++;
        result.failedUsers.push(Number(user.telegramId));
      }
    }
    await this.prisma.broadcast.update({
      where: { id: broadcastId },
      data: {
        status: 'COMPLETED',
        sentCount: result.success,
        failedCount: result.failed,
        completedAt: new Date(),
      },
    });

    return result;
  }

  private async getTargetUsers(type: BroadcastType) {
    switch (type) {
      case BroadcastType.ALL:
        return this.prisma.user.findMany({
          where: { isBlocked: false },
        });
      case BroadcastType.PREMIUM:
        return this.prisma.user.findMany({
          where: {
            isPremium: true,
            isBlocked: false,
          },
        });
      case BroadcastType.FREE:
        return this.prisma.user.findMany({
          where: {
            isPremium: false,
            isBlocked: false,
          },
        });
      default:
        return [];
    }
  }

  private async sendToUser(bot: any, telegramId: string, broadcast: any) {
    const chatId = parseInt(telegramId);
    const options: any = {};

    if (broadcast.buttonText && broadcast.buttonUrl) {
      options.reply_markup = {
        inline_keyboard: [
          [
            {
              text: broadcast.buttonText,
              url: broadcast.buttonUrl,
            },
          ],
        ],
      };
    }

    if (broadcast.photoFileId) {
      await bot.api.sendPhoto(telegramId, broadcast.photoFileId, {
        caption: broadcast.messageText || broadcast.message,
        ...options,
      });
    } else if (broadcast.videoFileId) {
      await bot.api.sendVideo(telegramId, broadcast.videoFileId, {
        caption: broadcast.messageText || broadcast.message,
        ...options,
      });
    } else {
      await bot.api.sendMessage(telegramId, broadcast.messageText || broadcast.message, options);
    }
  }

  private async updateStatus(broadcastId: number, status: string) {
    await this.prisma.broadcast.update({
      where: { id: broadcastId },
      data: { status: status as any },
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async getStatistics(broadcastId: number) {
    return this.prisma.broadcast.findUnique({
      where: { id: broadcastId },
      select: {
        sentCount: true,
        failedCount: true,
        status: true,
        createdAt: true,
        completedAt: true,
      },
    });
  }
}

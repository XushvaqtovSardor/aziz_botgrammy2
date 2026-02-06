import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ChannelStatus } from '@prisma/client';
import { Api } from 'grammy';

@Injectable()
export class ChannelStatusService {
  private readonly logger = new Logger(ChannelStatusService.name);

  constructor(private prisma: PrismaService) { }

  async updateStatus(
    userTelegramId: string,
    channelTelegramId: string,
    status: ChannelStatus,
  ): Promise<void> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { telegramId: userTelegramId },
      });

      if (!user) {
        return;
      }

      const channel = await this.prisma.mandatoryChannel.findFirst({
        where: { channelId: channelTelegramId, isActive: true },
      });

      if (!channel) {
        return;
      }

      await this.prisma.userChannelStatus.upsert({
        where: {
          userId_channelId: {
            userId: user.id,
            channelId: channel.id,
          },
        },
        create: {
          userId: user.id,
          channelId: channel.id,
          status,
          lastUpdated: new Date(),
        },
        update: {
          status,
          lastUpdated: new Date(),
        },
      });
    } catch (error) {
      this.logger.error(
        `Error updating status for user ${userTelegramId}, channel ${channelTelegramId}:`,
        error,
      );
    }
  }

  async getUserChannelStatuses(userTelegramId: string): Promise<
    {
      channelId: number;
      channelTelegramId: string;
      channelName: string;
      channelType: string;
      channelLink: string;
      status: ChannelStatus;
    }[]
  > {
    const user = await this.prisma.user.findUnique({
      where: { telegramId: userTelegramId },
    });

    if (!user) {
      return [];
    }

    const channels = await this.prisma.mandatoryChannel.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
      include: {
        userStatuses: {
          where: { userId: user.id },
        },
      },
    });

    return channels.map((channel) => ({
      channelId: channel.id,
      channelTelegramId: channel.channelId,
      channelName: channel.channelName,
      channelType: channel.type,
      channelLink: channel.channelLink,
      status: channel.userStatuses[0]?.status || ChannelStatus.left,
    }));
  }

  async canUserAccessBot(userTelegramId: string): Promise<{
    canAccess: boolean;
    statuses: {
      channelId: number;
      channelName: string;
      channelLink: string;
      channelType: string;
      status: ChannelStatus;
    }[];
  }> {
    const statuses = await this.getUserChannelStatuses(userTelegramId);

    const nonExternalStatuses = statuses.filter(
      (s) => s.channelType !== 'EXTERNAL',
    );

    const externalStatuses = statuses.filter(
      (s) => s.channelType === 'EXTERNAL',
    );

    const user = await this.prisma.user.findUnique({
      where: { telegramId: userTelegramId },
    });

    const canAccess = nonExternalStatuses.every((s) => {
      // For all channel types including PRIVATE_WITH_ADMIN_APPROVAL,
      // user must have joined or sent a request
      return (
        s.status === ChannelStatus.joined ||
        s.status === ChannelStatus.requested
      );
    });

    return {
      canAccess,
      statuses: [
        ...nonExternalStatuses.map((s) => ({
          channelId: s.channelId,
          channelName: s.channelName,
          channelLink: s.channelLink,
          channelType: s.channelType,
          status: s.status,
        })),
        ...externalStatuses.map((s) => ({
          channelId: s.channelId,
          channelName: s.channelName,
          channelLink: s.channelLink,
          channelType: s.channelType,
          status: ChannelStatus.left,
        })),
      ],
    };
  }

  async syncUserChannelStatuses(
    userTelegramId: string,
    api: Api,
  ): Promise<void> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { telegramId: userTelegramId },
      });

      if (!user) {
        return;
      }

      const channels = await this.prisma.mandatoryChannel.findMany({
        where: { isActive: true },
      });

      for (const channel of channels) {
        // EXTERNAL va channelId bo'lmagan kanallar uchun API tekshirish yo'q
        if (channel.type === 'EXTERNAL' || !channel.channelId) {
          continue;
        }

        // PRIVATE_WITH_ADMIN_APPROVAL uchun faqat database statusga qaraymiz
        if (channel.type === 'PRIVATE_WITH_ADMIN_APPROVAL') {
          continue;
        }

        try {
          const member = await api.getChatMember(
            channel.channelId,
            parseInt(userTelegramId),
          );

          let newStatus: ChannelStatus;

          if (
            member.status === 'member' ||
            member.status === 'administrator' ||
            member.status === 'creator' ||
            (member.status === 'restricted' &&
              'is_member' in member &&
              member.is_member)
          ) {
            newStatus = ChannelStatus.joined;
          } else if (member.status === 'left' || member.status === 'kicked') {
            // Agar foydalanuvchi so'rov yuborgan bo'lsa, statusni saqlab qolamiz
            const existingStatus =
              await this.prisma.userChannelStatus.findUnique({
                where: {
                  userId_channelId: {
                    userId: user.id,
                    channelId: channel.id,
                  },
                },
              });

            if (existingStatus?.status === ChannelStatus.requested) {
              continue; // So'rov yuborilgan statusni saqlab qolish
            }

            newStatus = ChannelStatus.left;
          } else {
            newStatus = ChannelStatus.left;
          }

          await this.updateStatus(userTelegramId, channel.channelId, newStatus);
        } catch (error) {
          this.logger.error(
            `Error checking channel ${channel.channelName} for user ${userTelegramId}:`,
            error instanceof Error ? error.message : String(error),
          );
          // Xato bo'lganda statusni o'zgartirmaymiz
        }
      }
    } catch (error) {
      this.logger.error(
        `Error syncing statuses for user ${userTelegramId}:`,
        error,
      );
    }
  }
}

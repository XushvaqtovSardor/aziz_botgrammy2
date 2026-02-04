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
        this.logger.warn(`User ${userTelegramId} not found`);
        return;
      }

      const channel = await this.prisma.mandatoryChannel.findFirst({
        where: { channelId: channelTelegramId, isActive: true },
      });

      if (!channel) {
        this.logger.warn(`Channel ${channelTelegramId} not found`);
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

    // Get user to check for approved join requests
    const user = await this.prisma.user.findUnique({
      where: { telegramId: userTelegramId },
    });

    // Check if all required channels are satisfied
    const canAccess = nonExternalStatuses.every((s) => {
      // For regular channels, user must be joined or requested
      if (s.channelType !== 'PRIVATE_WITH_ADMIN_APPROVAL') {
        return (
          s.status === ChannelStatus.joined ||
          s.status === ChannelStatus.requested
        );
      }

      // For PRIVATE_WITH_ADMIN_APPROVAL channels, check if user has an approved request
      if (user) {
        const channelId = s.channelId;
        // We need to check the ChannelJoinRequest table
        // This will be done in the checkSubscription method
        return true; // For now, we'll handle this in checkSubscription
      }

      return false;
    });

    return {
      canAccess,
      statuses: [
        ...nonExternalStatuses.map((s) => ({
          channelName: s.channelName,
          channelLink: s.channelLink,
          channelType: s.channelType,
          status: s.status,
        })),
        ...externalStatuses.map((s) => ({
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
        this.logger.warn(`User ${userTelegramId} not found for sync`);
        return;
      }

      const channels = await this.prisma.mandatoryChannel.findMany({
        where: { isActive: true },
      });

      for (const channel of channels) {
        if (channel.type === 'EXTERNAL' || !channel.channelId) {
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
            const existingStatus =
              await this.prisma.userChannelStatus.findUnique({
                where: {
                  userId_channelId: {
                    userId: user.id,
                    channelId: channel.id,
                  },
                },
              });

            newStatus =
              existingStatus?.status === ChannelStatus.requested
                ? ChannelStatus.requested
                : ChannelStatus.left;
          } else {
            newStatus = ChannelStatus.left;
          }

          await this.updateStatus(userTelegramId, channel.channelId, newStatus);
        } catch (error) {
          this.logger.error(
            `Error checking channel ${channel.channelName} for user ${userTelegramId}:`,
            error instanceof Error ? error.message : String(error),
          );
          await this.updateStatus(
            userTelegramId,
            channel.channelId,
            ChannelStatus.left,
          );
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

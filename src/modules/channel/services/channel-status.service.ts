import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ChannelStatus } from '@prisma/client';
import { Api } from 'grammy';

@Injectable()
export class ChannelStatusService {
  private readonly logger = new Logger(ChannelStatusService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Update user's channel status in database
   */
  async updateStatus(
    userTelegramId: string,
    channelTelegramId: string,
    status: ChannelStatus,
  ): Promise<void> {
    try {
      // Find user
      const user = await this.prisma.user.findUnique({
        where: { telegramId: userTelegramId },
      });

      if (!user) {
        this.logger.warn(`User ${userTelegramId} not found`);
        return;
      }

      // Find channel
      const channel = await this.prisma.mandatoryChannel.findFirst({
        where: { channelId: channelTelegramId, isActive: true },
      });

      if (!channel) {
        this.logger.warn(`Channel ${channelTelegramId} not found`);
        return;
      }

      // Upsert status
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

      this.logger.debug(
        `Updated status: User ${userTelegramId} -> Channel ${channel.channelName}: ${status}`,
      );
    } catch (error) {
      this.logger.error(
        `Error updating status for user ${userTelegramId}, channel ${channelTelegramId}:`,
        error,
      );
    }
  }

  /**
   * Get user's status for all mandatory channels
   */
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
    // Find user
    const user = await this.prisma.user.findUnique({
      where: { telegramId: userTelegramId },
    });

    if (!user) {
      return [];
    }

    // Get all active channels with user statuses
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

  /**
   * Check if user can access bot (all channels are joined or requested)
   */
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

    // EXTERNAL channels cannot be automatically checked
    // We consider them as always needing user confirmation
    // For bot access: ALL non-external channels must be 'joined' or 'requested'
    // EXTERNAL channels are always shown to user but don't block access

    const nonExternalStatuses = statuses.filter(
      (s) => s.channelType !== 'EXTERNAL',
    );

    const externalStatuses = statuses.filter(
      (s) => s.channelType === 'EXTERNAL',
    );

    // User can access if ALL non-external channels are either 'joined' or 'requested'
    const canAccess = nonExternalStatuses.every(
      (s) =>
        s.status === ChannelStatus.joined ||
        s.status === ChannelStatus.requested,
    );

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
          status: ChannelStatus.left, // Always show as not joined for external
        })),
      ],
    };
  }

  /**
   * Sync user's channel statuses with real-time Telegram API check
   * This should be called when user presses "Check subscription" button
   */
  async syncUserChannelStatuses(
    userTelegramId: string,
    api: Api,
  ): Promise<void> {
    try {
      // Find user
      const user = await this.prisma.user.findUnique({
        where: { telegramId: userTelegramId },
      });

      if (!user) {
        this.logger.warn(`User ${userTelegramId} not found for sync`);
        return;
      }

      // Get all active channels
      const channels = await this.prisma.mandatoryChannel.findMany({
        where: { isActive: true },
      });

      for (const channel of channels) {
        // Skip external channels (cannot check via API)
        if (channel.type === 'EXTERNAL' || !channel.channelId) {
          continue;
        }

        try {
          // Check user's membership via Telegram API
          const member = await api.getChatMember(
            channel.channelId,
            parseInt(userTelegramId),
          );

          // Determine status based on member.status
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
            // Check if there's a pending request in database
            const existingStatus =
              await this.prisma.userChannelStatus.findUnique({
                where: {
                  userId_channelId: {
                    userId: user.id,
                    channelId: channel.id,
                  },
                },
              });

            // Keep 'requested' status if it exists, otherwise mark as 'left'
            newStatus =
              existingStatus?.status === ChannelStatus.requested
                ? ChannelStatus.requested
                : ChannelStatus.left;
          } else {
            newStatus = ChannelStatus.left;
          }

          // Update status in database
          await this.updateStatus(userTelegramId, channel.channelId, newStatus);

          this.logger.debug(
            `Synced status: User ${userTelegramId} -> Channel ${channel.channelName}: ${newStatus} (API: ${member.status})`,
          );
        } catch (error) {
          this.logger.error(
            `Error checking channel ${channel.channelName} for user ${userTelegramId}:`,
            error.message,
          );
          // On error, mark as left (user probably not in channel)
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

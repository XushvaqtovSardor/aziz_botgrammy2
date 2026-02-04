import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ChannelType } from '@prisma/client';
import { Api } from 'grammy';

export interface SubscriptionStatus {
  isSubscribed: boolean;
  notSubscribedChannels: {
    channelId: string;
    channelName: string;
    channelLink: string;
  }[];
}

@Injectable()
export class ChannelService {
  private readonly logger = new Logger(ChannelService.name);

  constructor(private prisma: PrismaService) { }

  async create(
    channelId: string,
    channelName: string,
    channelLink: string,
    order?: number,
  ) {
    return this.prisma.mandatoryChannel.create({
      data: {
        channelId,
        channelName,
        channelLink,
        order: order || 0,
      },
    });
  }

  async findAll() {
    return this.prisma.mandatoryChannel.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
      select: {
        id: true,
        createdAt: true,
        channelId: true,
        channelLink: true,
        isActive: true,
        type: true,
        channelName: true,
        order: true,
        memberLimit: true,
        currentMembers: true,
        pendingRequests: true,
      },
    });
  }

  async findOne(id: number) {
    return this.prisma.mandatoryChannel.findUnique({
      where: { id },
    });
  }

  async update(
    id: number,
    data: {
      channelId?: string;
      channelName?: string;
      channelLink?: string;
      order?: number;
      isActive?: boolean;
    },
  ) {
    return this.prisma.mandatoryChannel.update({
      where: { id },
      data,
    });
  }

  async delete(id: number) {
    return this.prisma.mandatoryChannel.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async reorder(ids: number[]) {
    const updates = ids.map((id, index) =>
      this.prisma.mandatoryChannel.update({
        where: { id },
        data: { order: index },
      }),
    );

    await this.prisma.$transaction(updates);
  }

  async findAllMandatory() {
    return this.prisma.mandatoryChannel.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
      select: {
        id: true,
        createdAt: true,
        channelId: true,
        channelLink: true,
        isActive: true,
        type: true,
        channelName: true,
        order: true,
        memberLimit: true,
        currentMembers: true,
        pendingRequests: true,
      },
    });
  }

  async findAllDatabase() {
    return this.prisma.databaseChannel.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createDatabaseChannel(data: {
    channelId: string;
    channelName: string;
    channelLink?: string;
    isActive?: boolean;
  }) {
    return this.prisma.databaseChannel.create({
      data: {
        channelId: data.channelId,
        channelName: data.channelName,
        channelLink: data.channelLink,
        isActive: data.isActive ?? true,
      },
    });
  }

  async createMandatoryChannel(data: {
    channelId?: string;
    channelName: string;
    channelLink: string;
    type: ChannelType;
    isActive?: boolean;
    memberLimit?: number | null;
  }) {
    return this.prisma.mandatoryChannel.create({
      data: {
        channelId: data.channelId || null,
        channelName: data.channelName,
        channelLink: data.channelLink,
        type: data.type,
        isActive: data.isActive ?? true,
        memberLimit: data.memberLimit,
        currentMembers: 0,
        pendingRequests: 0,
        order: 0,
      },
    });
  }

  async incrementMemberCount(channelId: number) {
    const channel = await this.prisma.mandatoryChannel.findUnique({
      where: { id: channelId },
    });

    if (!channel) return null;

    const updated = await this.prisma.mandatoryChannel.update({
      where: { id: channelId },
      data: {
        currentMembers: { increment: 1 },
      },
    });

    if (
      updated.memberLimit !== null &&
      updated.currentMembers >= updated.memberLimit
    ) {
      await this.prisma.mandatoryChannel.update({
        where: { id: channelId },
        data: { isActive: false },
      });
    }

    return updated;
  }

  async incrementPendingRequests(channelId: number) {
    return this.prisma.mandatoryChannel.update({
      where: { id: channelId },
      data: {
        pendingRequests: { increment: 1 },
      },
    });
  }

  async decrementPendingRequests(channelId: number) {
    return this.prisma.mandatoryChannel.update({
      where: { id: channelId },
      data: {
        pendingRequests: { decrement: 1 },
      },
    });
  }

  async deleteDatabaseChannel(id: number) {
    return this.prisma.databaseChannel.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async checkSubscription(
    userId: number,
    api: Api,
  ): Promise<SubscriptionStatus> {
    const channels = await this.prisma.mandatoryChannel.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });

    const notSubscribed = [];

    for (const channel of channels) {
      try {
        const member = await api.getChatMember(channel.channelId, userId);

        if (!['member', 'administrator', 'creator'].includes(member.status)) {
          notSubscribed.push({
            channelId: channel.channelId,
            channelName: channel.channelName,
            channelLink: channel.channelLink,
          });
        }
      } catch (error) {
        notSubscribed.push({
          channelId: channel.channelId,
          channelName: channel.channelName,
          channelLink: channel.channelLink,
        });
      }
    }

    return {
      isSubscribed: notSubscribed.length === 0,
      notSubscribedChannels: notSubscribed,
    };
  }

  async checkUserSubscriptionStatus(
    userId: number,
    api: Api,
    joinRequestCache: Map<string, number>,
  ) {
    const allChannels = await this.prisma.mandatoryChannel.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });

    const unsubscribedChannels: {
      id: number;
      channelId: string;
      channelName: string;
      channelLink: string;
      type: string;
      status?: string;
      isExternal: boolean;
    }[] = [];

    const subscribedChannels: {
      id: number;
      channelId: string;
      channelName: string;
      type: string;
      isSubscribed: boolean;
      hasPendingRequest: boolean;
    }[] = [];

    for (const channel of allChannels) {
      if (channel.type === 'EXTERNAL') {
        unsubscribedChannels.push({
          id: channel.id,
          channelId: channel.channelId,
          channelName: channel.channelName,
          channelLink: channel.channelLink,
          type: channel.type,
          isExternal: true,
        });
        continue;
      }

      const cacheKey = `${userId}_${channel.channelId}`;
      const hasPendingRequest = joinRequestCache.has(cacheKey);

      try {
        const member = await api.getChatMember(channel.channelId, userId);

        const isSubscribed =
          member.status === 'member' ||
          member.status === 'administrator' ||
          member.status === 'creator' ||
          (member.status === 'restricted' &&
            'is_member' in member &&
            member.is_member);

        if (isSubscribed && hasPendingRequest) {
          joinRequestCache.delete(cacheKey);
        }

        const hasAccess =
          isSubscribed || (hasPendingRequest && channel.type === 'PRIVATE');

        if (
          (member.status === 'left' || member.status === 'kicked') &&
          !hasAccess
        ) {
          if (hasPendingRequest) {
            joinRequestCache.delete(cacheKey);
          }
          unsubscribedChannels.push({
            id: channel.id,
            channelId: channel.channelId,
            channelName: channel.channelName,
            channelLink: channel.channelLink,
            type: channel.type,
            status: member.status,
            isExternal: false,
          });
          continue;
        }

        if (hasAccess) {
          // Track user subscription in UserChannelStatus to count members
          if (isSubscribed && (channel.type === 'PUBLIC' || channel.type === 'PRIVATE')) {
            // Get the internal user ID from database
            const user = await this.prisma.user.findUnique({
              where: { telegramId: String(userId) },
            });

            if (user) {
              const userChannelStatus = await this.prisma.userChannelStatus.findUnique({
                where: {
                  userId_channelId: {
                    userId: user.id,
                    channelId: channel.id,
                  },
                },
              });

              // If this is the first time user joined, increment the count
              if (!userChannelStatus || userChannelStatus.status !== 'joined') {
                const wasRequested = userChannelStatus?.status === 'requested';

                await this.incrementMemberCount(channel.id);

                // If user was in pending state and now joined, decrement pending count
                if (wasRequested && channel.type === 'PRIVATE') {
                  await this.decrementPendingRequests(channel.id);
                  this.logger.log(`User ${userId} approved in channel ${channel.channelName}. Decremented pending requests.`);
                }

                // Update or create the status
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
                    status: 'joined',
                    lastUpdated: new Date(),
                  },
                  update: {
                    status: 'joined',
                    lastUpdated: new Date(),
                  },
                });

                this.logger.log(`User ${userId} joined channel ${channel.channelName}. Member count: incremented.`);
              }
            }
          }

          subscribedChannels.push({
            id: channel.id,
            channelId: channel.channelId,
            channelName: channel.channelName,
            type: channel.type,
            isSubscribed: isSubscribed,
            hasPendingRequest: hasPendingRequest && !isSubscribed,
          });
        } else {
          unsubscribedChannels.push({
            id: channel.id,
            channelId: channel.channelId,
            channelName: channel.channelName,
            channelLink: channel.channelLink,
            type: channel.type,
            status: member.status,
            isExternal: false,
          });
        }
      } catch (error) {
        if (hasPendingRequest) {
          joinRequestCache.delete(cacheKey);
        }
        unsubscribedChannels.push({
          id: channel.id,
          channelId: channel.channelId,
          channelName: channel.channelName,
          channelLink: channel.channelLink,
          type: channel.type,
          status: 'not_member',
          isExternal: false,
        });
      }
    }

    return {
      allChannels,
      unsubscribedChannels,
      subscribedChannels,
      totalChannels: allChannels.length,
      unsubscribedCount: unsubscribedChannels.length,
      subscribedCount: subscribedChannels.length,
      canAccessBot:
        unsubscribedChannels.filter((ch) => !ch.isExternal).length === 0,
    };
  }

  async hasNewChannels(userId: number, lastCheckDate: Date): Promise<boolean> {
    const newChannels = await this.prisma.mandatoryChannel.count({
      where: {
        isActive: true,
        createdAt: {
          gt: lastCheckDate,
        },
      },
    });

    return newChannels > 0;
  }

  async findAllWithHistory() {
    return this.prisma.mandatoryChannel.findMany({
      orderBy: [
        { isActive: 'desc' }, // Active kanallar birinchi
        { createdAt: 'desc' }, // Eng yangilar birinchi
      ],
      select: {
        id: true,
        createdAt: true,
        channelId: true,
        channelLink: true,
        isActive: true,
        type: true,
        channelName: true,
        order: true,
        memberLimit: true,
        currentMembers: true,
        pendingRequests: true,
      },
    });
  }

  async findByLink(link: string) {
    return this.prisma.mandatoryChannel.findFirst({
      where: {
        channelLink: {
          contains: link,
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        createdAt: true,
        channelId: true,
        channelLink: true,
        isActive: true,
        type: true,
        channelName: true,
        order: true,
        memberLimit: true,
        currentMembers: true,
        pendingRequests: true,
      },
    });
  }
}

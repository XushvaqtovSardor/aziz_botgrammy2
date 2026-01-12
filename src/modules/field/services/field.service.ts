import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class FieldService {
  constructor(private prisma: PrismaService) {}

  private deriveChannelId(channelId?: string, channelLink?: string): string {
    const cleanedId = channelId?.trim();
    if (cleanedId) return cleanedId;

    const link = channelLink?.trim();
    if (!link) {
      throw new Error('channelLink yoki channelId majburiy');
    }

    if (link.startsWith('@') || link.startsWith('-100')) {
      return link;
    }

    const match = link.match(/(?:https?:\/\/)?t\.me\/([^/?#]+)/i);
    if (match?.[1]) {
      return '@' + match[1];
    }

    if (/^[A-Za-z0-9_]{5,}$/.test(link)) {
      return '@' + link;
    }

    throw new Error(
      "Kanal linki noto'g'ri. Masalan: https://t.me/kanal_nomi yoki @kanal_nomi",
    );
  }

  async create(data: {
    name: string;
    channelId?: string;
    channelLink?: string;
    databaseChannelId?: number;
  }) {
    const derivedChannelId = this.deriveChannelId(
      data.channelId,
      data.channelLink,
    );
    return this.prisma.field.create({
      data: {
        name: data.name,
        channelId: derivedChannelId,
        channelLink: data.channelLink,
        databaseChannelId: data.databaseChannelId,
        isActive: true,
      },
      include: {
        databaseChannel: true,
      },
    });
  }

  async getContentCount(fieldId: number, contentType: 'MOVIE' | 'SERIAL') {
    if (contentType === 'MOVIE') {
      return this.prisma.movie.count({ where: { fieldId } });
    } else {
      return this.prisma.serial.count({ where: { fieldId } });
    }
  }

  async findAll() {
    return this.prisma.field.findMany({
      where: { isActive: true },
      include: {
        databaseChannel: true,
        _count: {
          select: {
            movies: true,
            serials: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    return this.prisma.field.findUnique({
      where: { id },
    });
  }

  async findByChannelId(channelId: string) {
    return this.prisma.field.findUnique({
      where: { channelId },
    });
  }

  async update(
    id: number,
    data: {
      name?: string;
      channelId?: string;
      channelLink?: string;
      isActive?: boolean;
    },
  ) {
    return this.prisma.field.update({
      where: { id },
      data,
    });
  }

  async delete(id: number) {
    return this.prisma.field.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async hardDelete(id: number) {
    return this.prisma.field.delete({
      where: { id },
    });
  }
}

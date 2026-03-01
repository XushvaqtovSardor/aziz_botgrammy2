import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ContentType } from '@prisma/client';

@Injectable()
export class WatchHistoryService {
  constructor(private prisma: PrismaService) {}

  async recordMovieWatch(userId: number, movieId: number) {
    return this.prisma.watchHistory.create({
      data: {
        userId,
        contentType: ContentType.MOVIE,
        movieId,
      },
    });
  }

  async recordSerialWatch(
    userId: number,
    serialId: number,
    episodeId?: number,
  ) {
    return this.prisma.watchHistory.create({
      data: {
        userId,
        contentType: ContentType.SERIAL,
        serialId,
        episodeId,
      },
    });
  }

  async getUserHistory(userId: number, limit: number = 20) {
    return this.prisma.watchHistory.findMany({
      where: { userId },
      include: {
        movie: {
          include: {
            field: true,
          },
        },
        serial: {
          include: {
            field: true,
          },
        },
      },
      orderBy: { watchedAt: 'desc' },
      take: limit,
    });
  }

  async getActiveUsers(days: number = 30) {
    const date = new Date();
    date.setDate(date.getDate() - days);

    const uniqueUsers = await this.prisma.watchHistory.groupBy({
      by: ['userId'],
      where: {
        watchedAt: {
          gte: date,
        },
      },
    });

    return uniqueUsers.length;
  }

  async getNewUsers(days: number = 30) {
    const date = new Date();
    date.setDate(date.getDate() - days);

    return this.prisma.user.count({
      where: {
        createdAt: {
          gte: date,
        },
      },
    });
  }

  async getMostWatchedContent(limit: number = 10) {
    const movies = await this.prisma.movie.findMany({
      take: limit,
      orderBy: { views: 'desc' },
      select: {
        code: true,
        title: true,
        views: true,
      },
    });

    const serials = await this.prisma.serial.findMany({
      take: limit,
      orderBy: { views: 'desc' },
      select: {
        code: true,
        title: true,
        views: true,
      },
    });

    return {
      movies,
      serials,
    };
  }
}

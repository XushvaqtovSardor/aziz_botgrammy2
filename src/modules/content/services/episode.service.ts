import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { EpisodeData } from '../interfaces/content-data.interface';

@Injectable()
export class EpisodeService {
  constructor(private prisma: PrismaService) {}

  async create(data: EpisodeData) {
    return this.prisma.episode.create({
      data,
      include: {
        serial: true,
      },
    });
  }

  async findBySerialId(serialId: number) {
    return this.prisma.episode.findMany({
      where: { serialId },
      orderBy: { episodeNumber: 'asc' },
    });
  }

  async findBySerialIdAndNumber(serialId: number, episodeNumber: number) {
    return this.prisma.episode.findUnique({
      where: {
        serialId_episodeNumber: {
          serialId,
          episodeNumber,
        },
      },
      include: {
        serial: true,
      },
    });
  }

  async findAllBySerial(serialId: number) {
    return this.prisma.episode.findMany({
      where: { serialId },
      orderBy: { episodeNumber: 'asc' },
    });
  }

  async update(
    id: number,
    data: Partial<Omit<EpisodeData, 'serialId' | 'episodeNumber'>>,
  ) {
    return this.prisma.episode.update({
      where: { id },
      data,
    });
  }

  async delete(id: number) {
    return this.prisma.episode.delete({
      where: { id },
    });
  }

  async incrementViews(id: number) {
    return this.prisma.episode.update({
      where: { id },
      data: {
        views: {
          increment: 1,
        },
      },
    });
  }

  async getNextEpisodeNumber(serialId: number): Promise<number> {
    const lastEpisode = await this.prisma.episode.findFirst({
      where: { serialId },
      orderBy: { episodeNumber: 'desc' },
    });

    return lastEpisode ? lastEpisode.episodeNumber + 1 : 1;
  }

  formatEpisodeCaption(episode: any): string {
    let caption = `#${episode.serial.code} ${episode.serial.title}\n`;
    caption += `📺 ${episode.episodeNumber}-қисм\n\n`;

    if (episode.title) caption += `Номи: ${episode.title}\n`;
    if (episode.description) caption += `\n${episode.description}`;

    return caption;
  }

  async postToChannel(
    bot: any,
    channelId: string,
    episode: any,
    videoFileId: string,
  ) {
    const caption = this.formatEpisodeCaption(episode);

    return bot.telegram.sendVideo(channelId, videoFileId, {
      caption,
    });
  }
}

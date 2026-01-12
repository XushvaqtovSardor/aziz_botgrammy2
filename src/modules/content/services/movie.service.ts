import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { MovieData } from '../interfaces/content-data.interface';
import { CodeGeneratorService } from '../utils/code-generator.service';

@Injectable()
export class MovieService {
  constructor(
    private prisma: PrismaService,
    private codeGenerator: CodeGeneratorService,
  ) {}

  async create(data: MovieData) {
    const { thumbnailFileId, ...movieData } = data;
    const codeNum =
      typeof data.code === 'string' ? parseInt(data.code) : data.code;

    return this.prisma.movie.create({
      data: {
        ...movieData,
        code: codeNum,
        posterFileId: data.posterFileId || data.thumbnailFileId || '',
        videoMessageId: data.videoMessageId || '',
        shareLink: this.generateShareLink(String(codeNum)),
      },
      include: {
        field: true,
      },
    });
  }

  async findByCode(code: string) {
    const codeNum = parseInt(code);
    if (isNaN(codeNum)) return null;

    return this.prisma.movie.findUnique({
      where: { code: codeNum },
      include: {
        field: true,
      },
    });
  }

  async findById(id: number) {
    return this.prisma.movie.findUnique({
      where: { id },
      include: {
        field: true,
      },
    });
  }

  async isCodeAvailable(code: number): Promise<boolean> {
    return this.codeGenerator.isCodeAvailable(String(code));
  }

  async findNearestAvailableCodes(
    requestedCode: number,
    count: number = 5,
  ): Promise<number[]> {
    const availableCodes: number[] = [];
    let offset = 1;

    // Search both up and down from the requested code
    while (availableCodes.length < count && offset <= 1000) {
      // Check higher code
      const higherCode = requestedCode + offset;
      if (await this.isCodeAvailable(higherCode)) {
        availableCodes.push(higherCode);
      }

      // Check lower code (only if positive)
      if (requestedCode - offset > 0) {
        const lowerCode = requestedCode - offset;
        if (await this.isCodeAvailable(lowerCode)) {
          availableCodes.push(lowerCode);
        }
      }

      offset++;
    }

    return availableCodes
      .sort((a, b) => {
        // Sort by distance from requested code
        const distA = Math.abs(a - requestedCode);
        const distB = Math.abs(b - requestedCode);
        return distA - distB;
      })
      .slice(0, count);
  }

  async findAll(fieldId?: number) {
    return this.prisma.movie.findMany({
      where: fieldId ? { fieldId } : undefined,
      include: {
        field: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: number, data: Partial<Omit<MovieData, 'code' | 'fieldId'>>) {
    return this.prisma.movie.update({
      where: { id },
      data,
    });
  }

  async delete(id: number) {
    return this.prisma.movie.delete({
      where: { id },
    });
  }

  async incrementViews(code: string) {
    const codeNum = parseInt(code);
    if (isNaN(codeNum)) return null;

    return this.prisma.movie.update({
      where: { code: codeNum },
      data: {
        views: {
          increment: 1,
        },
      },
    });
  }

  async getTopMovies(limit: number = 10) {
    return this.prisma.movie.findMany({
      take: limit,
      orderBy: { views: 'desc' },
      include: {
        field: true,
      },
    });
  }

  async search(query: string) {
    // Try to parse query as number for code search
    const codeQuery = parseInt(query);

    return this.prisma.movie.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { genre: { contains: query, mode: 'insensitive' } },
          ...(isNaN(codeQuery) ? [] : [{ code: codeQuery }]),
        ],
      },
      include: {
        field: true,
      },
      take: 20,
    });
  }

  formatMovieCaption(movie: any): string {
    let caption = `#${movie.code} ${movie.title}\n\n`;

    if (movie.genre) caption += `🎭 Жанр: ${movie.genre}\n`;
    if (movie.language) caption += `🗣 Тил: ${movie.language}\n`;
    if (movie.quality) caption += `📹 Сифат: ${movie.quality}\n`;
    if (movie.year) caption += `📅 Йил: ${movie.year}\n`;
    caption += `📁 Field: ${movie.field.name}\n`;
    if (movie.description) caption += `\n${movie.description}`;

    return caption;
  }

  private generateShareLink(code: string): string {
    return `https://t.me/share/url?url=🎬 Кино: ${code}`;
  }

  async postToChannel(
    bot: any,
    channelId: string,
    movie: any,
    posterFileId: string,
  ) {
    const caption = this.formatMovieCaption(movie);

    return bot.telegram.sendPhoto(channelId, posterFileId, {
      caption,
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '▶️ Томоша қилиш',
              callback_data: `watch_movie_${movie.code}`,
            },
          ],
        ],
      },
    });
  }
}

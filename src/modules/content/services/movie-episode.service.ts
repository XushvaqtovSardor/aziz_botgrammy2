import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

export interface MovieEpisodeData {
  movieId: number;
  episodeNumber: number;
  videoFileId: string;
  videoMessageId: string;
  title?: string;
  description?: string;
}

@Injectable()
export class MovieEpisodeService {
  constructor(private prisma: PrismaService) {}

  async create(data: MovieEpisodeData) {
    return this.prisma.movieEpisode.create({
      data,
      include: {
        movie: true,
      },
    });
  }

  async findByMovieId(movieId: number) {
    return this.prisma.movieEpisode.findMany({
      where: { movieId },
      orderBy: { episodeNumber: 'asc' },
    });
  }

  async findByMovieIdAndNumber(movieId: number, episodeNumber: number) {
    return this.prisma.movieEpisode.findUnique({
      where: {
        movieId_episodeNumber: {
          movieId,
          episodeNumber,
        },
      },
      include: {
        movie: true,
      },
    });
  }

  async deleteByMovieIdAndNumber(movieId: number, episodeNumber: number) {
    return this.prisma.movieEpisode.delete({
      where: {
        movieId_episodeNumber: {
          movieId,
          episodeNumber,
        },
      },
    });
  }

  async deleteByMovieId(movieId: number) {
    return this.prisma.movieEpisode.deleteMany({
      where: { movieId },
    });
  }
}

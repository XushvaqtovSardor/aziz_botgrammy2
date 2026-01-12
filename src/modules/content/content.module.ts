import { Module } from '@nestjs/common';
import { MovieService } from './services/movie.service';
import { SerialService } from './services/serial.service';
import { EpisodeService } from './services/episode.service';
import { MovieEpisodeService } from './services/movie-episode.service';
import { WatchHistoryService } from './services/watch-history.service';
import { CodeGeneratorService } from './utils/code-generator.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [
    MovieService,
    SerialService,
    EpisodeService,
    MovieEpisodeService,
    WatchHistoryService,
    CodeGeneratorService,
  ],
  exports: [
    MovieService,
    SerialService,
    EpisodeService,
    MovieEpisodeService,
    WatchHistoryService,
    CodeGeneratorService,
  ],
})
export class ContentModule {}

import { Module } from '@nestjs/common';
import { ChannelService } from './services/channel.service';
import { ChannelStatusService } from './services/channel-status.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [ChannelService, ChannelStatusService],
  exports: [ChannelService, ChannelStatusService],
})
export class ChannelModule {}

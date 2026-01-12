import { Module } from '@nestjs/common';
import { BroadcastService } from './services/broadcast.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [BroadcastService],
  exports: [BroadcastService],
})
export class BroadcastModule {}

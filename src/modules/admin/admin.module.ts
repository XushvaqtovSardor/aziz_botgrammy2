import { Module } from '@nestjs/common';
import { AdminService } from './services/admin.service';
import { SessionService } from './services/session.service';
import { SerialManagementService } from './services/serial-management.service';
import { AdminGuard } from './guards/admin.guard';
import { RolesGuard } from './guards/roles.guard';
import { PrismaModule } from '../../prisma/prisma.module';
import { ContentModule } from '../content/content.module';
import { FieldModule } from '../field/field.module';
import { ChannelModule } from '../channel/channel.module';
import { GrammyBotModule } from '../../common/grammy/grammy-bot.module';

@Module({
  imports: [
    PrismaModule,
    ContentModule,
    FieldModule,
    ChannelModule,
    GrammyBotModule,
  ],
  providers: [
    AdminService,
    SessionService,
    SerialManagementService,
    AdminGuard,
    RolesGuard,
  ],
  exports: [
    AdminService,
    SessionService,
    SerialManagementService,
    AdminGuard,
    RolesGuard,
  ],
})
export class AdminModule {}

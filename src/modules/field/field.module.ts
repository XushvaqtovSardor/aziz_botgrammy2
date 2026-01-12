import { Module } from '@nestjs/common';
import { FieldService } from './services/field.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [FieldService],
  exports: [FieldService],
})
export class FieldModule {}

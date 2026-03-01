import { Module, Global } from '@nestjs/common';
import { LanguageService } from './language.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [LanguageService],
  exports: [LanguageService],
})
export class LanguageModule {}

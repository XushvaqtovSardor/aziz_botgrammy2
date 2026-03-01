import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class CodeGeneratorService {
  constructor(private prisma: PrismaService) {}

  async isCodeAvailable(code: string): Promise<boolean> {
    const codeNum = parseInt(code);
    if (isNaN(codeNum)) return false;

    const [movie, serial] = await Promise.all([
      this.prisma.movie.findUnique({ where: { code: codeNum } }),
      this.prisma.serial.findUnique({ where: { code: codeNum } }),
    ]);

    return !movie && !serial;
  }

  async findNextAvailableCode(startCode: string): Promise<string> {
    let code = parseInt(startCode);

    while (true) {
      const isAvailable = await this.isCodeAvailable(String(code));
      if (isAvailable) {
        return String(code);
      }
      code++;
    }
  }

  async findAvailableCodes(
    startCode: string,
    count: number = 5,
  ): Promise<string[]> {
    const codes: string[] = [];
    let code = parseInt(startCode);

    while (codes.length < count) {
      const isAvailable = await this.isCodeAvailable(String(code));
      if (isAvailable) {
        codes.push(String(code));
      }
      code++;
    }

    return codes;
  }

  async generateUniqueCode(): Promise<string> {
    const randomCode = Math.floor(1000 + Math.random() * 9000).toString();
    const isAvailable = await this.isCodeAvailable(randomCode);

    if (isAvailable) {
      return randomCode;
    }

    return this.findNextAvailableCode(randomCode);
  }
}

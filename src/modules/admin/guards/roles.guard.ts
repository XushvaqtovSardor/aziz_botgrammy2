import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../../prisma/prisma.service';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { BotContext } from '../../../bot/bot.context';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    const ctx = context.getArgByIndex(0) as BotContext;

    if (!ctx.from) {
      return false;
    }

    const chatId = String(ctx.from.id);

    const admin = await this.prisma.admin.findUnique({
      where: { telegramId: chatId },
    });

    if (!admin) {
      return false;
    }

    return requiredRoles.includes(admin.role);
  }
}

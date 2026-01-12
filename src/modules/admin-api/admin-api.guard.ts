import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AdminService } from '../admin/services/admin.service';

@Injectable()
export class AdminApiGuard implements CanActivate {
  constructor(private adminService: AdminService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.headers['x-admin-token'] || request.query.token;

    if (!token) {
      throw new UnauthorizedException('Admin token required');
    }

    const telegramId = token.toString();

    const admin = await this.adminService.getAdminByTelegramId(telegramId);

    if (!admin) {
      throw new UnauthorizedException('Invalid admin token');
    }

    request.admin = admin;
    return true;
  }
}

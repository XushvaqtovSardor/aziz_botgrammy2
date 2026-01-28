import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  BadRequestException,
  HttpException,
  HttpStatus,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { AdminApiGuard } from './admin-api.guard';
import { AdminService } from '../admin/services/admin.service';
import { UserService } from '../user/services/user.service';
import { FieldService } from '../field/services/field.service';
import { ChannelService } from '../channel/services/channel.service';
import { MovieService } from '../content/services/movie.service';
import { SerialService } from '../content/services/serial.service';
import { PaymentService } from '../payment/services/payment.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminRole } from '@prisma/client';

@Controller('api/admin')
@UseGuards(AdminApiGuard)
export class AdminApiController {
  private readonly logger = new Logger(AdminApiController.name);

  constructor(
    private adminService: AdminService,
    private userService: UserService,
    private fieldService: FieldService,
    private channelService: ChannelService,
    private movieService: MovieService,
    private serialService: SerialService,
    private paymentService: PaymentService,
    private prisma: PrismaService,
  ) {}

  @Get('me')
  getMe(@Request() req: any) {
    this.logger.log(`👤 Admin ${req.admin.telegramId} accessed /me endpoint`);
    return req.admin;
  }

  @Get('stats')
  async getStatistics() {
    this.logger.log('📊 Statistics endpoint accessed');
    try {
      const [userStats, paymentStats] = await Promise.all([
        this.userService.getUserStatistics(),
        this.paymentService.getStatistics(),
      ]);

      return {
        users: userStats,
        payments: paymentStats,
      };
    } catch (error) {
      this.logger.error('❌ Error fetching statistics');
      this.logger.error(`Error: ${error.message}`);
      this.logger.error('Stack:', error.stack);
      throw error;
    }
  }

  @Get('admins')
  async getAdmins(@Request() req) {
    this.logger.log(`📋 Get admins requested by ${req.admin.telegramId}`);
    try {
      const isSuperAdmin = req.admin.role === AdminRole.SUPERADMIN;
      if (!isSuperAdmin) {
        this.logger.warn(`⚠️ Non-superadmin ${req.admin.telegramId} tried to view admins`);
        throw new HttpException(
          'Only SuperAdmin can view admins',
          HttpStatus.FORBIDDEN,
        );
      }
      return this.adminService.findAll();
    } catch (error) {
      this.logger.error(`❌ Error in getAdmins: ${error.message}`);
      throw error;
    }
  }

  @Post('admins')
  async createAdmin(
    @Request() req,
    @Body() body: { telegramId: string; username: string; role: AdminRole },
  ) {
    this.logger.log(`➕ Create admin requested: ${body.telegramId} by ${req.admin.telegramId}`);
    try {
      const isSuperAdmin = req.admin.role === AdminRole.SUPERADMIN;
      if (!isSuperAdmin) {
        this.logger.warn(`⚠️ Non-superadmin ${req.admin.telegramId} tried to create admin`);
        throw new HttpException(
          'Only SuperAdmin can create admins',
          HttpStatus.FORBIDDEN,
        );
      }

      const result = await this.adminService.createAdmin({
        telegramId: body.telegramId,
        username: body.username,
        role: body.role,
        createdBy: req.admin.telegramId,
      });
      
      this.logger.log(`✅ Admin ${body.telegramId} created successfully`);
      return result;
    } catch (error) {
      this.logger.error(`❌ Error creating admin: ${error.message}`);
      throw error;
    }
  }

  @Delete('admins/:telegramId')
  async deleteAdmin(@Request() req, @Param('telegramId') telegramId: string) {
    this.logger.log(`🗑️ Delete admin requested: ${telegramId} by ${req.admin.telegramId}`);
    try {
      const isSuperAdmin = req.admin.role === AdminRole.SUPERADMIN;
      if (!isSuperAdmin) {
        this.logger.warn(`⚠️ Non-superadmin ${req.admin.telegramId} tried to delete admin`);
        throw new HttpException(
          'Only SuperAdmin can delete admins',
          HttpStatus.FORBIDDEN,
        );
      }

    if (telegramId === req.admin.telegramId) {
      throw new HttpException('Cannot delete yourself', HttpStatus.BAD_REQUEST);
    }

    const adminToDelete =
      await this.adminService.getAdminByTelegramId(telegramId);

    if (!adminToDelete) {
      throw new HttpException('Admin not found', HttpStatus.NOT_FOUND);
    }

    const currentAdmin = await this.adminService.getAdminByTelegramId(
      req.admin.telegramId,
    );

    if (!currentAdmin) {
      throw new HttpException('Current admin not found', HttpStatus.NOT_FOUND);
    }

    const canDelete =
      adminToDelete.createdBy === req.admin.telegramId ||
      adminToDelete.createdAt > currentAdmin.createdAt;

    if (!canDelete) {
      throw new HttpException(
        'You can only delete admins you created or admins created after you',
        HttpStatus.FORBIDDEN,
      );
    }

    return this.adminService.deleteAdmin(telegramId);
  }

  @Get('users')
  async getUsers() {
    return this.userService.getAllUsers();
  }

  @Get('users/:telegramId')
  async getUser(@Param('telegramId') telegramId: string) {
    return this.userService.findByTelegramId(telegramId);
  }

  @Put('users/:telegramId/block')
  async blockUser(
    @Param('telegramId') telegramId: string,
    @Body() body: { reason?: string },
  ) {
    return this.userService.blockUser(telegramId, body.reason);
  }

  @Put('users/:telegramId/unblock')
  async unblockUser(@Param('telegramId') telegramId: string) {
    return this.userService.unblockUser(telegramId);
  }

  @Get('fields')
  async getFields() {
    return this.fieldService.findAll();
  }

  @Post('fields')
  async createField(@Body() body: { name: string; channelLink: string }) {
    const link = (body.channelLink || '').trim();

    let channelId: string | undefined;
    if (link.startsWith('@') || link.startsWith('-100')) {
      channelId = link;
    } else {
      const match = link.match(/(?:https?:\/\/)?t\.me\/([^/?#]+)/i);
      if (match?.[1]) {
        channelId = '@' + match[1];
      }
    }

    if (!channelId) {
      throw new BadRequestException(
        "Kanal linki noto'g'ri. Masalan: https://t.me/kanal_nomi yoki @kanal_nomi",
      );
    }

    return this.fieldService.create({
      name: body.name,
      channelId: channelId,
      channelLink: body.channelLink,
    });
  }

  @Delete('fields/:id')
  async deleteField(@Param('id') id: number) {
    return this.fieldService.delete(+id);
  }

  @Get('channels/mandatory')
  async getMandatoryChannels() {
    return this.channelService.findAll();
  }

  @Post('channels/mandatory')
  async createMandatoryChannel(
    @Body()
    body: {
      channelId?: string;
      channelName: string;
      channelLink: string;
      order?: number;
    },
  ) {
    let channelId = body.channelId;
    if (!channelId && body.channelLink) {
      const match = body.channelLink.match(/t\.me\/([^/?]+)/);
      if (match) {
        channelId = '@' + match[1];
      } else {
        channelId = body.channelLink;
      }
    }

    return this.channelService.create(
      channelId,
      body.channelName,
      body.channelLink,
      body.order,
    );
  }

  @Delete('channels/mandatory/:id')
  async deleteMandatoryChannel(@Param('id') id: number) {
    return this.channelService.delete(+id);
  }

  @Get('channels/database')
  async getDatabaseChannels() {
    return this.channelService.findAllDatabase();
  }

  @Post('channels/database')
  async createDatabaseChannel(
    @Body() body: { channelId: string; channelName: string },
  ) {
    return this.channelService.createDatabaseChannel({
      channelId: body.channelId,
      channelName: body.channelName,
      isActive: true,
    });
  }

  @Delete('channels/database/:id')
  async deleteDatabaseChannel(@Param('id') id: number) {
    return this.channelService.deleteDatabaseChannel(+id);
  }

  @Get('movies')
  async getMovies() {
    return this.movieService.findAll();
  }

  @Post('movies')
  async createMovie(@Body() body: any) {
    return this.movieService.create(body);
  }

  @Delete('movies/:id')
  async deleteMovie(@Request() req, @Param('id') id: number) {
    const canDelete =
      req.admin.role === AdminRole.SUPERADMIN || req.admin.canDeleteContent;
    if (!canDelete) {
      throw new HttpException(
        'No permission to delete content',
        HttpStatus.FORBIDDEN,
      );
    }
    return this.movieService.delete(+id);
  }

  @Get('serials')
  async getSerials() {
    return this.serialService.findAll();
  }

  @Post('serials')
  async createSerial(@Body() body: any) {
    return this.serialService.create(body);
  }

  @Delete('serials/:id')
  async deleteSerial(@Request() req, @Param('id') id: number) {
    const canDelete =
      req.admin.role === AdminRole.SUPERADMIN || req.admin.canDeleteContent;
    if (!canDelete) {
      throw new HttpException(
        'No permission to delete content',
        HttpStatus.FORBIDDEN,
      );
    }
    return this.serialService.delete(+id);
  }

  @Delete('movies/code/:code')
  async deleteMovieByCode(@Request() req, @Param('code') code: string) {
    const canDelete =
      req.admin.role === AdminRole.SUPERADMIN || req.admin.canDeleteContent;
    if (!canDelete) {
      throw new HttpException(
        'No permission to delete content',
        HttpStatus.FORBIDDEN,
      );
    }

    const movie = await this.prisma.movie.findUnique({
      where: { code: parseInt(code) },
      include: {
        episodes: true,
        field: {
          include: {
            databaseChannel: true,
          },
        },
      },
    });

    if (!movie) {
      throw new NotFoundException(`Movie with code ${code} not found`);
    }

    let deletedFromFieldChannel = false;
    if (movie.channelMessageId && movie.field?.channelId) {
      try {
        deletedFromFieldChannel = true;
      } catch (error) {
      }
    }

    let deletedFromDatabaseChannel = false;
    if (movie.channelMessageId && movie.field?.databaseChannel?.channelId) {
      try {
        deletedFromDatabaseChannel = true;
      } catch (error) {
      }
    }

    await this.prisma.movieEpisode.deleteMany({
      where: { movieId: movie.id },
    });

    await this.prisma.watchHistory.deleteMany({
      where: { movieId: movie.id },
    });

    await this.prisma.movie.delete({
      where: { id: movie.id },
    });

    return {
      success: true,
      message: `Movie "${movie.title}" (code: ${code}) deleted successfully`,
      deletedEpisodes: movie.episodes.length,
      deletedFromChannels: movie.channelMessageId ? 'Yes' : 'No',
    };
  }

  @Delete('serials/code/:code')
  async deleteSerialByCode(@Request() req, @Param('code') code: string) {
    const canDelete =
      req.admin.role === AdminRole.SUPERADMIN || req.admin.canDeleteContent;
    if (!canDelete) {
      throw new HttpException(
        'No permission to delete content',
        HttpStatus.FORBIDDEN,
      );
    }

    const serial = await this.prisma.serial.findUnique({
      where: { code: parseInt(code) },
      include: {
        episodes: true,
        field: {
          include: {
            databaseChannel: true,
          },
        },
      },
    });

    if (!serial) {
      throw new NotFoundException(`Serial with code ${code} not found`);
    }

    let deletedFromChannels = false;
    if (serial.channelMessageId) {
      deletedFromChannels = true;
    }

    await this.prisma.episode.deleteMany({
      where: { serialId: serial.id },
    });

    await this.prisma.watchHistory.deleteMany({
      where: { serialId: serial.id },
    });

    await this.prisma.serial.delete({
      where: { id: serial.id },
    });

    return {
      success: true,
      message: `Serial "${serial.title}" (code: ${code}) deleted successfully`,
      deletedEpisodes: serial.episodes.length,
      deletedFromChannels: deletedFromChannels ? 'Yes' : 'No',
    };
  }

  @Get('payments/pending')
  async getPendingPayments() {
    return this.paymentService.findPending();
  }

  @Get('payments/approved')
  async getApprovedPayments() {
    return this.paymentService.findByStatus('APPROVED');
  }

  @Get('payments/rejected')
  async getRejectedPayments() {
    return this.paymentService.findByStatus('REJECTED');
  }

  @Get('payments/statistics')
  async getPaymentStatistics() {
    return this.paymentService.getStatistics();
  }

  @Put('payments/:id/approve')
  async approvePayment(
    @Request() req,
    @Param('id') id: number,
    @Body() body: { durationDays: number },
  ) {
    const hasPermission = await this.adminService.hasPermission(
      req.admin.telegramId,
      'APPROVE_PAYMENTS',
    );
    if (!hasPermission) {
      throw new HttpException(
        'No permission to approve payments',
        HttpStatus.FORBIDDEN,
      );
    }

    const admin = await this.adminService.getAdminByTelegramId(
      req.admin.telegramId,
    );
    return this.paymentService.approve(+id, admin!.id, body.durationDays);
  }

  @Put('payments/:id/reject')
  async rejectPayment(
    @Request() req,
    @Param('id') id: number,
    @Body() body: { reason?: string },
  ) {
    const hasPermission = await this.adminService.hasPermission(
      req.admin.telegramId,
      'APPROVE_PAYMENTS',
    );
    if (!hasPermission) {
      throw new HttpException(
        'No permission to reject payments',
        HttpStatus.FORBIDDEN,
      );
    }

    const admin = await this.adminService.getAdminByTelegramId(
      req.admin.telegramId,
    );
    return this.paymentService.reject(+id, admin!.id, body.reason);
  }

  @Get('users/premium-banned')
  async getPremiumBannedUsers() {
    return this.userService.getPremiumBannedUsers();
  }

  @Put('users/:telegramId/unban-premium')
  async unbanPremiumUser(@Param('telegramId') telegramId: string) {
    return this.userService.unbanFromPremium(telegramId);
  }
}

import { Controller, Get, Res, Logger, Req } from '@nestjs/common';
import { Response, Request } from 'express';
import { join } from 'path';

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  @Get()
  root(@Res() res: Response) {

    return res.redirect('/admin/');
  }

  @Get('admin')
  adminPanel(@Req() req: Request, @Res() res: Response) {
    // Send the admin login page
    return res.sendFile(join(__dirname, '..', 'public', 'admin', 'index.html'));
  }

  @Get('admin/dashboard')
  adminDashboard(@Req() req: Request, @Res() res: Response) {
    // Send the admin dashboard page
    return res.sendFile(join(__dirname, '..', 'public', 'admin', 'dashboard.html'));
  }

  @Get('health')
  health() {

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'aziz-kino-bot',
      environment: process.env.NODE_ENV || 'development',
      botToken: !!process.env.BOT_TOKEN ? 'SET' : 'NOT SET',
      database: !!process.env.DATABASE_URL ? 'SET' : 'NOT SET',
    };
  }
}

import { Controller, Get, Res, Logger } from '@nestjs/common';
import { Response } from 'express';

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  @Get()
  root(@Res() res: Response) {
    this.logger.log('📍 Root endpoint accessed, redirecting to /admin/');
    return res.redirect('/admin/');
  }

  @Get('health')
  health() {
    this.logger.log('🏥 Health check endpoint accessed');
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

import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private pool: Pool;

  constructor() {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error('❌ DATABASE_URL  environment variable is not set');
    }

    const maskedUrl = databaseUrl.replace(/:[^:@]+@/, ':****@');

    const pool = new Pool({ connectionString: databaseUrl });
    const adapter = new PrismaPg(pool);

    super({
      adapter,
      log:
        process.env.NODE_ENV === 'development'
          ? [
              { emit: 'event', level: 'query' },
              { emit: 'event', level: 'error' },
              { emit: 'event', level: 'warn' },
            ]
          : [{ emit: 'event', level: 'error' }],
    });

    this.pool = pool;

    this.$on('error' as never, (e: any) => {
      this.logger.error('Database error:', e);
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();

      // Test the connection
      try {
        await this.$queryRaw`SELECT 1`;
      } catch (queryError) {
        this.logger.error('❌ Database query test failed');
        this.logger.error(`Error: ${queryError.message}`);
      }
    } catch (error) {
      this.logger.error('❌ Database connection failed');
      this.logger.error(`Error details: ${error.message}`);
      this.logger.error(`Stack trace:`, error.stack);
      this.logger.error(
        `DATABASE_URL: ${process.env.DATABASE_URL ? 'SET' : 'NOT SET'}`,
      );
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
      await this.pool.end();
    } catch (error) {
      this.logger.error('❌ Error disconnecting database:', error);
    }
  }
}

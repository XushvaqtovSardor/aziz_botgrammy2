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
      throw new Error('❌ DATABASE_URL environment variable is not set');
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

    if (process.env.NODE_ENV === 'development') {
      this.$on('query' as never, (e: any) => {
        this.logger.debug(`Query: ${e.query}`);
        this.logger.debug(`Duration: ${e.duration}ms`);
      });
    }

    this.$on('error' as never, (e: any) => {
      this.logger.error('Database error:', e);
    });

    this.$on('warn' as never, (e: any) => {
      this.logger.warn('Database warning:', e);
    });

    if (process.env.NODE_ENV !== 'production') {
      this.logger.log(` Initializing database connection...`);
      this.logger.debug(` Database URL: ${maskedUrl}`);
    }
  }

  async onModuleInit() {
    try {
      await this.$connect();
      if (process.env.NODE_ENV !== 'production') {
        this.logger.log('Database connected successfully');
      }
    } catch (error) {
      this.logger.error(' Database connection failed');
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
      if (process.env.NODE_ENV !== 'production') {
        this.logger.log('Database disconnected successfully');
      }
    } catch (error) {
      this.logger.error(' Error disconnecting database:', error);
    }
  }
}

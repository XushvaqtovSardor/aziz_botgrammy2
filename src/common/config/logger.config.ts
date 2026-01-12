import * as winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { WinstonModule } from 'nest-winston';

const logDir = 'logs';

const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, context, trace }) => {
    const contextStr = context ? `[${context}]` : '';
    const traceStr = trace ? `\n${trace}` : '';
    return `${timestamp} ${level} ${contextStr} ${message}${traceStr}`;
  }),
);

const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json(),
);

const errorFileTransport = new DailyRotateFile({
  filename: `${logDir}/error-%DATE%.log`,
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
  level: 'error',
  format: fileFormat,
});

const combinedFileTransport = new DailyRotateFile({
  filename: `${logDir}/combined-%DATE%.log`,
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
  format: fileFormat,
});

const debugFileTransport = new DailyRotateFile({
  filename: `${logDir}/debug-%DATE%.log`,
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '7d',
  level: 'debug',
  format: fileFormat,
});

export const loggerConfig = WinstonModule.createLogger({
  transports: [
    new winston.transports.Console({
      format: consoleFormat,
      level: process.env.NODE_ENV === 'production' ? 'error' : 'debug',
    }),
    errorFileTransport,
    combinedFileTransport,
    ...(process.env.NODE_ENV !== 'production' ? [debugFileTransport] : []),
  ],
  exceptionHandlers: [
    new winston.transports.File({
      filename: `${logDir}/exceptions.log`,
      format: fileFormat,
    }),
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: `${logDir}/rejections.log`,
      format: fileFormat,
    }),
  ],
});

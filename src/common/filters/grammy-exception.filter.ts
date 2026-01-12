import { Catch, ExceptionFilter, Logger } from '@nestjs/common';
import { BotContext } from '../../bot/bot.context';

@Catch()
export class GrammyExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GrammyExceptionFilter.name);

  async catch(exception: Error, host: any) {
    const ctx: BotContext = host.getContext();

    // Log detailed error information
    this.logger.error('❌ Telegram Bot Error occurred');
    this.logger.error(`Error: ${exception.message}`);
    this.logger.error(`Stack:`, exception.stack);

    // Log user information if available
    if (ctx.from) {
      this.logger.error(`User ID: ${ctx.from.id}`);
      this.logger.error(`Username: @${ctx.from.username || 'N/A'}`);
      this.logger.error(
        `Name: ${ctx.from.first_name} ${ctx.from.last_name || ''}`,
      );
    }

    // Log message information if available
    if (ctx.message) {
      this.logger.error(`Message: ${JSON.stringify(ctx.message)}`);
    }

    // Log callback query if available
    if (ctx.callbackQuery) {
      this.logger.error(`Callback Query: ${JSON.stringify(ctx.callbackQuery)}`);
    }

    // Try to send error message to user
    try {
      if (ctx.chat?.id) {
        await ctx.reply(
          "❌ Xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring yoki qo'llab-quvvatlash bilan bog'laning.",
        );
      }
    } catch (replyError) {
      this.logger.error('Failed to send error message to user:', replyError);
    }
  }
}

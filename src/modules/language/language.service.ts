import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Language } from '@prisma/client';
import { LanguageTexts } from './interfaces/language-texts.interface';
import * as uzTexts from './translations/uz.json';
import * as ruTexts from './translations/ru.json';
import * as enTexts from './translations/en.json';

@Injectable()
export class LanguageService {
  private translations: Record<Language, LanguageTexts> = {
    [Language.UZ]: uzTexts as LanguageTexts,
    [Language.RU]: ruTexts as LanguageTexts,
    [Language.EN]: enTexts as LanguageTexts,
  };

  constructor(private prisma: PrismaService) {}

  async getUserLanguage(chatId: string): Promise<Language> {
    const user = await this.prisma.user.findUnique({
      where: { telegramId: chatId },
      select: { language: true },
    });

    return user?.language || Language.UZ;
  }

  async setUserLanguage(chatId: string, language: Language): Promise<void> {
    await this.prisma.user.update({
      where: { telegramId: chatId },
      data: { language },
    });
  }

  async getTexts(chatId: string): Promise<LanguageTexts> {
    const language = await this.getUserLanguage(chatId);
    return this.translations[language];
  }

  getText(language: Language, key: keyof LanguageTexts): string {
    return this.translations[language][key];
  }
}

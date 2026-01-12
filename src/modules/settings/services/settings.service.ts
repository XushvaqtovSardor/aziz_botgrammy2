import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async getSettings() {
    let settings = await this.prisma.botSettings.findFirst();

    if (!settings) {
      settings = await this.prisma.botSettings.create({
        data: {
          aboutBot: 'Bu kino bot',
          supportUsername: 'support',
          adminNotificationChat: '0',
          welcomeMessage: '👋',
        },
      });
    }

    return settings;
  }

  async updateAboutBot(aboutBot: string) {
    const settings = await this.getSettings();

    return this.prisma.botSettings.update({
      where: { id: settings.id },
      data: { aboutBot },
    });
  }

  async updateSupportUsername(supportUsername: string) {
    const settings = await this.getSettings();

    return this.prisma.botSettings.update({
      where: { id: settings.id },
      data: { supportUsername },
    });
  }

  async updateAdminNotificationChat(adminNotificationChat: string) {
    const settings = await this.getSettings();

    return this.prisma.botSettings.update({
      where: { id: settings.id },
      data: { adminNotificationChat },
    });
  }

  async updateContactMessage(contactMessage: string) {
    const settings = await this.getSettings();

    return this.prisma.botSettings.update({
      where: { id: settings.id },
      data: { contactMessage },
    });
  }

  async updateSettings(data: {
    aboutBot?: string;
    supportUsername?: string;
    adminNotificationChat?: string;
  }) {
    const settings = await this.getSettings();

    return this.prisma.botSettings.update({
      where: { id: settings.id },
      data,
    });
  }
}

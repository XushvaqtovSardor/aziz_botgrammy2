import { Keyboard, InlineKeyboard } from 'grammy';
import { AdminRole } from '@prisma/client';

export class AdminKeyboard {
  static getAdminMainMenu(role: AdminRole) {
    const keyboard = new Keyboard()
      .text('🎬 Kino yuklash')
      .text('📺 Serial yuklash')
      .row();

    // ADMIN roli: Faqat content yuklash, kanal qo'shish va e'lon berish
    if (role === AdminRole.ADMIN) {
      keyboard
        .text('📁 Fieldlar')
        .text('💾 Database kanallar')
        .row()
        .text('📣 Reklama yuborish')
        .row();
    }

    // MANAGER roli: Ko'proq huquqlar + majburiy kanallar
    else if (role === AdminRole.MANAGER) {
      keyboard
        .text('📊 Statistika')
        .text('📁 Fieldlar')
        .row()
        .text('📢 Majburiy kanallar')
        .text('💾 Database kanallar')
        .row()
        .text('📣 Reklama yuborish')
        .text("🗑️ Kontent o'chirish")
        .row()
        .text('🌐 Web Panel')
        .row();
    }

    // SUPERADMIN roli: Hamma huquqlar
    else if (role === AdminRole.SUPERADMIN) {
      keyboard
        .text('📊 Statistika')
        .text('📁 Fieldlar')
        .row()
        .text('📢 Majburiy kanallar')
        .text('💾 Database kanallar')
        .row()
        .text('👥 Adminlar')
        .text('📣 Reklama yuborish')
        .row()
        .text("💳 To'lovlar")
        .text('⚙️ Sozlamalar')
        .row()
        .text("🗑️ Kontent o'chirish")
        .row()
        .text('🌐 Web Panel')
        .row();
    }

    keyboard.text('🔙 Orqaga');

    return { reply_markup: keyboard.resized() };
  }

  static getFieldManagementMenu() {
    const keyboard = new Keyboard()
      .text("➕ Field qo'shish")
      .text("📋 Fieldlar ro'yxati")
      .row()
      .text('🔙 Orqaga');
    return { reply_markup: keyboard.resized() };
  }

  static getChannelManagementMenu() {
    const keyboard = new Keyboard()
      .text("➕ Kanal qo'shish")
      .text("📋 Kanallar ro'yxati")
      .row()
      .text('🔙 Orqaga');
    return { reply_markup: keyboard.resized() };
  }

  static getPaymentManagementMenu() {
    const keyboard = new Keyboard()
      .text("📥 Yangi to'lovlar")
      .text('✅ Tasdiqlangan')
      .row()
      .text('❌ Rad etilgan')
      .text("📊 To'lov statistikasi")
      .row()
      .text('🚫 Premium banned users')
      .row()
      .text('🔙 Orqaga');
    return { reply_markup: keyboard.resized() };
  }

  static getCancelButton() {
    const keyboard = new Keyboard().text('❌ Bekor qilish');
    return { reply_markup: keyboard.resized() };
  }

  static getConfirmKeyboard(itemId: number, action: string) {
    const keyboard = new InlineKeyboard()
      .text('✅ Ha', `${action}_yes_${itemId}`)
      .text("❌ Yo'q", `${action}_no_${itemId}`);
    return { reply_markup: keyboard };
  }
}

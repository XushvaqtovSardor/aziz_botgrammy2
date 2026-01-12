import { InlineKeyboard, Keyboard } from 'grammy';

export class MarkupHelper {
  static inlineKeyboard(buttons: any[][]): { reply_markup: InlineKeyboard } {
    const keyboard = new InlineKeyboard();

    buttons.forEach((row, rowIndex) => {
      row.forEach((btn, btnIndex) => {
        if (btn.url) {
          keyboard.url(btn.text, btn.url);
        } else if (btn.callback_data) {
          keyboard.text(btn.text, btn.callback_data);
        }
        if (btnIndex < row.length - 1) {
          // Button separator (optional)
        }
      });
      if (rowIndex < buttons.length - 1) {
        keyboard.row();
      }
    });

    return { reply_markup: keyboard };
  }

  static keyboard(buttons: any[][]): { reply_markup: Keyboard } {
    const keyboard = new Keyboard();

    buttons.forEach((row, rowIndex) => {
      row.forEach((btn) => {
        const text = typeof btn === 'string' ? btn : btn.text;
        keyboard.text(text);
      });
      if (rowIndex < buttons.length - 1) {
        keyboard.row();
      }
    });

    return { reply_markup: keyboard.resized() };
  }

  static button = {
    callback: (text: string, data: string) => ({
      text,
      callback_data: data,
    }),
    url: (text: string, url: string) => ({
      text,
      url,
    }),
  };
}
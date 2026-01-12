import { InlineKeyboard, Keyboard } from 'grammy';

/**
 * Helper utility for creating keyboards in Grammy
 * Provides Telegraf-like API for easier migration
 */
export class MarkupHelper {
  /**
   * Create inline keyboard
   */
  static inlineKeyboard(buttons: any[][]): { reply_markup: InlineKeyboard } {
    const keyboard = new InlineKeyboard();
    
    buttons.forEach((row, rowIndex) => {
      row.forEach((btn, btnIndex) => {
        if (btn.url) {
          keyboard.url(btn.text, btn.url);
        } else if (btn.callback_data) {
          keyboard.text(btn.text, btn.callback_data);
        }
        
        // Add row break if not last button in row
        if (btnIndex < row.length - 1) {
          // Continue same row
        }
      });
      
      // Add row break if not last row
      if (rowIndex < buttons.length - 1) {
        keyboard.row();
      }
    });
    
    return { reply_markup: keyboard };
  }

  /**
   * Create regular keyboard
   */
  static keyboard(buttons: any[][]): { reply_markup: Keyboard } {
    const keyboard = new Keyboard();
    
    buttons.forEach((row, rowIndex) => {
      row.forEach((btn) => {
        const text = typeof btn === 'string' ? btn : btn.text;
        keyboard.text(text);
      });
      
      // Add row break if not last row
      if (rowIndex < buttons.length - 1) {
        keyboard.row();
      }
    });
    
    return { reply_markup: keyboard.resized() };
  }

  /**
   * Button builders
   */
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

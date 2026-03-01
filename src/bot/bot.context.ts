import { Context } from 'grammy';

export interface SessionData {
  pendingPayment?: {
    amount: number;
    duration: number;
  };
  broadcast?: {
    type?: string;
    message?: string;
    photoFileId?: string;
    videoFileId?: string;
    buttonText?: string;
    buttonUrl?: string;
  };
}

export interface BotContext extends Context {
  session?: SessionData;
}

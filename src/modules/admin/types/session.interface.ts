export interface AdminSession {
  userId: number;
  state: AdminState;
  step: number;
  data: any;
}

export enum AdminState {
  IDLE = 'IDLE',
  CREATING_FIELD = 'CREATING_FIELD',
  CREATING_MOVIE = 'CREATING_MOVIE',
  CREATING_SERIAL = 'CREATING_SERIAL',
  CREATING_CHANNEL = 'CREATING_CHANNEL',
  CREATING_ADMIN = 'CREATING_ADMIN',
  ADD_DATABASE_CHANNEL = 'add_database_channel',
  ADD_MANDATORY_CHANNEL = 'add_mandatory_channel',
  PAYMENT_RECEIPT = 'PAYMENT_RECEIPT',
  ATTACHING_VIDEO = 'ATTACHING_VIDEO',
  ADDING_FIELD = 'ADDING_FIELD',
  ADD_ADMIN = 'ADD_ADMIN',
  EDIT_PREMIUM_PRICES = 'EDIT_PREMIUM_PRICES',
  EDIT_CARD_INFO = 'EDIT_CARD_INFO',
  EDIT_CONTACT_MESSAGE = 'EDIT_CONTACT_MESSAGE',
  BROADCASTING = 'BROADCASTING',
  SEARCH_CHANNEL_BY_LINK = 'SEARCH_CHANNEL_BY_LINK',
  APPROVE_PAYMENT = 'APPROVE_PAYMENT',
  REJECT_PAYMENT = 'REJECT_PAYMENT',
  BROADCAST_PREMIERE = 'BROADCAST_PREMIERE',
  BROADCAST_TELEGRAM_PREMIUM = 'BROADCAST_TELEGRAM_PREMIUM',
  BLOCK_USER = 'BLOCK_USER',
  UNBLOCK_USER = 'UNBLOCK_USER',
  PREMIUM_BANNED_USERS = 'PREMIUM_BANNED_USERS',
  UNBAN_PREMIUM_USER = 'UNBAN_PREMIUM_USER',
  DELETE_CONTENT = 'DELETE_CONTENT',
}

export interface FieldCreationData {
  name?: string;
  channelLink?: string;
}
export enum MovieCreateStep {
  CODE = 0,
  TITLE = 1,
  GENRE = 2,
  DESCRIPTION = 3,
  FIELD = 4,
  PHOTO = 5,
  VIDEO = 6,
}

export enum SerialCreateStep {
  CODE = 0,
  TITLE = 1,
  GENRE = 2,
  DESCRIPTION = 3,
  SEASON = 4,
  EPISODE_COUNT = 5,
  FIELD = 6,
  PHOTO = 7,
}

export interface MovieCreationData {
  code?: string;
  title?: string;
  year?: number;
  genre?: string;
  imdb?: number;
  description?: string;
  fieldId?: number;
  thumbnailFileId?: string;
  videoFileId?: string;
  posterFileId?: string;
  channelMessageId?: number;
  selectedField?: any;
  fields?: any[];
}

export interface SerialCreationData {
  code?: string;
  title?: string;
  year?: number;
  genre?: string;
  imdb?: number;
  description?: string;
  season?: number;
  episodeCount?: number;
  fieldId?: number;
  thumbnailFileId?: string;
}

export interface ChannelCreationData {
  channelName?: string;
  channelLink?: string;
  channelId?: string;
}

export interface MovieData {
  code: string | number;
  title: string;
  posterFileId?: string;
  thumbnailFileId?: string;
  videoFileId?: string;
  videoMessageId?: string;
  channelMessageId?: number;
  genre?: string;
  language?: string;
  quality?: string;
  description?: string;
  year?: number;
  imdb?: number;
  duration?: number;
  fieldId: number;
  totalEpisodes?: number;
}

export interface SerialData {
  code: string | number;
  title: string;
  posterFileId: string;
  description?: string;
  genre?: string;
  season?: number;
  episodeCount?: number;
  totalEpisodes?: number;
  channelMessageId?: number;
  hasCustomChannel?: boolean;
  customChannelId?: string;
  customChannelLink?: string;
  fieldId: number;
}

export interface EpisodeData {
  serialId: number;
  episodeNumber: number;
  title?: string;
  description?: string;
  videoFileId: string;
  videoMessageId: string;
}

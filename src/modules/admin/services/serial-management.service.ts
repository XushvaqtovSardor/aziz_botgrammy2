import { Injectable, Logger } from '@nestjs/common';
import { BotContext } from '../../../bot/bot.context';
import { InlineKeyboard, Keyboard } from 'grammy';
import { SerialService } from '../../content/services/serial.service';
import { MovieService } from '../../content/services/movie.service';
import { EpisodeService } from '../../content/services/episode.service';
import { MovieEpisodeService } from '../../content/services/movie-episode.service';
import { FieldService } from '../../field/services/field.service';
import { ChannelService } from '../../channel/services/channel.service';
import { SessionService } from './session.service';
import { AdminKeyboard } from '../keyboards/admin-menu.keyboard';
import { GrammyBotService } from '../../../common/grammy/grammy-bot.module';
import { AdminState } from '../types/session.interface';

export enum SerialManagementStep {
  CODE = 'code',
  TITLE = 'title',
  GENRE = 'genre',
  DESCRIPTION = 'description',
  FIELD = 'field',
  POSTER = 'poster',
  UPLOADING_EPISODES = 'uploading_episodes',
  POST_TO_FIELD = 'post_to_field',
}

@Injectable()
export class SerialManagementService {
  private readonly logger = new Logger(SerialManagementService.name);

  constructor(
    private serialService: SerialService,
    private movieService: MovieService,
    private episodeService: EpisodeService,
    private movieEpisodeService: MovieEpisodeService,
    private fieldService: FieldService,
    private channelService: ChannelService,
    private sessionService: SessionService,
    private grammyBot: GrammyBotService,
  ) { }

  async handleNewSerialCode(ctx: BotContext, code: number) {
    if (!ctx.from) return;

    const existingMovie = await this.movieService.findByCode(code.toString());
    if (existingMovie) {
      const nearestCodes = await this.movieService.findNearestAvailableCodes(
        code,
        5,
      );
      let message = `❌ ${code} kodi kino uchun ishlatilgan!\n\n🎬 ${existingMovie.title}\n\n`;
      if (nearestCodes.length > 0) {
        message += "✅ Bo'sh kodlar:\n";
        nearestCodes.forEach((c, i) => (message += `${i + 1}. ${c}\n`));
      }
      message += '\n⚠️ Boshqa kod kiriting:';
      await ctx.reply(message, AdminKeyboard.getCancelButton());
      return;
    }

    const existingSerial = await this.serialService.findByCode(code.toString());
    if (existingSerial) {
      const nearestCodes = await this.serialService.findNearestAvailableCodes(
        code,
        5,
      );
      let message = `❌ Kod ${code} band!\n\n`;
      if (nearestCodes.length > 0) {
        message += "✅ Bo'sh kodlar:\n";
        nearestCodes.forEach((c, i) => (message += `${i + 1}. ${c}\n`));
      }
      message += '\nBoshqa kod kiriting:';
      await ctx.reply(message, AdminKeyboard.getCancelButton());
      return;
    }

    this.sessionService.updateSessionData(ctx.from.id, { code });
    this.sessionService.setStep(ctx.from.id, 1); // TITLE step
    await ctx.reply(
      'Serial nomini kiriting:\nMasalan: Game of Thrones',
      AdminKeyboard.getCancelButton(),
    );
  }

  async handleSerialTitle(ctx: BotContext, title: string) {
    if (!ctx.from) return;
    this.sessionService.updateSessionData(ctx.from.id, { title });
    this.sessionService.setStep(ctx.from.id, 2); // GENRE step
    await ctx.reply(
      '🎭 Janr kiriting:\nMasalan: Drama, Action, Fantasy',
      AdminKeyboard.getCancelButton(),
    );
  }

  async handleSerialGenre(ctx: BotContext, genre: string) {
    if (!ctx.from) return;
    this.sessionService.updateSessionData(ctx.from.id, { genre });
    this.sessionService.setStep(ctx.from.id, 3); // DESCRIPTION step

    const keyboard = new Keyboard()
      .text('Next')
      .row()
      .text('❌ Bekor qilish')
      .resized();

    await ctx.reply(
      "📝 Tavsif kiriting:\n\n⏭ O'tkazib yuborish uchun 'Next' yozing",
      { reply_markup: keyboard },
    );
  }

  async handleSerialDescription(ctx: BotContext, description: string) {
    if (!ctx.from) return;

    if (description.toLowerCase() === 'next') {
      this.sessionService.updateSessionData(ctx.from.id, { description: null });
    } else {
      this.sessionService.updateSessionData(ctx.from.id, { description });
    }

    this.sessionService.setStep(ctx.from.id, 4); // FIELD step

    const allFields = await this.fieldService.findAll();
    if (allFields.length === 0) {
      await ctx.reply('❌ Hech qanday field topilmadi. Avval field yarating.');
      this.sessionService.clearSession(ctx.from.id);
      return;
    }

    let message = '📁 Qaysi fieldni tanlaysiz?\n\n';
    allFields.forEach((field, index) => {
      message += `${index + 1}. ${field.name}\n`;
    });
    message += '\nRaqamini kiriting (masalan: 1)';

    this.sessionService.updateSessionData(ctx.from.id, { fields: allFields });
    await ctx.reply(message, AdminKeyboard.getCancelButton());
  }

  async handleSerialField(ctx: BotContext, fieldIndex: number, fields: any[]) {
    if (!ctx.from) return;

    if (fieldIndex < 0 || fieldIndex >= fields.length) {
      await ctx.reply("❌ Noto'g'ri raqam. Qaytadan kiriting:");
      return;
    }

    const selectedField = fields[fieldIndex];
    this.sessionService.updateSessionData(ctx.from.id, {
      selectedField: selectedField,
      fieldId: selectedField?.id,
    });
    this.sessionService.setStep(ctx.from.id, 5); // POSTER step

    await ctx.reply(
      '🖼 Serial poster rasm yoki videosini yuboring:',
      AdminKeyboard.getCancelButton(),
    );
  }

  async handleSerialPoster(
    ctx: BotContext,
    posterFileId: string,
    posterType: 'photo' | 'video' = 'photo',
  ) {
    if (!ctx.from) return;

    this.sessionService.updateSessionData(ctx.from.id, {
      posterFileId,
      posterType,
    });
    this.sessionService.setStep(ctx.from.id, 6);
    this.sessionService.updateSessionData(ctx.from.id, {
      currentEpisode: 1,
      episodes: [],
    });

    await ctx.reply(
      '📹 1-qism videosini yuboring:',
      AdminKeyboard.getCancelButton(),
    );
  }

  async handleNewSerialEpisodeVideo(
    ctx: BotContext,
    videoFileId: string,
    session: any,
  ) {
    if (!ctx.from) return;

    const { currentEpisode, episodes } = session.data;

    episodes.push({
      episodeNumber: currentEpisode,
      videoFileId,
    });

    this.sessionService.updateSessionData(ctx.from.id, { episodes });

    const keyboard = new Keyboard()
      .text(`➕ ${currentEpisode + 1}-qism yuklash`)
      .row()
      .text('✅ Tugatish')
      .row()
      .text('❌ Bekor qilish')
      .resized();

    await ctx.reply(
      `✅ ${currentEpisode}-qism yuklandi!\n\nDavom ettirasizmi?`,
      { reply_markup: keyboard },
    );
  }

  async handleContinueOrFinish(ctx: BotContext, action: string) {
    if (!ctx.from) return;

    const session = this.sessionService.getSession(ctx.from.id);
    if (!session) return;

    if (action.includes('qism yuklash')) {
      const { currentEpisode } = session.data;
      this.sessionService.updateSessionData(ctx.from.id, {
        currentEpisode: currentEpisode + 1,
      });

      await ctx.reply(
        `📹 ${currentEpisode + 1}-qism videosini yuboring:`,
        AdminKeyboard.getCancelButton(),
      );
    } else if (action === '✅ Tugatish') {
      const keyboard = new Keyboard()
        .text('✅ Ha, field kanalga tashla')
        .row()
        .text("❌ Yo'q, faqat saqlash")
        .resized();

      await ctx.reply('📺 Serial tayyorlandi!\n\nField kanalga tashlansinmi?', {
        reply_markup: keyboard,
      });
    }
  }

  async finalizNewSerial(ctx: BotContext, postToField: boolean) {
    if (!ctx.from) return;

    const session = this.sessionService.getSession(ctx.from.id);
    if (!session) return;

    const {
      code,
      title,
      genre,
      description,
      fieldId,
      selectedField,
      posterFileId,
      episodes,
    } = session.data;

    try {
      // Check if serial already exists
      const existingSerial = await this.serialService.findByCode(code.toString());
      if (existingSerial) {
        this.sessionService.clearSession(ctx.from.id);
        await ctx.reply(
          `❌ ${code} kodli serial allaqachon yaratilgan!\n\n` +
          `📺 ${existingSerial.title}\n` +
          `📊 Qismlar: ${existingSerial.totalEpisodes}`,
          AdminKeyboard.getAdminMainMenu('ADMIN'),
        );
        return;
      }

      await ctx.reply('⏳ Serial yuklanmoqda...');

      const dbChannels = await this.channelService.findAllDatabase();
      if (dbChannels.length === 0) {
        await ctx.reply('❌ Database kanal topilmadi!');
        return;
      }

      const episodeData = [];
      const botInfo = await ctx.api.getMe();
      const botUsername = botInfo.username;

      // ... (oldingi kodlar)
      for (const ep of episodes) {
        const videoMessages = [];
        for (const dbChannel of dbChannels) {
          try {
            // ASOSIY QISM: Rasmdagi format
            const caption = `╭────────────────────
├‣ Serial nomi : ${title}
├‣ Serial kodi: ${code}
├‣ Qism: ${ep.episodeNumber}
├‣ Janrlari: ${genre}
├‣ Kanal: ${selectedField.channelLink || `https://t.me/${selectedField.channelId?.replace('@', '').replace('-100', '')}`}
╰────────────────────

▶️ Kinoning to'liq qismini @${botUsername} dan tomosha qilishingiz mumkin!

<blockquote expandable>⚠️ ESLATMA:
Biz yuklayotgan kinolar turli saytlardan olinadi.
🎰 Ba'zi kinolarda kazino, qimor yoki "pulni ko'paytirib beramiz" degan reklama chiqishi mumkin.
🚫 Bunday reklamalarga aslo ishonmang! Ular firibgarlar va sizni aldaydi.
🔞 Ba'zi sahnalar 18+ bo'lishi mumkin – agar noqulay bo'lsa, ko'rishni to'xtating.</blockquote>`;

            const sentVideo = await ctx.api.sendVideo(
              dbChannel.channelId,
              ep.videoFileId,
              { caption, parse_mode: "HTML" }, // parse_mode qo'shish tavsiya etiladi
            );
            // ... (davomi)
            videoMessages.push({
              channelId: dbChannel.channelId,
              messageId: sentVideo.message_id,
            });
          } catch (error) {
            this.logger.error(
              `Error uploading to ${dbChannel.channelName}:`,
              error,
            );
          }
        }

        episodeData.push({
          episodeNumber: ep.episodeNumber,
          videoFileId: ep.videoFileId,
          videoMessageId: JSON.stringify(videoMessages),
        });
      }

      const serial = await this.serialService.create({
        code: code.toString(),
        title,
        genre,
        description,
        fieldId,
        posterFileId,
        totalEpisodes: episodes.length,
        channelMessageId: 0,
      });

      for (const epData of episodeData) {
        try {
          await this.episodeService.create({
            serialId: serial.id,
            episodeNumber: epData.episodeNumber,
            videoFileId: epData.videoFileId,
            videoMessageId: epData.videoMessageId,
          });
        } catch (error) {
          // Skip if episode already exists (unique constraint error)
          if (error.code === 'P2002') {
            this.logger.warn(`Episode ${epData.episodeNumber} already exists for serial ${serial.id}, skipping...`);
          } else {
            throw error;
          }
        }
      }

      let posterMessageId = 0;
      if (postToField) {
        const caption = `╭────────────────────
├‣ Serial nomi : ${title}
├‣ Serial kodi: ${code}
├‣ Qismlar: ${episodes.length}
├‣ Janrlari: ${genre}
├‣ Kanal: ${selectedField.channelLink || `https://t.me/${selectedField.channelId?.replace('@', '').replace('-100', '')}`}
╰────────────────────

▶️ Serialning to'liq qismlarini @${botUsername} dan tomosha qilishingiz mumkin!

<blockquote expandable>⚠️ ESLATMA:
Biz yuklayotgan kinolar turli saytlardan olinadi.
🎰 Ba'zi kinolarda kazino, qimor yoki "pulni ko'paytirib beramiz" degan reklama chiqishi mumkin.
🚫 Bunday reklamalarga aslo ishonmang! Ular firibgarlar va sizni aldaydi.
🔞 Ba'zi sahnalar 18+ bo'lishi mumkin – agar noqulay bo'lsa, ko'rishni to'xtating.</blockquote>`;

        const keyboard = new InlineKeyboard().url(
          '✨ Tomosha Qilish',
          `https://t.me/${this.grammyBot.botUsername}?start=s${code}`,
        );

        let sentPoster;
        const posterType = session.data.posterType || 'photo';

        if (posterType === 'video') {
          sentPoster = await ctx.api.sendVideo(
            selectedField.channelId,
            posterFileId,
            {
              caption,
              reply_markup: keyboard,
              parse_mode: 'HTML',
            },
          );
        } else {
          sentPoster = await ctx.api.sendPhoto(
            selectedField.channelId,
            posterFileId,
            {
              caption,
              reply_markup: keyboard,
              parse_mode: 'HTML',
            },
          );
        }

        posterMessageId = sentPoster.message_id;

        await this.serialService.update(serial.id, {
          channelMessageId: posterMessageId,
        });
      }

      this.sessionService.clearSession(ctx.from.id);

      await ctx.reply(
        `✅ Serial muvaffaqiyatli yaratildi!\n\n` +
        `📺 ${title}\n` +
        `📹 Qismlar: ${episodes.length}\n` +
        `📦 Field: ${selectedField.name}\n` +
        (posterMessageId ? `🔗 Poster Message ID: ${posterMessageId}\n` : ''),
        AdminKeyboard.getAdminMainMenu('ADMIN'),
      );
    } catch (error) {
      this.logger.error('Error creating serial:', error);
      await ctx.reply(`❌ Xatolik: ${error.message}`);
    }
  }

  async handleAddEpisodeCode(ctx: BotContext, code: number) {
    if (!ctx.from) return;

    const movie = await this.movieService.findByCode(code.toString());
    const serial = await this.serialService.findByCode(code.toString());

    if (!movie && !serial) {
      await ctx.reply(
        '❌ Bu kod bilan kino yoki serial topilmadi!\nBoshqa kod kiriting:',
        AdminKeyboard.getCancelButton(),
      );
      return;
    }

    if (movie) {
      const nextEpisodeNumber = movie.totalEpisodes + 1;

      this.sessionService.updateSessionData(ctx.from.id, {
        contentType: 'movie',
        movieId: movie.id,
        movieCode: movie.code,
        movieTitle: movie.title,
        movieGenre: movie.genre,
        movieFieldId: movie.fieldId,
        movieChannelMessageId: movie.channelMessageId,
        nextEpisodeNumber,
        addedEpisodes: [],
        episodesUploaded: 0,
      });
      const session = this.sessionService.getSession(ctx.from.id);
      if (session) {
        session.state = AdminState.ADDING_EPISODES;
      }
      this.sessionService.setStep(ctx.from.id, 1); // VIDEO step

      await ctx.reply(
        `🎬 Kino topildi!\n\n` +
        `🏷 ${movie.title}\n` +
        `📹 Mavjud qismlar: ${movie.totalEpisodes}\n\n` +
        `📹 ${nextEpisodeNumber}-qism videosini yuboring:`,
        AdminKeyboard.getCancelButton(),
      );
    } else if (serial) {
      const nextEpisodeNumber = serial.totalEpisodes + 1;

      this.sessionService.updateSessionData(ctx.from.id, {
        contentType: 'serial',
        serialId: serial.id,
        serialCode: serial.code,
        serialTitle: serial.title,
        serialGenre: serial.genre,
        serialFieldId: serial.fieldId,
        serialChannelMessageId: serial.channelMessageId,
        nextEpisodeNumber,
        addedEpisodes: [],
        episodesUploaded: 0,
      });
      const session = this.sessionService.getSession(ctx.from.id);
      if (session) {
        session.state = AdminState.ADDING_EPISODES;
      }
      this.sessionService.setStep(ctx.from.id, 1); // VIDEO step

      await ctx.reply(
        `📺 Serial topildi!\n\n` +
        `🏷 ${serial.title}\n` +
        `📹 Mavjud qismlar: ${serial.totalEpisodes}\n\n` +
        `📹 ${nextEpisodeNumber}-qism videosini yuboring:`,
        AdminKeyboard.getCancelButton(),
      );
    }
  }

  async handleExistingContentEpisodeVideo(
    ctx: BotContext,
    videoFileId: string,
    session: any,
  ) {
    if (!ctx.from) return;

    const {
      nextEpisodeNumber = 1,
      addedEpisodes = [],
      episodesUploaded = 0,
      contentType,
    } = session.data || {};

    const updatedEpisodes = [
      ...addedEpisodes,
      {
        episodeNumber: nextEpisodeNumber,
        videoFileId,
      },
    ];

    const newEpisodesUploaded = episodesUploaded + 1;

    this.sessionService.updateSessionData(ctx.from.id, {
      addedEpisodes: updatedEpisodes,
      nextEpisodeNumber: nextEpisodeNumber + 1,
      episodesUploaded: newEpisodesUploaded,
    });

    // Show options after each video upload
    const keyboard = new Keyboard()
      .text(`➕ ${nextEpisodeNumber + 1}-qism yuklash`)
      .row()
      .text('✅ Tugatish')
      .row()
      .text('❌ Bekor qilish')
      .resized();

    await ctx.reply(
      `✅ ${nextEpisodeNumber}-qism yuklandi!\n\nDavom ettirasizmi?`,
      { reply_markup: keyboard },
    );
  }

  async finalizeAddingEpisodes(ctx: BotContext, updateField: boolean) {
    if (!ctx.from) return;

    const session = this.sessionService.getSession(ctx.from.id);
    if (!session || !session.data) {
      await ctx.reply('❌ Session topilmadi. Qaytadan boshlang.');
      return;
    }

    const {
      contentType,
      movieId,
      movieCode,
      movieTitle,
      movieGenre,
      movieFieldId,
      movieChannelMessageId,
      serialId,
      serialCode,
      serialTitle,
      serialGenre,
      serialFieldId,
      serialChannelMessageId,
      addedEpisodes = [],
    } = session.data;

    if (addedEpisodes.length === 0) {
      await ctx.reply("❌ Hech qanday qism qo'shilmadi.");
      this.sessionService.clearSession(ctx.from.id);
      return;
    }

    try {
      await ctx.reply('⏳ Qismlar yuklanmoqda...');

      const dbChannels = await this.channelService.findAllDatabase();
      const botInfo = await ctx.api.getMe();
      const botUsername = botInfo.username;

      if (contentType === 'movie') {
        if (!movieId) {
          await ctx.reply("❌ Kino ma'lumotlari topilmadi.");
          this.sessionService.clearSession(ctx.from.id);
          return;
        }

        for (const ep of addedEpisodes) {
          const videoMessages: { channelId: string; messageId: number }[] = [];
          for (const dbChannel of dbChannels) {
            try {
              const caption = `╭────────────────────
├‣ Kino nomi: ${movieTitle}
├‣ Kino kodi: ${movieCode}
├‣ Qism: ${ep.episodeNumber}
├‣ Janrlari: ${movieGenre || "Noma'lum"}
├‣ Kanal: ${dbChannel.channelLink || 'https://t.me/' + dbChannel.channelName}
╰────────────────────

▶️ Kinoning to'liq qismini https://t.me/${botUsername}?start=${movieCode} dan tomosha qilishingiz mumkin!

<blockquote expandable>⚠️ ESLATMA:
Biz yuklayotgan kinolar turli saytlardan olinadi.
🎰 Ba'zi kinolarda kazino, qimor yoki "pulni ko'paytirib beramiz" degan reklama chiqishi mumkin.
🚫 Bunday reklamalarga aslo ishonmang! Ular firibgarlar va sizni aldaydi.
🔞 Ba'zi sahnalar 18+ bo'lishi mumkin – agar noqulay bo'lsa, ko'rishni to'xtating.</blockquote>`;

              const sentVideo = await ctx.api.sendVideo(
                dbChannel.channelId,
                ep.videoFileId,
                { caption, parse_mode: 'HTML' },
              );
              videoMessages.push({
                channelId: dbChannel.channelId,
                messageId: sentVideo.message_id,
              });
            } catch (error) {
              this.logger.error('Error uploading movie episode:', error);
            }
          }

          await this.movieEpisodeService.create({
            movieId: movieId,
            episodeNumber: ep.episodeNumber,
            videoFileId: ep.videoFileId,
            videoMessageId: JSON.stringify(videoMessages),
          });
        }

        // Yangi qismlar sonini hisoblash
        const allEpisodes =
          await this.movieEpisodeService.findByMovieId(movieId);
        const totalEpisodes =
          allEpisodes.length > 0 ? 1 + allEpisodes.length : 1;
        await this.movieService.update(movieId, { totalEpisodes });

        // Field kanalga yangilash
        if (updateField && movieChannelMessageId && movieFieldId) {
          const field = await this.fieldService.findOne(movieFieldId);
          if (field) {
            const caption = `╭────────────────────
├‣ Kino nomi: ${movieTitle}
├‣ Kino kodi: ${movieCode}
├‣ Qismlar: ${totalEpisodes}
├‣ Janrlari: ${movieGenre || "Noma'lum"}
├‣ Kanal: ${field.channelLink || '@' + field.name}
╰────────────────────

▶️ Kinoning to'liq qismlarini https://t.me/${this.grammyBot.botUsername}?start=${movieCode} dan tomosha qilishingiz mumkin!

<blockquote expandable>⚠️ ESLATMA:
Biz yuklayotgan kinolar turli saytlardan olinadi.
🎰 Ba'zi kinolarda kazino, qimor yoki "pulni ko'paytirib beramiz" degan reklama chiqishi mumkin.
🚫 Bunday reklamalarga aslo ishonmang! Ular firibgarlar va sizni aldaydi.
🔞 Ba'zi sahnalar 18+ bo'lishi mumkin – agar noqulay bo'lsa, ko'rishni to'xtating.</blockquote>`;

            const keyboard = new InlineKeyboard().url(
              '✨ Tomosha Qilish',
              `https://t.me/${this.grammyBot.botUsername}?start=${movieCode}`,
            );

            try {
              await ctx.api.editMessageCaption(
                field.channelId,
                movieChannelMessageId,
                { caption, reply_markup: keyboard, parse_mode: 'HTML' },
              );
            } catch (error) {
              this.logger.error(
                'Error updating movie field channel poster:',
                error,
              );
            }
          }
        }

        this.sessionService.clearSession(ctx.from.id);
        await ctx.reply(
          `✅ Qismlar muvaffaqiyatli qo'shildi!\n\n` +
          `🎬 ${movieTitle}\n` +
          `📹 Jami qismlar: ${totalEpisodes}\n` +
          `➕ Qo'shildi: ${addedEpisodes.length} ta`,
          AdminKeyboard.getAdminMainMenu('ADMIN'),
        );
      } else if (contentType === 'serial') {
        if (!serialId) {
          await ctx.reply("❌ Serial ma'lumotlari topilmadi.");
          this.sessionService.clearSession(ctx.from.id);
          return;
        }

        for (const ep of addedEpisodes) {
          const videoMessages: { channelId: string; messageId: number }[] = [];
          for (const dbChannel of dbChannels) {
            try {
              const caption = `╭────────────────────
├‣ Serial nomi: ${serialTitle}
├‣ Serial kodi: ${serialCode}
├‣ Qism: ${ep.episodeNumber}
├‣ Janrlari: ${serialGenre || "Noma'lum"}
├‣ Kanal: ${dbChannel.channelLink || dbChannel}
╰────────────────────

▶️ Serialning to'liq qismini https://t.me/${botUsername}?start=${serialCode} dan tomosha qilishingiz mumkin!

<blockquote expandable>⚠️ ESLATMA:
Biz yuklayotgan kinolar turli saytlardan olinadi.
🎰 Ba'zi kinolarda kazino, qimor yoki "pulni ko'paytirib beramiz" degan reklama chiqishi mumkin.
🚫 Bunday reklamalarga aslo ishonmang! Ular firibgarlar va sizni aldaydi.
🔞 Ba'zi sahnalar 18+ bo'lishi mumkin – agar noqulay bo'lsa, ko'rishni to'xtating.</blockquote>`;

              const sentVideo = await ctx.api.sendVideo(
                dbChannel.channelId,
                ep.videoFileId,
                { caption, parse_mode: 'HTML' },
              );
              videoMessages.push({
                channelId: dbChannel.channelId,
                messageId: sentVideo.message_id,
              });
            } catch (error) {
              this.logger.error('Error uploading episode:', error);
            }
          }

          await this.episodeService.create({
            serialId: serialId,
            episodeNumber: ep.episodeNumber,
            videoFileId: ep.videoFileId,
            videoMessageId: JSON.stringify(videoMessages),
          });
        }

        // Yangi qismlar sonini hisoblash
        const allEpisodes = await this.episodeService.findBySerialId(serialId);
        const totalEpisodes = allEpisodes.length;
        await this.serialService.update(serialId, { totalEpisodes });

        // Field kanalga yangilash
        if (updateField && serialChannelMessageId && serialFieldId) {
          const field = await this.fieldService.findOne(serialFieldId);
          if (field) {
            const caption = `╭────────────────────
├‣ Serial nomi: ${serialTitle}
├‣ Serial kodi: ${serialCode}
├‣ Qismlar: ${totalEpisodes}
├‣ Janrlari: ${serialGenre || "Noma'lum"}
├‣ Kanal: ${field.channelLink || '@' + field.name}
╰────────────────────

▶️ Serialning to'liq qismlarini https://t.me/${this.grammyBot.botUsername}?start=s${serialCode} dan tomosha qilishingiz mumkin!

<blockquote expandable>⚠️ ESLATMA:
Biz yuklayotgan kinolar turli saytlardan olinadi.
🎰 Ba'zi kinolarda kazino, qimor yoki "pulni ko'paytirib beramiz" degan reklama chiqishi mumkin.
🚫 Bunday reklamalarga aslo ishonmang! Ular firibgarlar va sizni aldaydi.
🔞 Ba'zi sahnalar 18+ bo'lishi mumkin – agar noqulay bo'lsa, ko'rishni to'xtating.</blockquote>`;

            const keyboard = new InlineKeyboard().url(
              '✨ Tomosha Qilish',
              `https://t.me/${this.grammyBot.botUsername}?start=s${serialCode}`,
            );

            try {
              await ctx.api.editMessageCaption(
                field.channelId,
                serialChannelMessageId,
                { caption, reply_markup: keyboard, parse_mode: 'HTML' },
              );
            } catch (error) {
              this.logger.error(
                'Error updating serial field channel poster:',
                error,
              );
            }
          }
        }

        this.sessionService.clearSession(ctx.from.id);
        await ctx.reply(
          `✅ Qismlar muvaffaqiyatli qo'shildi!\n\n` +
          `📺 ${serialTitle}\n` +
          `📹 Jami qismlar: ${totalEpisodes}\n` +
          `➕ Qo'shildi: ${addedEpisodes.length} ta`,
          AdminKeyboard.getAdminMainMenu('ADMIN'),
        );
      } else {
        await ctx.reply("❌ Noto'g'ri content turi.");
        this.sessionService.clearSession(ctx.from.id);
      }
    } catch (error: any) {
      this.logger.error('Error finalizing episodes:', error);
      await ctx.reply(`❌ Xatolik: ${error?.message || "Noma'lum xatolik"}`);
      this.sessionService.clearSession(ctx.from.id);
    }
  }
}

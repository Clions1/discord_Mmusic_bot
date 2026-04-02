const { SlashCommandBuilder } = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');
const queue = require('../utils/queue');
const { searchSong, getPlaylist } = require('../utils/search');
const { playSong } = require('../utils/player');
const { buildAddedToQueueEmbed, buildErrorEmbed, buildInfoEmbed } = require('../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Şarkı çal veya kuyruğa ekle')
        .addStringOption(option =>
            option
                .setName('sorgu')
                .setDescription('Şarkı adı veya YouTube URL\'si')
                .setRequired(true)
        ),

    async execute(interaction) {
        const voiceChannel = interaction.member.voice.channel;

        if (!voiceChannel) {
            return interaction.reply({
                embeds: [buildErrorEmbed('Bir ses kanalında olmalısın!')],
                ephemeral: true,
            });
        }

        // Bot izinlerini kontrol et
        const permissions = voiceChannel.permissionsFor(interaction.client.user);
        if (!permissions.has('Connect') || !permissions.has('Speak')) {
            return interaction.reply({
                embeds: [buildErrorEmbed('Ses kanalına bağlanma veya konuşma iznim yok!')],
                ephemeral: true,
            });
        }

        await interaction.deferReply();

        const query = interaction.options.getString('sorgu');
        const serverQueue = queue.get(interaction.guildId);

        // Playlist kontrolü
        const playlistPattern = /[?&]list=([a-zA-Z0-9_-]+)/;
        const isPlaylist = playlistPattern.test(query);

        if (isPlaylist) {
            let songs = await getPlaylist(query);

            if (!songs.length) {
                return interaction.editReply({
                    embeds: [buildErrorEmbed('Playlist yüklenirken hata oluştu veya playlist boş.')],
                });
            }

            let notice = '';
            const originalLength = songs.length;
            if (songs.length > 50) {
                songs = songs.slice(0, 50);
                notice = `\n\n⚠️ **${originalLength}** şarkıdan **50** şarkı sıraya eklenebildi (maksimum 50 şarkı seçilebilir).`;
            }

            // Her şarkıya isteyen kişiyi ekle
            songs.forEach(s => s.requestedBy = interaction.user.tag);

            const wasEmpty = serverQueue.songs.length === 0;
            serverQueue.songs.push(...songs);

            // Ses kanalına bağlan (bağlı değilse)
            if (!serverQueue.connection) {
                serverQueue.connection = joinVoiceChannel({
                    channelId: voiceChannel.id,
                    guildId: interaction.guildId,
                    adapterCreator: interaction.guild.voiceAdapterCreator,
                    selfDeaf: true,
                });
                serverQueue.voiceChannel = voiceChannel;
            }

            serverQueue.textChannel = interaction.channel;

            await interaction.editReply({
                embeds: [buildInfoEmbed(
                    '📋 Playlist Eklendi',
                    `**${songs.length}** şarkı kuyruğa eklendi.\nİlk şarkı: **${songs[0].title}**${notice}`
                )],
            });

            if (wasEmpty || !serverQueue.playing) {
                serverQueue.currentIndex = wasEmpty ? 0 : serverQueue.currentIndex;
                playSong(interaction.guildId);
            }

            return;
        }

        // Tekil şarkı arama
        const song = await searchSong(query);

        if (!song) {
            return interaction.editReply({
                embeds: [buildErrorEmbed('Şarkı bulunamadı veya bir hata oluştu.')],
            });
        }

        song.requestedBy = interaction.user.tag;

        const wasEmpty = serverQueue.songs.length === 0;
        serverQueue.songs.push(song);

        // Ses kanalına bağlan (bağlı değilse)
        if (!serverQueue.connection) {
            serverQueue.connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: interaction.guildId,
                adapterCreator: interaction.guild.voiceAdapterCreator,
                selfDeaf: true,
            });
            serverQueue.voiceChannel = voiceChannel;
        }

        serverQueue.textChannel = interaction.channel;

        if (wasEmpty || !serverQueue.playing) {
            serverQueue.currentIndex = serverQueue.songs.length - 1;
            await interaction.editReply({
                embeds: [buildInfoEmbed('🎵 Çalınıyor...', `**${song.title}** yükleniyor...`)],
            });
            playSong(interaction.guildId);
        } else {
            await interaction.editReply({
                embeds: [buildAddedToQueueEmbed(song, serverQueue.songs.length)],
            });
        }
    },
};

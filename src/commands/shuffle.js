const { SlashCommandBuilder } = require('discord.js');
const queue = require('../utils/queue');
const { buildErrorEmbed, buildInfoEmbed } = require('../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shuffle')
        .setDescription('Kuyruğu karıştır'),

    async execute(interaction) {
        const serverQueue = queue.get(interaction.guildId);

        if (serverQueue.songs.length < 3) {
            return interaction.reply({
                embeds: [buildErrorEmbed('Karıştırmak için en az 3 şarkı olmalı!')],
                ephemeral: true,
            });
        }

        const voiceChannel = interaction.member.voice.channel;
        if (!voiceChannel || voiceChannel.id !== serverQueue.voiceChannel?.id) {
            return interaction.reply({
                embeds: [buildErrorEmbed('Botla aynı ses kanalında olmalısın!')],
                ephemeral: true,
            });
        }

        // Şu an çalan şarkıyı koru, geri kalanını karıştır
        const currentSong = serverQueue.songs[serverQueue.currentIndex];
        const otherSongs = serverQueue.songs.filter((_, i) => i !== serverQueue.currentIndex);

        // Fisher-Yates shuffle
        for (let i = otherSongs.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [otherSongs[i], otherSongs[j]] = [otherSongs[j], otherSongs[i]];
        }

        serverQueue.songs = [currentSong, ...otherSongs];
        serverQueue.currentIndex = 0;

        await interaction.reply({
            embeds: [buildInfoEmbed('🔀 Karıştırıldı', `**${serverQueue.songs.length}** şarkı karıştırıldı.`)],
        });
    },
};

const { SlashCommandBuilder } = require('discord.js');
const queue = require('../utils/queue');
const { buildNowPlayingEmbed, buildErrorEmbed } = require('../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nowplaying')
        .setDescription('Şu anda çalan şarkıyı göster'),

    async execute(interaction) {
        const serverQueue = queue.get(interaction.guildId);

        if (!serverQueue.playing || !serverQueue.songs[serverQueue.currentIndex]) {
            return interaction.reply({
                embeds: [buildErrorEmbed('Şu anda çalan bir şarkı yok!')],
                ephemeral: true,
            });
        }

        const song = serverQueue.songs[serverQueue.currentIndex];

        await interaction.reply({
            embeds: [buildNowPlayingEmbed(song, serverQueue)],
        });
    },
};

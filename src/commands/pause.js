const { SlashCommandBuilder } = require('discord.js');
const { AudioPlayerStatus } = require('@discordjs/voice');
const queue = require('../utils/queue');
const { buildErrorEmbed, buildInfoEmbed } = require('../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pause')
        .setDescription('Şarkıyı duraklat veya devam ettir'),

    async execute(interaction) {
        const serverQueue = queue.get(interaction.guildId);

        if (!serverQueue.player) {
            return interaction.reply({
                embeds: [buildErrorEmbed('Şu anda çalan bir şarkı yok!')],
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

        if (serverQueue.player.state.status === AudioPlayerStatus.Paused) {
            serverQueue.player.unpause();
            await interaction.reply({
                embeds: [buildInfoEmbed('▶️ Devam', 'Müzik devam ediyor.')],
            });
        } else {
            serverQueue.player.pause();
            await interaction.reply({
                embeds: [buildInfoEmbed('⏸️ Duraklatıldı', 'Müzik duraklatıldı. Devam ettirmek için tekrar `/pause` yaz.')],
            });
        }
    },
};

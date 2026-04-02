const { SlashCommandBuilder } = require('discord.js');
const queue = require('../utils/queue');
const { buildErrorEmbed, buildInfoEmbed } = require('../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Şu anki şarkıyı atla'),

    async execute(interaction) {
        const serverQueue = queue.get(interaction.guildId);

        if (!serverQueue.playing || !serverQueue.player) {
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

        const skippedSong = serverQueue.songs[serverQueue.currentIndex];
        serverQueue.player.stop(); // Bu otomatik olarak Idle event tetikler

        await interaction.reply({
            embeds: [buildInfoEmbed('⏭️ Atlandı', `**${skippedSong?.title || 'Bilinmeyen'}** atlandı.`)],
        });
    },
};

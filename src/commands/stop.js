const { SlashCommandBuilder } = require('discord.js');
const queue = require('../utils/queue');
const { buildErrorEmbed, buildInfoEmbed } = require('../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Müziği durdur ve kuyruğu temizle'),

    async execute(interaction) {
        const serverQueue = queue.get(interaction.guildId);

        if (!serverQueue.connection) {
            return interaction.reply({
                embeds: [buildErrorEmbed('Bot şu anda bir ses kanalında değil!')],
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

        queue.delete(interaction.guildId);

        await interaction.reply({
            embeds: [buildInfoEmbed('⏹️ Durduruldu', 'Müzik durduruldu ve kuyruk temizlendi.')],
        });
    },
};

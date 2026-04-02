const { SlashCommandBuilder } = require('discord.js');
const queue = require('../utils/queue');
const { buildQueueEmbed, buildErrorEmbed } = require('../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Müzik kuyruğunu göster')
        .addIntegerOption(option =>
            option
                .setName('sayfa')
                .setDescription('Sayfa numarası')
                .setRequired(false)
                .setMinValue(1)
        ),

    async execute(interaction) {
        const serverQueue = queue.get(interaction.guildId);

        if (!serverQueue.songs.length) {
            return interaction.reply({
                embeds: [buildErrorEmbed('Kuyruk boş! `/play` komutu ile şarkı ekle.')],
                ephemeral: true,
            });
        }

        const page = (interaction.options.getInteger('sayfa') || 1) - 1;

        await interaction.reply({
            embeds: [buildQueueEmbed(serverQueue.songs, serverQueue.currentIndex, page)],
        });
    },
};

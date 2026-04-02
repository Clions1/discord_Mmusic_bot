const { SlashCommandBuilder } = require('discord.js');
const queue = require('../utils/queue');
const { buildErrorEmbed, buildInfoEmbed } = require('../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remove')
        .setDescription('Kuyruktan şarkı kaldır')
        .addIntegerOption(option =>
            option
                .setName('numara')
                .setDescription('Kaldırılacak şarkının numarası')
                .setRequired(true)
                .setMinValue(1)
        ),

    async execute(interaction) {
        const serverQueue = queue.get(interaction.guildId);

        if (!serverQueue.songs.length) {
            return interaction.reply({
                embeds: [buildErrorEmbed('Kuyruk boş!')],
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

        const index = interaction.options.getInteger('numara') - 1;

        if (index < 0 || index >= serverQueue.songs.length) {
            return interaction.reply({
                embeds: [buildErrorEmbed(`Geçersiz numara! 1-${serverQueue.songs.length} arası bir değer gir.`)],
                ephemeral: true,
            });
        }

        if (index === serverQueue.currentIndex) {
            return interaction.reply({
                embeds: [buildErrorEmbed('Şu anda çalan şarkıyı kaldıramazsın! Atlamak için `/skip` kullan.')],
                ephemeral: true,
            });
        }

        const removed = serverQueue.songs.splice(index, 1)[0];

        // Index güncelle
        if (index < serverQueue.currentIndex) {
            serverQueue.currentIndex--;
        }

        await interaction.reply({
            embeds: [buildInfoEmbed('🗑️ Kaldırıldı', `**${removed.title}** kuyruktan kaldırıldı.`)],
        });
    },
};

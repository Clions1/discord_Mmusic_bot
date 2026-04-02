const { SlashCommandBuilder } = require('discord.js');
const queue = require('../utils/queue');
const { buildErrorEmbed, buildInfoEmbed } = require('../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Kuyruğu temizle (şu an çalan şarkı hariç)'),

    async execute(interaction) {
        const serverQueue = queue.get(interaction.guildId);

        if (!serverQueue.songs.length) {
            return interaction.reply({
                embeds: [buildErrorEmbed('Kuyruk zaten boş!')],
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

        const currentSong = serverQueue.songs[serverQueue.currentIndex];
        const removedCount = serverQueue.songs.length - 1;

        if (currentSong && serverQueue.playing) {
            serverQueue.songs = [currentSong];
            serverQueue.currentIndex = 0;
        } else {
            serverQueue.songs = [];
            serverQueue.currentIndex = 0;
        }

        await interaction.reply({
            embeds: [buildInfoEmbed('🗑️ Kuyruk Temizlendi', `**${removedCount}** şarkı kuyruktan kaldırıldı.`)],
        });
    },
};

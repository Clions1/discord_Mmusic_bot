const { SlashCommandBuilder } = require('discord.js');
const queue = require('../utils/queue');
const { playSong } = require('../utils/player');
const { buildErrorEmbed, buildInfoEmbed } = require('../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('jump')
        .setDescription('Kuyruktaki belirli bir şarkıya atla')
        .addIntegerOption(option =>
            option
                .setName('numara')
                .setDescription('Şarkı numarası')
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

        serverQueue.currentIndex = index;
        serverQueue.player?.stop();

        const song = serverQueue.songs[index];
        await interaction.reply({
            embeds: [buildInfoEmbed('⏭️ Atlanıyor', `**#${index + 1} ${song.title}** şarkısına atlıyorum...`)],
        });

        playSong(interaction.guildId);
    },
};

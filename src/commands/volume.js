const { SlashCommandBuilder } = require('discord.js');
const queue = require('../utils/queue');
const { buildErrorEmbed, buildInfoEmbed } = require('../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('volume')
        .setDescription('Ses seviyesini ayarla')
        .addIntegerOption(option =>
            option
                .setName('seviye')
                .setDescription('Ses seviyesi (0-150)')
                .setRequired(true)
                .setMinValue(0)
                .setMaxValue(150)
        ),

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

        const volume = interaction.options.getInteger('seviye');
        serverQueue.volume = volume;

        // Mevcut resource'un volume'unu güncelle
        if (serverQueue.player.state.resource?.volume) {
            serverQueue.player.state.resource.volume.setVolume(volume / 100);
        }

        await interaction.reply({
            embeds: [buildInfoEmbed('🔊 Ses Seviyesi', `Ses seviyesi **${volume}%** olarak ayarlandı.`)],
        });
    },
};

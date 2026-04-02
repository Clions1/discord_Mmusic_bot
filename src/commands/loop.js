const { SlashCommandBuilder } = require('discord.js');
const queue = require('../utils/queue');
const { buildErrorEmbed, buildInfoEmbed } = require('../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('loop')
        .setDescription('Döngü modunu değiştir')
        .addStringOption(option =>
            option
                .setName('mod')
                .setDescription('Döngü modu')
                .setRequired(true)
                .addChoices(
                    { name: '❌ Kapalı', value: 'off' },
                    { name: '🔂 Şarkı Tekrar', value: 'track' },
                    { name: '🔁 Kuyruk Tekrar', value: 'queue' },
                )
        ),

    async execute(interaction) {
        const serverQueue = queue.get(interaction.guildId);

        if (!serverQueue.songs.length) {
            return interaction.reply({
                embeds: [buildErrorEmbed('Kuyrukta şarkı yok!')],
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

        const mode = interaction.options.getString('mod');
        serverQueue.loop = mode;

        const modeText = {
            'off': '❌ Kapalı',
            'track': '🔂 Şarkı Tekrar',
            'queue': '🔁 Kuyruk Tekrar',
        };

        await interaction.reply({
            embeds: [buildInfoEmbed('🔄 Döngü Modu', `Döngü modu **${modeText[mode]}** olarak ayarlandı.`)],
        });
    },
};

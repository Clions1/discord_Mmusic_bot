const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { COLORS } = require('../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Tüm komutları göster'),

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor(COLORS.PRIMARY)
            .setTitle('🎵 Müzik Botu - Komutlar')
            .setDescription('Aşağıda kullanabileceğin tüm komutlar listelenmiştir.')
            .addFields(
                {
                    name: '🎶 Temel Komutlar',
                    value: [
                        '`/play <sorgu>` - Şarkı çal veya kuyruğa ekle',
                        '`/pause` - Duraklat / Devam ettir',
                        '`/skip` - Şarkıyı atla',
                        '`/stop` - Müziği durdur ve kuyruğu temizle',
                    ].join('\n'),
                },
                {
                    name: '📋 Kuyruk Yönetimi',
                    value: [
                        '`/queue [sayfa]` - Kuyruğu göster',
                        '`/nowplaying` - Şu an çalan şarkıyı göster',
                        '`/jump <numara>` - Belirli bir şarkıya atla',
                        '`/remove <numara>` - Şarkıyı kuyruktan kaldır',
                        '`/clear` - Kuyruğu temizle',
                        '`/shuffle` - Kuyruğu karıştır',
                    ].join('\n'),
                },
                {
                    name: '⚙️ Ayarlar',
                    value: [
                        '`/volume <0-150>` - Ses seviyesini ayarla',
                        '`/loop <mod>` - Döngü modunu ayarla',
                    ].join('\n'),
                },
                {
                    name: '📖 Bilgi',
                    value: [
                        '`/help` - Bu mesajı göster',
                    ].join('\n'),
                },
            )
            .setFooter({ text: '🎵 YouTube\'dan müzik çal!' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const COLORS = {
    PRIMARY: 0x5865F2,   // Discord Blurple
    SUCCESS: 0x57F287,   // Yeşil
    WARNING: 0xFEE75C,   // Sarı
    ERROR: 0xED4245,     // Kırmızı
    INFO: 0xEB459E,      // Pembe
};

/**
 * Şimdi çalınan şarkı embed'i
 */
function buildNowPlayingEmbed(song, serverQueue) {
    const loopText = {
        'off': '❌ Kapalı',
        'track': '🔂 Şarkı Tekrar',
        'queue': '🔁 Kuyruk Tekrar',
    };

    let durationValue = song.duration || 'Bilinmiyor';
    
    if (song.durationSeconds > 0 && serverQueue) {
        const isPaused = serverQueue.player?.state?.status === 'paused';
        const playbackDuration = serverQueue.player?.state?.resource?.playbackDuration || 0;
        const elapsedSeconds = Math.floor(playbackDuration / 1000);
        
        const formatSecs = (s) => `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
        const currentStr = formatSecs(elapsedSeconds);
        const totalStr = formatSecs(song.durationSeconds);
        
        let bar = '';
        const blocks = 15;
        const progress = Math.min(1, elapsedSeconds / song.durationSeconds);
        const activeBlock = Math.floor(progress * blocks);
        for(let i = 0; i < blocks; i++) {
            bar += (i === activeBlock) ? '🔘' : '▬';
        }

        durationValue = `\`${currentStr} / ${totalStr}\`\n${bar}`;
        if (isPaused) durationValue += ' ⏸️';
    }

    return new EmbedBuilder()
        .setColor(COLORS.PRIMARY)
        .setTitle('🎵 Şimdi Çalınıyor')
        .setDescription(`**[${song.title}](${song.url})**`)
        .addFields(
            { name: '⏱️ Süre', value: durationValue, inline: true },
            { name: '🔊 Ses', value: `${serverQueue.volume}%`, inline: true },
            { name: '🔄 Döngü', value: loopText[serverQueue.loop], inline: true },
            { name: '📋 Sıra', value: `${serverQueue.currentIndex + 1}/${serverQueue.songs.length}`, inline: true },
        )
        .setThumbnail(song.thumbnail || null)
        .setFooter({ text: `İsteyen: ${song.requestedBy}` })
        .setTimestamp();
}

/**
 * Müzik kontrol butonları
 */
function buildPlayerButtons(serverQueue) {
    const isPaused = serverQueue.player?.state?.status === 'paused';

    const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('music_previous')
            .setEmoji('⏮️')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(serverQueue.currentIndex <= 0),
        new ButtonBuilder()
            .setCustomId('music_pause')
            .setEmoji(isPaused ? '▶️' : '⏸️')
            .setStyle(isPaused ? ButtonStyle.Success : ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId('music_skip')
            .setEmoji('⏭️')
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('music_stop')
            .setEmoji('⏹️')
            .setStyle(ButtonStyle.Danger),
    );

    const loopEmoji = {
        'off': '➡️',
        'track': '🔂',
        'queue': '🔁',
    };

    const loopStyle = {
        'off': ButtonStyle.Secondary,
        'track': ButtonStyle.Success,
        'queue': ButtonStyle.Success,
    };

    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('music_shuffle')
            .setEmoji('🔀')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(serverQueue.songs.length < 3),
        new ButtonBuilder()
            .setCustomId('music_loop')
            .setEmoji(loopEmoji[serverQueue.loop])
            .setStyle(loopStyle[serverQueue.loop])
            .setLabel(serverQueue.loop === 'off' ? 'Döngü' : serverQueue.loop === 'track' ? 'Şarkı' : 'Kuyruk'),
        new ButtonBuilder()
            .setCustomId('music_voldown')
            .setEmoji('🔉')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(serverQueue.volume <= 0),
        new ButtonBuilder()
            .setCustomId('music_volup')
            .setEmoji('🔊')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(serverQueue.volume >= 150),
        new ButtonBuilder()
            .setCustomId('music_queue')
            .setEmoji('📋')
            .setStyle(ButtonStyle.Secondary),
    );

    return [row1, row2];
}

/**
 * Kuyruğa eklendi embed'i
 */
function buildAddedToQueueEmbed(song, position) {
    return new EmbedBuilder()
        .setColor(COLORS.SUCCESS)
        .setTitle('✅ Kuyruğa Eklendi')
        .setDescription(`**[${song.title}](${song.url})**`)
        .addFields(
            { name: '⏱️ Süre', value: song.duration || 'Bilinmiyor', inline: true },
            { name: '📋 Sıradaki Pozisyon', value: `#${position}`, inline: true },
        )
        .setThumbnail(song.thumbnail || null)
        .setFooter({ text: `İsteyen: ${song.requestedBy}` })
        .setTimestamp();
}

/**
 * Kuyruk listesi embed'i
 */
function buildQueueEmbed(songs, currentIndex, page = 0) {
    const pageSize = 10;
    const totalPages = Math.ceil(songs.length / pageSize);
    const start = page * pageSize;
    const end = Math.min(start + pageSize, songs.length);

    let description = '';
    for (let i = start; i < end; i++) {
        const song = songs[i];
        const prefix = i === currentIndex ? '▶️' : `**${i + 1}.**`;
        description += `${prefix} [${song.title}](${song.url}) - \`${song.duration || '?'}\`\n`;
    }

    if (!description) {
        description = 'Kuyruk boş.';
    }

    return new EmbedBuilder()
        .setColor(COLORS.INFO)
        .setTitle('📋 Müzik Kuyruğu')
        .setDescription(description)
        .setFooter({ text: `Sayfa ${page + 1}/${totalPages || 1} • Toplam ${songs.length} şarkı` })
        .setTimestamp();
}

/**
 * Hata embed'i
 */
function buildErrorEmbed(message) {
    return new EmbedBuilder()
        .setColor(COLORS.ERROR)
        .setTitle('❌ Hata')
        .setDescription(message)
        .setTimestamp();
}

/**
 * Bilgi embed'i
 */
function buildInfoEmbed(title, message) {
    return new EmbedBuilder()
        .setColor(COLORS.PRIMARY)
        .setTitle(title)
        .setDescription(message)
        .setTimestamp();
}

module.exports = {
    buildNowPlayingEmbed,
    buildPlayerButtons,
    buildAddedToQueueEmbed,
    buildQueueEmbed,
    buildErrorEmbed,
    buildInfoEmbed,
    COLORS,
};

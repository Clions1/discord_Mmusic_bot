const {
    createAudioPlayer,
    createAudioResource,
    AudioPlayerStatus,
    NoSubscriberBehavior,
    StreamType,
} = require('@discordjs/voice');
const { spawn, execSync } = require('child_process');
const queue = require('./queue');
const { buildNowPlayingEmbed, buildPlayerButtons } = require('./embeds');

/**
 * yt-dlp ile şarkının direkt URL'sini al, FFmpeg ile stream yap
 * @param {string} guildId
 */
async function playSong(guildId) {
    const serverQueue = queue.get(guildId);

    if (serverQueue.progressInterval) {
        clearInterval(serverQueue.progressInterval);
        serverQueue.progressInterval = null;
    }

    if (!serverQueue.songs.length || serverQueue.currentIndex >= serverQueue.songs.length) {
        serverQueue.playing = false;
        // 3 dakika boşta kalırsa çık
        setTimeout(() => {
            const q = queue.get(guildId);
            if (!q.playing && q.connection) {
                q.textChannel?.send('⏹️ **3 dakika boyunca şarkı çalınmadı, kanaldan ayrılıyorum.**');
                queue.delete(guildId);
            }
        }, 180_000);
        return;
    }

    const song = serverQueue.songs[serverQueue.currentIndex];

    try {
        // yt-dlp ile direkt audio URL'sini al
        const audioUrl = execSync(
            `yt-dlp -f "ba[acodec=opus]/ba/b" --no-playlist -g "${song.url}"`,
            {
                encoding: 'utf-8',
                timeout: 15000,
            }
        ).trim();

        // FFmpeg ile stream yap - raw PCM çıktısı
        const ffmpeg = spawn('ffmpeg', [
            '-reconnect', '1',
            '-reconnect_streamed', '1',
            '-reconnect_delay_max', '5',
            '-i', audioUrl,
            '-analyzeduration', '0',
            '-loglevel', '0',
            '-f', 's16le',
            '-ar', '48000',
            '-ac', '2',
            'pipe:1',
        ], {
            stdio: ['pipe', 'pipe', 'pipe'],
        });

        ffmpeg.stderr.on('data', (data) => {
            const msg = data.toString();
            if (msg.includes('Error') || msg.includes('error')) {
                console.error(`[FFmpeg Error] ${msg}`);
            }
        });

        ffmpeg.on('error', (err) => {
            console.error('[FFmpeg Process Error]', err);
        });

        const resource = createAudioResource(ffmpeg.stdout, {
            inputType: StreamType.Raw,
            inlineVolume: true,
        });

        resource.volume?.setVolume(serverQueue.volume / 100);

        if (!serverQueue.player) {
            serverQueue.player = createAudioPlayer({
                behaviors: {
                    noSubscriber: NoSubscriberBehavior.Play,
                },
            });

            serverQueue.player.on('error', (error) => {
                console.error('[Player Error]', error.message);
                serverQueue.textChannel?.send(`❌ **Hata:** ${error.message}`);
                handleSongEnd(guildId);
            });

            serverQueue.player.on(AudioPlayerStatus.Idle, () => {
                handleSongEnd(guildId);
            });

            serverQueue.connection.subscribe(serverQueue.player);
        }

        serverQueue.player.play(resource);
        serverQueue.playing = true;

        // Şimdi çalınan şarkı bilgisi
        const embed = buildNowPlayingEmbed(song, serverQueue);
        const components = buildPlayerButtons(serverQueue);
        serverQueue.nowPlayingMessage = await serverQueue.textChannel?.send({ embeds: [embed], components });

        // Sürekli güncellenen progress bar
        serverQueue.progressInterval = setInterval(() => {
            if (!queue.has(guildId) || !serverQueue.playing) {
                clearInterval(serverQueue.progressInterval);
                return;
            }
            if (serverQueue.nowPlayingMessage && song.durationSeconds > 0) {
                const refreshedEmbed = buildNowPlayingEmbed(song, serverQueue);
                serverQueue.nowPlayingMessage.edit({ embeds: [refreshedEmbed] }).catch(() => {});
            }
        }, 5000);

    } catch (error) {
        console.error('[Play Error]', error.message);
        
        // Hata formatlaması
        let errorMessage = 'Bilinmeyen bir hata oluştu.';
        if (error.message.includes('Sign in to confirm your age')) {
            errorMessage = 'Bu şarkı **yaş kısıtlamasına** sahip olduğu için çalınamıyor (Oturum açma gerektiriyor).';
        } else if (error.message.includes('Video unavailable')) {
            errorMessage = 'Bu video kullanılamıyor veya gizli.';
        } else if (error.message.includes('No supported JavaScript runtime')) {
            errorMessage = 'Müzik verisi çözülemedi (JS runtime hatası). Yavaşça atlanıyor...';
        } else {
            errorMessage = 'Şarkı yüklenirken bir sorun oluştu, atlanıyor.';
        }

        serverQueue.textChannel?.send(`❌ **Hata:** ${errorMessage}`);
        handleSongEnd(guildId);
    }
}

/**
 * Şarkı bittiğinde sıradaki işlemi yap
 * @param {string} guildId
 */
function handleSongEnd(guildId) {
    const serverQueue = queue.get(guildId);

    if (serverQueue.loop === 'track') {
        playSong(guildId);
    } else if (serverQueue.loop === 'queue') {
        serverQueue.currentIndex++;
        if (serverQueue.currentIndex >= serverQueue.songs.length) {
            serverQueue.currentIndex = 0;
        }
        playSong(guildId);
    } else {
        serverQueue.currentIndex++;
        playSong(guildId);
    }
}

module.exports = { playSong };

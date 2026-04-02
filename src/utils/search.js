const { execSync } = require('child_process');

/**
 * yt-dlp ile YouTube'da arama yap veya URL bilgisi al
 * @param {string} query - Arama sorgusu veya URL
 * @returns {Promise<object|null>}
 */
async function searchSong(query) {
    try {
        let searchQuery = query;

        // URL değilse, YouTube'da arama yap
        const urlPattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be|music\.youtube\.com)\/.+/i;
        if (!urlPattern.test(query)) {
            searchQuery = `ytsearch1:${query}`;
        }

        const result = execSync(
            `yt-dlp --no-playlist --print-json --skip-download "${searchQuery}"`,
            {
                encoding: 'utf-8',
                timeout: 15000,
                maxBuffer: 10 * 1024 * 1024,
            }
        );

        const info = JSON.parse(result.trim());

        return {
            title: info.title || 'Bilinmeyen Şarkı',
            url: info.webpage_url || info.original_url || query,
            duration: formatDuration(info.duration),
            thumbnail: info.thumbnail || info.thumbnails?.[0]?.url || null,
            durationSeconds: info.duration || 0,
        };
    } catch (error) {
        console.error('[Search Error]', error.message);
        return null;
    }
}

/**
 * Playlist URL'sinden şarkıları al
 * @param {string} url - YouTube playlist URL
 * @returns {Promise<object[]>}
 */
async function getPlaylist(url) {
    try {
        const result = execSync(
            `yt-dlp --flat-playlist --print-json --skip-download "${url}"`,
            {
                encoding: 'utf-8',
                timeout: 60000,
                maxBuffer: 50 * 1024 * 1024,
            }
        );

        const songs = result
            .trim()
            .split('\n')
            .filter(line => line.trim())
            .map(line => {
                const info = JSON.parse(line);
                return {
                    title: info.title || 'Bilinmeyen Şarkı',
                    url: info.url 
                        ? (info.url.startsWith('http') ? info.url : `https://www.youtube.com/watch?v=${info.url}`)
                        : (info.webpage_url || info.original_url),
                    duration: formatDuration(info.duration),
                    thumbnail: info.thumbnail || info.thumbnails?.[0]?.url || null,
                    durationSeconds: info.duration || 0,
                };
            });

        return songs;
    } catch (error) {
        console.error('[Playlist Error]', error.message);
        return [];
    }
}

/**
 * Saniye cinsinden süreyi MM:SS formatına çevir
 * @param {number} seconds
 * @returns {string}
 */
function formatDuration(seconds) {
    if (!seconds || isNaN(seconds)) return 'Canlı/Bilinmiyor';

    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hrs > 0) {
        return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

module.exports = { searchSong, getPlaylist, formatDuration };

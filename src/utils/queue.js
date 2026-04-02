/**
 * Sunucu başına müzik kuyruğu yönetimi
 */
class MusicQueue {
    constructor() {
        /** @type {Map<string, QueueData>} */
        this.queues = new Map();
    }

    /**
     * Sunucu için kuyruk oluştur veya mevcut olanı getir
     * @param {string} guildId
     * @returns {QueueData}
     */
    get(guildId) {
        if (!this.queues.has(guildId)) {
            this.queues.set(guildId, {
                songs: [],
                currentIndex: 0,
                volume: 50,
                loop: 'off', // off, track, queue
                playing: false,
                connection: null,
                player: null,
                textChannel: null,
                voiceChannel: null,
            });
        }
        return this.queues.get(guildId);
    }

    /**
     * Sunucu kuyruğunu sil
     * @param {string} guildId
     */
    delete(guildId) {
        const queue = this.queues.get(guildId);
        if (queue) {
            if (queue.connection) {
                queue.connection.destroy();
            }
            this.queues.delete(guildId);
        }
    }

    /**
     * Sunucu kuyruğu var mı kontrol et
     * @param {string} guildId
     * @returns {boolean}
     */
    has(guildId) {
        return this.queues.has(guildId);
    }
}

module.exports = new MusicQueue();

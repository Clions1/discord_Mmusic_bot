require('dotenv').config();

const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Discord client oluştur
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
    ],
});

// Komutları yükle
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        console.log(`✅ Komut yüklendi: /${command.data.name}`);
    }
}

// Etkileşim (Interaction) Handler
client.on('interactionCreate', async (interaction) => {
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) {
            console.warn(`⚠️  Bilinmeyen komut: ${interaction.commandName}`);
            return;
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(`❌ Komut hatası [/${interaction.commandName}]:`, error);

            const errorMessage = '❌ Komut çalıştırılırken bir hata oluştu!';
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: errorMessage, ephemeral: true }).catch(() => {});
            } else {
                await interaction.reply({ content: errorMessage, ephemeral: true }).catch(() => {});
            }
        }
    } else if (interaction.isButton()) {
        const customId = interaction.customId;
        if (!customId.startsWith('music_')) return;

        const queue = require('./utils/queue');
        const serverQueue = queue.get(interaction.guildId);

        if (!serverQueue.songs.length) {
            return interaction.reply({ content: '❌ Kuyrukta şarkı yok!', ephemeral: true });
        }

        const voiceChannel = interaction.member.voice.channel;
        if (!voiceChannel || voiceChannel.id !== serverQueue.voiceChannel?.id) {
            return interaction.reply({ content: '❌ Botla aynı ses kanalında olmalısın!', ephemeral: true });
        }

        const { AudioPlayerStatus } = require('@discordjs/voice');
        const { buildNowPlayingEmbed, buildPlayerButtons, buildQueueEmbed } = require('./utils/embeds');

        try {
            if (customId === 'music_pause') {
                if (serverQueue.player.state.status === AudioPlayerStatus.Paused) {
                    serverQueue.player.unpause();
                } else {
                    serverQueue.player.pause();
                }
                const embed = buildNowPlayingEmbed(serverQueue.songs[serverQueue.currentIndex], serverQueue);
                const components = buildPlayerButtons(serverQueue);
                await interaction.update({ embeds: [embed], components });
            } else if (customId === 'music_skip') {
                serverQueue.player.stop();
                await interaction.deferUpdate();
            } else if (customId === 'music_previous') {
                if (serverQueue.currentIndex > 0) {
                    serverQueue.currentIndex -= 2; 
                    serverQueue.player.stop();
                    await interaction.deferUpdate();
                } else {
                    await interaction.reply({ content: '❌ Daha önce çalınan şarkı yok!', ephemeral: true });
                }
            } else if (customId === 'music_stop') {
                queue.delete(interaction.guildId);
                await interaction.update({ components: [] }); 
                await interaction.followUp({ content: '⏹️ Müzik durduruldu.', ephemeral: false });
            } else if (customId === 'music_shuffle') {
                if (serverQueue.songs.length >= 3) {
                    const currentSong = serverQueue.songs[serverQueue.currentIndex];
                    const otherSongs = serverQueue.songs.filter((_, i) => i !== serverQueue.currentIndex);
                    for (let i = otherSongs.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [otherSongs[i], otherSongs[j]] = [otherSongs[j], otherSongs[i]];
                    }
                    serverQueue.songs = [currentSong, ...otherSongs];
                    serverQueue.currentIndex = 0;
                    
                    const embed = buildNowPlayingEmbed(serverQueue.songs[serverQueue.currentIndex], serverQueue);
                    const components = buildPlayerButtons(serverQueue);
                    await interaction.update({ embeds: [embed], components });
                    await interaction.followUp({ content: '🔀 Kuyruk karıştırıldı.', ephemeral: true });
                } else {
                    await interaction.reply({ content: '❌ Karıştırmak için en az 3 şarkı lazım!', ephemeral: true });
                }
            } else if (customId === 'music_loop') {
                if (serverQueue.loop === 'off') serverQueue.loop = 'track';
                else if (serverQueue.loop === 'track') serverQueue.loop = 'queue';
                else serverQueue.loop = 'off';
                
                const embed = buildNowPlayingEmbed(serverQueue.songs[serverQueue.currentIndex], serverQueue);
                const components = buildPlayerButtons(serverQueue);
                await interaction.update({ embeds: [embed], components });
            } else if (customId === 'music_voldown') {
                serverQueue.volume = Math.max(0, serverQueue.volume - 10);
                if (serverQueue.player?.state?.resource?.volume) {
                    serverQueue.player.state.resource.volume.setVolume(serverQueue.volume / 100);
                }
                const embed = buildNowPlayingEmbed(serverQueue.songs[serverQueue.currentIndex], serverQueue);
                const components = buildPlayerButtons(serverQueue);
                await interaction.update({ embeds: [embed], components });
            } else if (customId === 'music_volup') {
                serverQueue.volume = Math.min(150, serverQueue.volume + 10);
                if (serverQueue.player?.state?.resource?.volume) {
                    serverQueue.player.state.resource.volume.setVolume(serverQueue.volume / 100);
                }
                const embed = buildNowPlayingEmbed(serverQueue.songs[serverQueue.currentIndex], serverQueue);
                const components = buildPlayerButtons(serverQueue);
                await interaction.update({ embeds: [embed], components });
            } else if (customId === 'music_queue') {
                await interaction.reply({ embeds: [buildQueueEmbed(serverQueue.songs, serverQueue.currentIndex)], ephemeral: true });
            }
        } catch (error) {
            console.error('Buton hatası:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: '❌ İşlem sırasında hata oluştu.', ephemeral: true });
            }
        }
    }
});

// Bot hazır
client.once('ready', () => {
    console.log('');
    console.log('╔══════════════════════════════════════════╗');
    console.log('║      🎵 Discord Müzik Botu Aktif!       ║');
    console.log('╠══════════════════════════════════════════╣');
    console.log(`║  Bot: ${client.user.tag.padEnd(33)}║`);
    console.log(`║  Sunucu: ${client.guilds.cache.size.toString().padEnd(30)}║`);
    console.log(`║  Komut: ${client.commands.size.toString().padEnd(31)}║`);
    console.log('╚══════════════════════════════════════════╝');
    console.log('');
});

// Hata yakalama
client.on('error', (error) => {
    console.error('❌ Client hatası:', error);
});

process.on('unhandledRejection', (error) => {
    console.error('❌ Yakalanmamış hata:', error);
});

// Botu başlat
client.login(process.env.DISCORD_TOKEN);

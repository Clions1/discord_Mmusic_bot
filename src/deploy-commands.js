/**
 * Slash komutlarını Discord API'ye kaydet
 * Bu scripti bir kez çalıştırman yeterli: node src/deploy-commands.js
 */
require('dotenv').config();

const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    if ('data' in command && 'execute' in command) {
        commands.push(command.data.toJSON());
        console.log(`✅ Komut yüklendi: /${command.data.name}`);
    }
}

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log(`\n🔄 ${commands.length} komut Discord'a kaydediliyor...`);

        // Global komutlar (tüm sunucularda çalışır, ~1 saat sürebilir)
        const data = await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands },
        );

        console.log(`\n✅ ${data.length} komut başarıyla kaydedildi!`);
        console.log('⚠️  Global komutların aktif olması 1 saate kadar sürebilir.');
        console.log('💡 Hemen test etmek için sunucu ID ile guild komutları kullanabilirsin.\n');

    } catch (error) {
        console.error('❌ Komutlar kaydedilirken hata:', error);
    }
})();

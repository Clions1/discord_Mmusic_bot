# 🎵 Discord Müzik Botu

YouTube'dan müzik çalan Discord botu. **yt-dlp** kullanarak YouTube'dan audio stream yapar.

## 📋 Gereksinimler

### Ubuntu VPS'te Kurulum

```bash
# Node.js 18+ kur
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# FFmpeg kur (ses işleme için gerekli)
sudo apt-get install -y ffmpeg

# yt-dlp kur
sudo apt-get install -y python3
sudo curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
sudo chmod a+rx /usr/local/bin/yt-dlp

# Build araçları (native modüller için)
sudo apt-get install -y build-essential python3
```

## 🚀 Kurulum

### 1. Projeyi VPS'e Kopyala

```bash
# Git ile veya scp ile dosyaları VPS'e kopyala
scp -r ./discord_bot user@vps-ip:/home/user/discord_bot
```

### 2. Bağımlılıkları Yükle

```bash
cd discord_bot
npm install
```

### 3. `.env` Dosyasını Düzenle

```bash
nano .env
```

```env
# Discord Developer Portal'dan al → https://discord.com/developers/applications
DISCORD_TOKEN=YOUR_DISCORD_BOT_TOKEN_HERE
CLIENT_ID=YOUR_CLIENT_ID_HERE
```

### 4. Slash Komutlarını Kaydet

```bash
npm run deploy
```

### 5. Botu Başlat

```bash
npm start
```

## 🔧 PM2 ile Arka Planda Çalıştırma (Önerilen)

```bash
# PM2 kur
sudo npm install -g pm2

# Botu PM2 ile başlat
pm2 start src/index.js --name "muzik-bot"

# Otomatik başlatma (VPS restart olunca)
pm2 startup
pm2 save

# Logları izle
pm2 logs muzik-bot

# Botu yeniden başlat
pm2 restart muzik-bot

# Botu durdur
pm2 stop muzik-bot
```

## 🎶 Komutlar

| Komut | Açıklama |
|-------|----------|
| `/play <sorgu>` | Şarkı adı veya YouTube URL'si ile müzik çal |
| `/pause` | Duraklat / Devam ettir |
| `/skip` | Şarkıyı atla |
| `/stop` | Müziği durdur ve kanaldan ayrıl |
| `/queue [sayfa]` | Müzik kuyruğunu göster |
| `/nowplaying` | Şu an çalan şarkıyı göster |
| `/volume <0-150>` | Ses seviyesini ayarla |
| `/loop <mod>` | Döngü: Kapalı / Şarkı Tekrar / Kuyruk Tekrar |
| `/shuffle` | Kuyruğu karıştır |
| `/jump <numara>` | Belirli bir şarkıya atla |
| `/remove <numara>` | Şarkıyı kuyruktan kaldır |
| `/clear` | Kuyruğu temizle |
| `/help` | Tüm komutları göster |

## 🤖 Discord Bot Oluşturma

1. [Discord Developer Portal](https://discord.com/developers/applications) adresine git
2. **New Application** → İsim ver → Oluştur
3. **Bot** sekmesine git → **Reset Token** → Token'ı kopyala
4. **OAuth2** → **URL Generator**:
   - **Scopes**: `bot`, `applications.commands`
   - **Bot Permissions**: `Connect`, `Speak`, `Send Messages`, `Embed Links`
5. Oluşan URL ile botu sunucuna ekle
6. Token'ı `.env` dosyasına yapıştır

## 📁 Proje Yapısı

```
discord_bot/
├── .env                    # Bot token ve ayarlar
├── .gitignore
├── package.json
├── README.md
└── src/
    ├── index.js            # Ana bot dosyası
    ├── deploy-commands.js  # Slash komut kayıt scripti
    ├── commands/
    │   ├── play.js         # Şarkı çal
    │   ├── skip.js         # Atla
    │   ├── stop.js         # Durdur
    │   ├── pause.js        # Duraklat
    │   ├── queue.js        # Kuyruk göster
    │   ├── nowplaying.js   # Şu an çalan
    │   ├── volume.js       # Ses ayarı
    │   ├── loop.js         # Döngü
    │   ├── shuffle.js      # Karıştır
    │   ├── jump.js         # Şarkıya atla
    │   ├── remove.js       # Kaldır
    │   ├── clear.js        # Kuyruğu temizle
    │   └── help.js         # Yardım
    └── utils/
        ├── queue.js        # Kuyruk yönetimi
        ├── player.js       # Ses oynatıcı
        ├── search.js       # YouTube arama (yt-dlp)
        └── embeds.js       # Discord embed'leri
```

## ⚠️ Sorun Giderme

- **Bot ses kanalına girmiyor?** → Bot izinlerini kontrol et (Connect, Speak)
- **Şarkı çalmıyor?** → `ffmpeg` ve `yt-dlp` kurulu mu kontrol et: `ffmpeg -version` ve `yt-dlp --version`
- **Komutlar gözükmüyor?** → `npm run deploy` çalıştır, global komutlar ~1 saat sürebilir
- **Opus hatası?** → `sudo apt-get install -y build-essential` ardından `npm rebuild`

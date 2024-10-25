require('dotenv').config();
const { Client } = require('discord.js-selfbot-v13');
const { joinVoiceChannel, VoiceConnectionStatus } = require('@discordjs/voice');
const http = require('http');

const selfbotToken = process.env.SELF_BOT_TOKEN;
const channelId = process.env.AFK_CHANNEL_ID;
const port = process.env.PORT || 3000;

const selfbot = new Client();

selfbot.once('ready', async () => {
    console.log('Self-bot hazır!');
    await joinChannel();
});

// Ses kanalına bağlanma fonksiyonu
async function joinChannel() {
    const guild = selfbot.guilds.cache.find(g => g.channels.cache.has(channelId));
    if (!guild) {
        console.log('Sunucu bulunamadı.');
        return;
    }

    const channel = guild.channels.cache.get(channelId);

    if (!channel) {
        console.log('Kanal bulunamadı.');
        return;
    }

    if (channel.type === 'GUILD_VOICE') {
        try {
            const connection = joinVoiceChannel({
                channelId: channel.id,
                guildId: guild.id,
                adapterCreator: guild.voiceAdapterCreator,
                selfDeaf: false,
                selfMute: false,
            });

            connection.on(VoiceConnectionStatus.Disconnected, async () => {
                console.log("Bağlantı koptu, yeniden bağlanılıyor...");
                await joinChannel();
            });

            console.log(`Ses kanalına bağlanıldı: ${channel.name}`);
        } catch (error) {
            console.error('Ses kanalına bağlanırken hata oluştu:', error);
        }
    } else {
        console.log('Belirtilen kanal bir ses kanalı değil.');
    }
}

// Basit bir HTTP sunucusu
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Self-bot çalışıyor\n');
}).listen(port, () => {
    console.log(`Sunucu ${port} portunda çalışıyor`);
});

selfbot.login(selfbotToken).catch(console.error);

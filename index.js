const { Client } = require('discord.js-selfbot-v13');
const { joinVoiceChannel, getVoiceConnection, VoiceConnectionStatus } = require("@discordjs/voice");
const dotenv = require('dotenv');
const http = require('http');

// .env dosyasındaki değişkenleri yükle
dotenv.config();

const client = new Client({ checkUpdate: false });

const config = {
    Token: process.env.TOKEN,
    Guild: process.env.GUILD_ID,
    Channel: process.env.CHANNEL_ID,
    Port: process.env.PORT
};

// Sesli kanala bağlanma fonksiyonu
async function joinVC(channelId) {
    const guild = client.guilds.cache.get(config.Guild);
    const voiceChannel = guild.channels.cache.get(channelId);
    if (!voiceChannel) return console.log("Ses kanalı bulunamadı!");
    
    const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: guild.id,
        adapterCreator: guild.voiceAdapterCreator,
        selfDeaf: false,
        selfMute: false
    });

    connection.on(VoiceConnectionStatus.Disconnected, async () => {
        console.log("Bağlantı koptu, yeniden bağlanılıyor...");
        await joinVC(channelId); // Bağlantı koparsa yeniden bağlan
    });

    console.log(`Ses kanalına bağlandı: ${voiceChannel.name}`);
}

// Bot hazır olduğunda çalışacak fonksiyon
client.on('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);
    await joinVC(config.Channel); // Varsayılan kanala bağlan
});

// Komutlar için mesaj olayını dinle
client.on('messageCreate', async (message) => {
    if (message.author.id !== client.user.id) return;

    // !sesgir komutu
    if (message.content.startsWith('!sesgir')) {
        const args = message.content.split(' ');
        const channelId = args[1];

        if (!channelId || isNaN(channelId)) {
            return message.reply("Doğru bir ses kanalı ID'si belirtmelisiniz! Örnek: `!sesgir 123456789012345678`");
        }

        await joinVC(channelId);
    }

    // !sescik komutu
    if (message.content === '!sescik') {
        const connection = getVoiceConnection(config.Guild);
        if (connection) {
            connection.destroy();
            console.log("Ses kanalından çıkıldı.");
        } else {
            message.reply("Bot zaten ses kanalında değil!");
        }
    }
});

// Bot sesten düşerse tekrar girme
client.on('voiceStateUpdate', async (oldState, newState) => {
    const oldVoice = oldState.channelId;
    const newVoice = newState.channelId;

    if (oldVoice !== newVoice) {
        if (!oldVoice) {
            // Yeni bir ses kanalına katıldı
        } else if (!newVoice) {
            // Ses kanalından atıldığında
            if (oldState.member.id === client.user.id) {
                console.log("Bot ses kanalından atıldı, yeniden bağlanılıyor...");
                await joinVC(oldVoice); // Son bulunduğu kanala geri bağlan
            }
        } else {
            // Ses kanalından başka bir kanala geçildi
            if (oldState.member.id === client.user.id) {
                console.log(`Bot ses kanalını değiştiriyor: ${newVoice}`);
                await joinVC(newVoice); // Yeni ses kanalına bağlan
            }
        }
    }
});

// Hata mesajlarını belirli bir kanala gönder
client.on('error', (error) => {
    const errorChannel = client.channels.cache.get('1298603518479044680'); // Hata kanalının ID'sini buraya yaz
    if (errorChannel) {
        errorChannel.send(`Bir hata oluştu: ${error.message}`);
    }
    console.error('Hata:', error);
});

client.login(config.Token);

// Basit bir HTTP sunucusu
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.write('Bot is running');
    res.end();
}).listen(config.Port, () => {
    console.log(`Server is running on port ${config.Port}`);
});

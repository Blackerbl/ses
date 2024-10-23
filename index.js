const { Client } = require('discord.js-selfbot-v13');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, getVoiceConnection, VoiceConnectionStatus, AudioPlayerStatus } = require("@discordjs/voice");
const dotenv = require('dotenv');
const http = require('http');
const fs = require('fs');
const path = require('path');

// .env dosyasındaki değişkenleri yükle
dotenv.config();

const client = new Client({ checkUpdate: false });

const config = {
    Token: process.env.TOKEN,
    Guild: process.env.GUILD_ID,
    Port: process.env.PORT
};

// Ses dosyası çalma fonksiyonu
async function playSound(connection) {
    const player = createAudioPlayer();
    const filePath = path.join(__dirname, 'sound.mp3'); // Çalmak istediğin ses dosyası
    const resource = createAudioResource(fs.createReadStream(filePath));

    player.play(resource);
    connection.subscribe(player);

    player.on(AudioPlayerStatus.Idle, () => {
        console.log("Ses bitti.");
    });

    console.log("Ses çalınıyor...");
}

// Belirli bir aralıkla ses çalma fonksiyonu
async function scheduleSoundPlay(connection, interval) {
    setInterval(async () => {
        if (connection.state.status === VoiceConnectionStatus.Ready) {
            await playSound(connection);
        }
    }, interval); // Interval, milisaniye cinsindendir, 60000 = 1 dakika
}

// Sesli kanala bağlanma fonksiyonu
async function joinVC(client, channelId) {
    const guild = client.guilds.cache.get(config.Guild);
    const voiceChannel = guild.channels.cache.get(channelId);
    if (!voiceChannel) return console.log("Ses kanalı bulunamadı!");
    
    const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: guild.id,
        adapterCreator: guild.voiceAdapterCreator,
        selfDeaf: false,
        selfMute: true
    });

    connection.on(VoiceConnectionStatus.Disconnected, async () => {
        console.log("Bağlantı koptu, yeniden bağlanılıyor...");
        await joinVC(client, channelId); // Bağlantı koparsa yeniden bağlan
    });

    // Belirli aralıklarla ses çal (örnek: her 1 dakikada bir 60 * 1000 = 60000 ms)
    scheduleSoundPlay(connection, 600000);
    
    console.log(`Ses kanalına bağlandı: ${voiceChannel.name}`);
}

client.on('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);
    // Botun ilk bağlanacağı kanal .env dosyasındaki varsayılan kanal olmayacak
    console.log("Bot hazır!");
});

// Komutlar için mesaj olayını dinle
client.on('messageCreate', async (message) => {
    if (message.author.id !== client.user.id) return; // Komutlar sadece kendin için çalışır

    // !sesgir komutu
    if (message.content.startsWith('!sesgir')) {
        const args = message.content.split(' ');
        const channelMention = args[1];

        if (!channelMention || !channelMention.startsWith('<#') || !channelMention.endsWith('>')) {
            return message.reply("Doğru bir ses kanalı ID'si belirtmelisiniz! Örnek: `!sesgir #kanalid`");
        }

        const channelId = channelMention.slice(2, -1);
        await joinVC(client, channelId); // Kullanıcıdan alınan kanal ID ile bağlan
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

client.on('voiceStateUpdate', async (oldState, newState) => {
    const oldVoice = oldState.channelId;
    const newVoice = newState.channelId;

    if (oldVoice !== newVoice) {
        if (!oldVoice) {
            // Boş
        } else if (!newVoice) {
            if (oldState.member.id !== client.user.id) return;
            await joinVC(client, newState.channelId); // Çıkarsa son bulunduğu kanala geri bağlan
        }
    }
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

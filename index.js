const { Client } = require('discord.js-selfbot-v13');
const { joinVoiceChannel } = require("@discordjs/voice");
const dotenv = require('dotenv');
const http = require('http');

// .env dosyasındaki değişkenleri yükle
dotenv.config();

const client = new Client({ checkUpdate: false });

// .env dosyasındaki değerleri kullan
const config = {
    Token: process.env.TOKEN,
    Guild: process.env.GUILD_ID,
    Channel: process.env.CHANNEL_ID,
    Port: process.env.PORT
};

client.on('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);

    await joinVC(client, config);
});

client.on('voiceStateUpdate', async (oldState, newState) => {
    const oldVoice = oldState.channelId;
    const newVoice = newState.channelId;

    if (oldVoice !== newVoice) {
        if (!oldVoice) {
            // empty
        } else if (!newVoice) {
            if (oldState.member.id !== client.user.id) return;
            await joinVC(client, config);
        } else {
            if (oldState.member.id !== client.user.id) return;
            if (newVoice !== config.Channel) {
                await joinVC(client, config);
            }
        }
    }
});
client.login(config.Token);

// Voice Channel'a katılma fonksiyonu
async function joinVC(client, config) {
    const guild = client.guilds.cache.get(config.Guild);
    const voiceChannel = guild.channels.cache.get(config.Channel);
    const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: guild.id,
        adapterCreator: guild.voiceAdapterCreator,
        selfDeaf: false,
        selfMute: true
    });
}

// Basit bir HTTP sunucusu
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.write('Bot is running');
    res.end();
}).listen(config.Port, () => {
    console.log(`Server is running on port ${config.Port}`);
});

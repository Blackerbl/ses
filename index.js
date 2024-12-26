const { Client } = require('discord.js-selfbot-v13');
const { joinVoiceChannel } = require('@discordjs/voice');

require('dotenv').config(); // .env dosyasını yüklemek için

// Client'ı başlatıyoruz
const client = new Client({ checkUpdate: false });

// Değişkenleri .env dosyasından alıyoruz
const token = process.env.TOKEN;
const guildID = process.env.GUILD_ID;
const channelID = process.env.CHANNEL_ID;

client.on('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);
    
    await joinVC(client, token, guildID, channelID); // Ses kanalına bağlan
});

client.on('voiceStateUpdate', async (oldState, newState) => {
    const oldVoice = oldState.channelId;
    const newVoice = newState.channelId;

    if (oldVoice !== newVoice) {
        if (!oldVoice) {
            // eski ses kanalından çıkmışsa
        } else if (!newVoice) {
            if (oldState.member.id !== client.user.id) return;
            await joinVC(client, token, guildID, channelID); // Ses kanalına yeniden bağlan
        } else {
            if (oldState.member.id !== client.user.id) return;
            if (newVoice !== channelID) {
                await joinVC(client, token, guildID, channelID); // Hedef ses kanalına bağlan
            }
        }
    }
});

// Ses kanalına bağlanma fonksiyonu
async function joinVC(client, token, guildID, channelID) {
    const guild = client.guilds.cache.get(guildID);
    const voiceChannel = guild.channels.cache.get(channelID);

    if (!voiceChannel || !voiceChannel.isVoice()) {
        console.log('Geçerli bir ses kanalı bulunamadı!');
        return;
    }

    const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: guild.id,
        adapterCreator: guild.voiceAdapterCreator,
        selfDeaf: false,
        selfMute: true
    });

    console.log('Ses kanalına bağlanıldı!');
}

client.login(token);

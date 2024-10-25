require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { exec } = require('child_process');

const mainBotToken = process.env.MAIN_BOT_TOKEN;
const userId = process.env.USER_ID;
const afkChannelId = process.env.AFK_CHANNEL_ID;
const channelIds = process.env.CHANNEL_IDS.split(',');

const mainBot = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] });

mainBot.once('ready', () => {
    console.log('Ana bot hazır!');
    setInterval(checkUserVoiceState, 5000);
});

async function checkUserVoiceState() {
    const guild = mainBot.guilds.cache.first();
    const member = await guild.members.fetch(userId);

    if (!member.voice.channel) {
        console.log('Kullanıcı ses kanalında değil, self-botu başlatılıyor...');
        startSelfBot();
    } else {
        console.log(`Kullanıcı şu an ses kanalında: ${member.voice.channel.name}`);
    }
}

function startSelfBot() {
    exec(`node selfbot.js ${userId} ${channelIds.join(' ')}`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Self-bot çalıştırılırken hata oluştu: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`Self-bot hatası: ${stderr}`);
            return;
        }
        console.log(`Self-bot çıktısı: ${stdout}`);
    });
}

mainBot.login(mainBotToken);

const { Client, RichPresence } = require('discord.js-selfbot-v13');
const figlet = require('figlet');

const CONFIG = {
    TOKEN: process.env.TOKEN,
    PREFIX: '.',
    BUTTONS: {
        gunslol: 'https://guns.lol/younginfinito',
        h3d: 'https://discord.gg/Exn9jPK8na'
    },
    STATUS_MESSAGES: [
        '???',
        '.gg/Exn9jPK8na',
        'heil h3d',
        '#h3d on top',
        'best spam bot',
        '$$$',
    ],
    CHANGE_INTERVAL: 5000,
    AUTO_REACT_EMOJI: ' ',
    LARGE_IMAGE: ' ',
    EIGHTBALL_RESPONSES: [
        "yes", "no", "maybe", "definitely", "ask me later", "don't count on it", "probably yes", "probably not", "i have no idea", "of course", "not a chance", "sure", "i doubt it", "obviously", "never", "could be"
    ]
};

const client = new Client();
let currentStatusIndex = 0;
let lastDeletedMessage = {};

function setRichPresence(customText = null) {
    const currentStatus = customText ? customText : CONFIG.STATUS_MESSAGES[currentStatusIndex];
    try {
        const rpc = new RichPresence(client)
            .setApplicationId('')
            .setType('STREAMING')
            .setURL('https://twitch.tv/x0202s')
            .setName('nxg is here')
            .setDetails(currentStatus)
            .setState('active')
            .setStartTimestamp(Date.now())
            .addButton('gunslol', CONFIG.BUTTONS.gunslol)
            .addButton('nxg', CONFIG.BUTTONS.h3d);

        if (CONFIG.LARGE_IMAGE) rpc.setAssetsLargeImage(CONFIG.LARGE_IMAGE);

        client.user.setPresence({
            activities: [rpc],
            status: 'dnd'
        });

        console.log(`status updated: ${currentStatus}`);
    } catch (error) {
        console.error('error:', error.message);
    }
    if (!customText) {
        currentStatusIndex = (currentStatusIndex + 1) % CONFIG.STATUS_MESSAGES.length;
    }
}

client.on('ready', async () => {
    console.log(`self: ${client.user.tag}`);

    setTimeout(() => {
        setRichPresence();
        console.log('rich presence on');
        setInterval(() => {
            setRichPresence();
        }, CONFIG.CHANGE_INTERVAL);
    }, 2000);
});

client.on('messageDelete', async (message) => {
    if (message.partial) return;
    lastDeletedMessage[message.channel.id] = {
        content: message.content,
        author: message.author ? message.author.tag : "unknown",
        avatar: message.author ? message.author.displayAvatarURL() : null,
        timestamp: message.createdTimestamp
    };
});

client.on('messageCreate', async (message) => {
    if (message.author.id === client.user.id) {
        try {
            await message.react(CONFIG.AUTO_REACT_EMOJI);
        } catch (err) {}
    }

    if (message.author.id !== client.user.id) return;
    if (!message.content.startsWith(CONFIG.PREFIX)) return;

    const args = message.content.slice(CONFIG.PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === 'ping') {
        const ping = Math.round(client.ws.ping);
        message.reply(`pong ${ping}ms`);
    }

    if (command === 'userinfo') {
        const user = client.user;
        message.reply(
            `id: ${user.id}\ntag: ${user.tag}\ncreated: <t:${Math.floor(user.createdTimestamp / 1000)}:R>`
        );
    }

    if (command === 'serverinfo') {
        if (!message.guild) {
            message.reply('you can use this only in servers');
            return;
        }
        const guild = message.guild;
        message.reply(
            `id: ${guild.id}\nmembers: ${guild.memberCount}\ncreated: <t:${Math.floor(guild.createdTimestamp / 1000)}:R>`
        );
    }

    if (command === 'purge') {
        const amount = parseInt(args[0]);
        if (!amount || isNaN(amount) || amount < 1 || amount > 100) {
            message.reply('you must enter a number of messages to delete (1-100)');
            return;
        }
        try {
            const messages = await message.channel.messages.fetch({ limit: 100 });
            const myMessages = messages.filter(m => m.author.id === client.user.id).first(amount);
            for (let msg of myMessages) {
                await msg.delete();
            }
            message.channel.send(`${myMessages.length} messages deleted`).then(m => setTimeout(() => m.delete(), 3000));
        } catch (err) {
            message.reply('an error occurred while trying to delete your messages');
        }
    }

    if (command === 'setstatus') {
        const statusText = args.join(' ');
        if (!statusText) {
            message.reply('you must write a status text');
            return;
        }
        setRichPresence(statusText);
        message.reply(`status changed to: ${statusText}`);
    }

    if (command === 'coinflip') {
        const result = Math.random() < 0.5 ? "heads" : "tails";
        message.reply(`the coin landed on: ${result}`);
    }

    if (command === '8ball') {
        if (args.length === 0) {
            message.reply('you must ask a question');
        } else {
            const response = CONFIG.EIGHTBALL_RESPONSES[Math.floor(Math.random() * CONFIG.EIGHTBALL_RESPONSES.length)];
            message.reply(`${response}`);
        }
    }

    if (command === 'roll') {
        let max = parseInt(args[0]);
        if (!max || isNaN(max) || max < 1) max = 6;
        const result = Math.floor(Math.random() * max) + 1;
        message.reply(`result: ${result} (1-${max})`);
    }

    if (command === 'spam') {
        const amount = parseInt(args[args.length - 1]);
        const spamMsg = args.slice(0, -1).join(' ');
        if (!spamMsg || isNaN(amount) || amount < 1 || amount > 15) {
            message.reply('usage: .spam <message> <amount> (maximum 15 messages)');
            return;
        }
        for (let i = 0; i < amount; i++) {
            await message.channel.send(spamMsg);
            await new Promise(r => setTimeout(r, 400));
        }
    }

    if (command === 'snipe') {
        const sniped = lastDeletedMessage[message.channel.id];
        if (!sniped) {
            message.reply("no recently deleted messages in this channel");
            return;
        }
        message.reply(
            sniped.content ? sniped.content : "*empty message or embed*"
        );
    }

    if (command === 'ascii') {
        const asciiText = args.join(' ');
        if (!asciiText) {
            message.reply('you must write the text to convert');
            return;
        }
        figlet(asciiText, (err, data) => {
            if (err || !data) {
                message.reply('an error occurred generating the ascii art');
            } else {
                if (data.length > 1990) {
                    data = data.slice(0, 1990);
                }
                message.reply(`\`\`\`\n${data}\n\`\`\``);
            }
        });
    }

    if (command === 'uwu') {
        const uwuText = args.join(' ');
        if (!uwuText) {
            message.reply('you must write the text to convert');
            return;
        }
        const uwu = uwuText
            .replace(/(?:r|l)/g, 'w')
            .replace(/(?:R|L)/g, 'W')
            .replace(/n([aeiou])/g, 'ny$1')
            .replace(/N([aeiou])/g, 'Ny$1')
            .replace(/N([AEIOU])/g, 'NY$1')
            .replace(/ove/g, 'uv')
            .replace(/!+/g, ' owo!')
            .concat(' uwu');
        message.reply(uwu);
    }

    if (command === 'reverse') {
        const txt = args.join(' ');
        if (!txt) return message.reply('you must write the text to reverse');
        const reversed = txt.split('').reverse().join('');
        message.reply(reversed);
    }

    if (command === 'spoiler') {
        const txt = args.join(' ');
        if (!txt) return message.reply('you must write the text to put in spoiler');
        const spoilered = txt.split('').map(c => c === ' ' ? ' ' : `||${c}||`).join('');
        message.reply(spoilered);
    }

    if (command === 'hack') {
        let user = message.mentions.users.first() || client.user;
        let username = user ? user.username : args[0] || 'user';
        message.reply(`starting hack on ${username}...`);
        setTimeout(() => message.channel.send(`getting token of ${username}...`), 1500);
        setTimeout(() => message.channel.send(`accessing database...`), 3000);
        setTimeout(() => message.channel.send(`sending webhooks...`), 5000);
        setTimeout(() => message.channel.send(`hack on ${username} completed`), 7000);
    }

    if (command === 'help') {
        message.reply(
            '**available commands:**\n' +
            '`.ping` - shows the self ping\n' +
            '`.userinfo` - shows your user info\n' +
            '`.serverinfo` - shows server info\n' +
            '`.purge <amount>` - deletes your last x messages (1-100)\n' +
            '`.bio <text>` - changes your discord bio\n' +
            '`.setstatus <text>` - changes your custom status\n' +
            '`.coinflip` - flips a coin\n' +
            '`.8ball <question>` - magic 8ball answers\n' +
            '`.roll <max>` - rolls a dice (default 6)\n' +
            '`.spam <message> <amount>` - sends repeated messages (max 15)\n' +
            '`.snipe` - shows the last deleted message in the channel\n' +
            '`.ascii <text>` - converts text to ascii art\n' +
            '`.uwu <text>` - converts text to uwu format\n' +
            '`.reverse <text>` - reverses text\n' +
            '`.spoiler <text>` - sends text as spoiler letter by letter\n' +
            '`.hack [@user]` - fake hack a user\n' +
            '`.help` - shows this message'
        );
    }
});

client.on('error', (error) => {
    console.error('client error:', error);
});

console.log('starting self... (by pansi)');
client.login(CONFIG.TOKEN).catch(error => {
    console.error('login error:', error);
    console.log('check if your token is correct');
});

process.on('SIGINT', () => {
    console.log('\nshutting down self...');
    client.destroy();
    process.exit(0);
});

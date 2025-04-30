require("dotenv/config");

const { Client } = require('discord.js');
const { OpenAI } = require('openai');
const client = new Client({
    intents: ['Guilds', 'GuildMembers', 'GuildMessages', 'MessageContent']
});
const openai = new OpenAI({
    apiKey: process.env.OPENAI_KEY,
});


client.on('ready', () => {
    console.log('Skyebot reporting for duty!');
});

const IGNORE_PREFIX = '!';
const CHANNELS = [813769958982942760]; // This is where you put the discord channel id you want it to be active in. If you use developer mode you can right click a channel
// And copy the channel id

client.on('messageCreate', async (message) => { // so this is basically a logger wonder if we can make a class just for this. I also want it to show a timestamp and the user.
    if (message.author.bot) return; // Stuff we want the message bot to ignore / not log
    if (message.content.startsWith(IGNORE_PREFIX)) return;
    if ((!CHANNELS.includes(message.channelId)) && !message.mentions.users.has(client.user.id)) 
        return;

    await message.channel.sendTyping();

    const sendTypingInterval = setInterval(() => {
        message.channel.sendTyping();
    }, 5000);

    let conversation = [];
    conversation.push({
        role: 'system',
        content: 'Chat GPT is a clever and mischievous chat bot.',
    });

    let previousMessages = await message.channel.messages.fetch({limit: 10});
    previousMessages.reverse();

    previousMessages.forEach((message) => {
        if (message.author.bot && message.author.id !== client.user.id) return;
        if (message.content.startsWith(IGNORE_PREFIX)) return;

        const usersName = message.author.username.replace(/\s+/g, '_').replace(/[^\w\s]/gi, '');

        if (message.author.id === client.user.id) {
            conversation.push({
                role: 'assistant',
                name: usersName,
                content: message.content,
            });

            return;
        }

        conversation.push({
            role: 'user',
            name: usersName,
            content: message.content,
        });
    })

    const response = await openai.chat.completions
        .create({
            model: 'gpt-4',
            messages: conversation,
        })
        .catch((error) => console.error('OpenAI Error:\n', error));
    
    clearInterval(sendTypingInterval);

    if (!response) {
        message.reply("My subroutines are taking longer than expected due to the novice who programmed me, please try again.");
        return;
    };

    const responseMessage = (response.choices[0].message.content);
    const MessageCharacterLimit = 2000;

    for (let i = 0; i<responseMessage.length; i+= MessageCharacterLimit) {
        const chunk = responseMessage.substring(i, i+MessageCharacterLimit);

        await message.reply(chunk);
    }
});

client.login(process.env.TOKEN);
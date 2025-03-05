const { Client, GatewayIntentBits } = require('discord.js'); // Use CommonJS require
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
require('dotenv').config();  // Use CommonJS require for dotenv

// Your bot token and client ID
const token = process.env.TOKEN;
const clientId = process.env.CLIENT_ID;

const client = new Client({
    intents: [GatewayIntentBits.Guilds], // Correct way to set intents in discord.js v14
});

const rest = new REST({ version: '9' }).setToken(token);

// When the bot is ready, clear commands
client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);

    // Clear global commands
    try {
        console.log('Clearing global commands...');
        await rest.put(Routes.applicationCommands(clientId), { body: [] });
        console.log('Successfully cleared global commands.');
    } catch (error) {
        console.error('Error clearing global commands:', error);
    }

    // Clear commands for each guild the bot is in
    try {
        const guilds = client.guilds.cache.map(guild => guild.id);
        for (const guildId of guilds) {
            console.log(`Clearing commands for guild ${guildId}...`);
            await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: [] });
            console.log(`Successfully cleared commands for guild ${guildId}.`);
        }
    } catch (error) {
        console.error('Error clearing guild commands:', error);
    }

    // Log out after clearing commands
    client.destroy();
});

// Log in to Discord using the bot's token
client.login(token);

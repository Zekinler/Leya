const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const token = process.argv[2];
const { QuickDB } = require('quick.db');
const db = new QuickDB();

const client = new Client({ intents: [
	GatewayIntentBits.Guilds,
	GatewayIntentBits.GuildMessages,
	GatewayIntentBits.MessageContent,
	GatewayIntentBits.GuildMembers,
] });

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = require(filePath);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args, db));
	}
	else {
		client.on(event.name, (...args) => event.execute(...args, db));
	}
}

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	if ('data' in command && 'execute' in command) {
		client.commands.set(command.data.name, command);
	}
	else {
		console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
	}
}

client.buttons = new Collection();

const buttonsPath = path.join(__dirname, 'buttons');
const buttonFiles = fs.readdirSync(buttonsPath).filter(file => file.endsWith('.js'));

for (const file of buttonFiles) {
	const filePath = path.join(buttonsPath, file);
	const button = require(filePath);
	if ('customId' in button && 'execute' in button) {
		client.buttons.set(button.customId, button);
	}
	else {
		console.log(`[WARNING] The command at ${filePath} is missing a required "customId" or "execute" property.`);
	}
}

client.login(token);
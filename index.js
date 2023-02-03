const read = require('fs-readdir-recursive');
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
const eventFiles = read(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = require(filePath);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args, db));
	}
	else {
		client.on(event.name, (...args) => event.execute(...args, db, client));
	}
}

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandsFiles = read(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandsFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	if ('data' in command && 'execute' in command) {
		client.commands.set(command.data.name, command);
	}
	else {
		console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
	}
}

client.contextMenuCommands = new Collection();

const contextMenuCommandsPath = path.join(__dirname, 'contextMenuCommands');
const contextMenuCommandsFiles = read(contextMenuCommandsPath).filter(file => file.endsWith('.js'));

for (const file of contextMenuCommandsFiles) {
	const filePath = path.join(contextMenuCommandsPath, file);
	const contextMenuCommand = require(filePath);
	if ('data' in contextMenuCommand && 'execute' in contextMenuCommand) {
		client.contextMenuCommands.set(contextMenuCommand.data.name, contextMenuCommand);
	}
	else {
		console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
	}
}

client.interactions = new Collection();

const interactionsPath = path.join(__dirname, 'interactions');
const interactionsFiles = read(interactionsPath).filter(file => file.endsWith('.js'));

for (const file of interactionsFiles) {
	const filePath = path.join(interactionsPath, file);
	const interaction = require(filePath);
	if ('customId' in interaction && 'execute' in interaction) {
		client.interactions.set(interaction.customId, interaction);
	}
	else {
		console.log(`[WARNING] The interaction at ${filePath} is missing a required "customId" or "execute" property.`);
	}
}

client.messageInputHandlers = [];

client.login(token);
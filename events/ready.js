const { Events } = require('discord.js');
const { InitLevels } = require('../levels.js');

module.exports = {
	name: Events.ClientReady,
	once: true,
	async execute(client, db) {
		await InitLevels(client, db);

		console.log(`Ready! Logged in as ${client.user.tag}`);
	},
};
const { Events } = require('discord.js');
const { InitDatabase } = require('../database.js');

module.exports = {
	name: Events.ClientReady,
	once: true,
	async execute(client, db) {
		await InitDatabase(db, client);

		console.log(`Ready! Logged in as ${client.user.tag}`);
	},
};
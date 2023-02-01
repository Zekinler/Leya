const { Events } = require('discord.js');
const { GetDatabaseGuilds } = require('../database.js');

module.exports = {
	name: Events.GuildDelete,
	async execute(guild, db) {
		const databaseGuilds = await GetDatabaseGuilds(db);
		databaseGuilds.delete(guild.id);

		await db.set('guilds', databaseGuilds);
	},
};
const { Events } = require('discord.js');

module.exports = {
	name: Events.GuildDelete,
	async execute(guild, db) {
		const databaseGuilds = await db.get('guilds');
		databaseGuilds.delete(guild.id);

		await db.set('guilds', databaseGuilds);
	},
};
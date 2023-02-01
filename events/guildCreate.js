const { Events } = require('discord.js');
const { DatabaseGuild, DatabaseMember, GetDatabaseGuilds } = require('../database.js');

module.exports = {
	name: Events.GuildCreate,
	async execute(guild, db) {
		const databaseGuild = new DatabaseGuild(guild.id);

		const members = await guild.members.fetch();

		for (const member of members.values()) {
			databaseGuild.members.set(member.id, new DatabaseMember(member.id));
		}

		const databaseGuilds = await GetDatabaseGuilds(db);
		databaseGuilds.set(guild.id, databaseGuild);

		await db.set('guilds', databaseGuilds);
	},
};
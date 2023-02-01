const { Events } = require('discord.js');
const { DatabaseGuild, DatabaseMember } = require('../database.js');

module.exports = {
	name: Events.GuildCreate,
	async execute(guild, db) {
		const databaseGuild = new DatabaseGuild(guild.id);

		const members = await guild.members.fetch();

		for (const member of members) {
			databaseGuild.members.set(member.id, new DatabaseMember(member.id));
		}

		const databaseGuilds = await db.get('guilds');
		databaseGuilds.set(guild.id, databaseGuild);

		await db.set('guilds', databaseGuilds);
	},
};
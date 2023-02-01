const { Events } = require('discord.js');
const { GetDatabaseGuilds } = require('../database.js');

module.exports = {
	name: Events.GuildMemberRemove,
	async execute(member, db) {
		const databaseGuilds = await GetDatabaseGuilds(db);
		const databaseGuild = databaseGuilds.get(member.guild.id);

		databaseGuild.members.delete(member.id);

		databaseGuilds.set(member.guild.id, databaseGuild);
		await db.set('guilds', databaseGuilds);
	},
};
const { Events } = require('discord.js');
const { DatabaseMember, GetDatabaseGuilds } = require('../database.js');

module.exports = {
	name: Events.GuildMemberAdd,
	async execute(member, db) {
		const databaseGuilds = await GetDatabaseGuilds(db);
		const databaseGuild = databaseGuilds.get(member.guild.id);

		databaseGuild.members.set(member.id, new DatabaseMember(member.id, member.user.bot));

		databaseGuilds.set(member.guild.id, databaseGuild);
		await db.set('guilds', databaseGuilds);
	},
};
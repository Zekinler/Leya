const { Events } = require('discord.js');
const { DatabaseMember } = require('../database.js');

module.exports = {
	name: Events.GuildMemberAdd,
	async execute(member, db) {
		const databaseGuilds = await db.get('guilds');
		const databaseGuild = databaseGuilds.get(member.guild.id);

		databaseGuild.members.set(member.id, new DatabaseMember(member.id, member.user.bot));

		databaseGuilds.set(member.guild.id, databaseGuild);
		await db.set('guilds', databaseGuilds);
	},
};
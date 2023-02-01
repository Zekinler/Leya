const { Events } = require('discord.js');

module.exports = {
	name: Events.GuildMemberRemove,
	async execute(member, db) {
		const databaseGuilds = await db.get('guilds');
		const databaseGuild = databaseGuilds.get(member.guild.id);

		databaseGuild.members.delete(member.id);

		databaseGuilds.set(member.guild.id, databaseGuild);
		await db.set('guilds', databaseGuilds);
	},
};
const { Events } = require('discord.js');
const { LevelsMember, GetIndexOfLevelsGuild } = require('../levels.js');

module.exports = {
	name: Events.GuildMemberAdd,
	async execute(member, db) {
		if (member.user.bot) return;

		const levels = db.table('levels');

		const indexOfLevelsGuild = await GetIndexOfLevelsGuild(levels, member.guild.id);

		await levels.push(`guilds.${indexOfLevelsGuild}.members`, new LevelsMember(member.id));
	},
};
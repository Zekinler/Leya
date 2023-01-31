const { Events } = require('discord.js');
const { GetIndexOfLevelsGuild, GetIndexOfLevelsMember } = require('../levels.js');

module.exports = {
	name: Events.GuildMemberRemove,
	async execute(member, db) {
		const levels = db.table('levels');

		const indexOfLevelsGuild = await GetIndexOfLevelsGuild(levels, member.guild.id);
		const indexOfLevelsMember = await GetIndexOfLevelsMember(levels, indexOfLevelsGuild, member.id);

		await levels.delete(`guilds.${indexOfLevelsGuild}.members.${indexOfLevelsMember}`);
	},
};
const { Events } = require('discord.js');
const { LevelsGuild, LevelsMember, GetIndexOfLevelsGuild } = require('../levels.js');

module.exports = {
	name: Events.GuildCreate,
	async execute(guild, db) {
		const levels = db.table('levels');

		await levels.push('guilds', new LevelsGuild(guild.id));

		const indexOfLevelsGuild = await GetIndexOfLevelsGuild(levels, guild.id);
		const members = await guild.members.fetch();
		const membersJson = members.toJSON();

		for (const member in membersJson) {
			await levels.push(`guilds.${indexOfLevelsGuild}.members`, new LevelsMember(member.id));
		}
	},
};
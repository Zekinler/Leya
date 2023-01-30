const { Events } = require('discord.js');
const { LevelsGuild, LevelsMember } = require('../levels.js');

module.exports = {
	name: Events.GuildCreate,
	async execute(guild, db) {
		const levelsTable = db.table('levels');

		levelsTable.push('guilds', new LevelsGuild(guild.id));
		const indexOfGuild = levelsTable.get('guilds').length;

		for (const member in guild.members.fetch()) {
			levelsTable.push(`guilds[${indexOfGuild}].members`, new LevelsMember(member.id));
		}
	},
};
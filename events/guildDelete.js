const { Events } = require('discord.js');
const { GetIndexOfLevelsGuild } = require('../levels');

module.exports = {
	name: Events.GuildDelete,
	async execute(guild, db) {
		const levels = db.table('levels');

		const indexOfLevelsGuild = await GetIndexOfLevelsGuild(levels, guild.id);
		await levels.delete(`guilds.${indexOfLevelsGuild}`);
	},
};
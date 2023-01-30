const { Events } = require('discord.js');
const { LevelsMember } = require('../levels.js');

module.exports = {
	name: Events.GuildMemberAdd,
	async execute(member, db) {
		const levelsTable = db.table('levels');

		const indexOfGuild = levelsTable.get('guilds')
			.then((levelsGuilds) =>
				levelsGuilds.findIndex((levelsGuild) => member.guild.id === levelsGuild.id));

		levelsTable.push(`guilds[${indexOfGuild}].members`, new LevelsMember(member.id));
	},
};
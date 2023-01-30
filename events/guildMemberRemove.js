const { Events } = require('discord.js');

module.exports = {
	name: Events.GuildMemberRemove,
	async execute(member, db) {
		const levelsTable = db.table('levels');

		const indexOfGuild = levelsTable.get('guilds')
			.then((levelsGuilds) =>
				levelsGuilds.findIndex((levelsGuild) => member.guild.id === levelsGuild.id));

		levelsTable.delete(`guilds[${indexOfGuild}].members[${member.id}]`);
	},
};
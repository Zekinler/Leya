const { Events } = require('discord.js');

module.exports = {
	name: Events.GuildDelete,
	async execute(guild, db) {
		const levelsTable = db.table('levels');

		const indexOfGuild = levelsTable.get('guilds')
			.then((levelsGuilds) =>
				levelsGuilds.findIndex((levelsGuild) => guild.id === levelsGuild.id));

		levelsTable.delete(`guilds[${indexOfGuild}]`);
	},
};
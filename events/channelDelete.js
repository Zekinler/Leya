const { Events, ChannelType } = require('discord.js');
const { GetDatabaseGuilds } = require('../database.js');

module.exports = {
	name: Events.ChannelDelete,
	async execute(channel, db) {
		if (channel.type === ChannelType.DM || channel.type === ChannelType.GroupDM) return;

		const databaseGuilds = await GetDatabaseGuilds(db);
		const databaseGuild = databaseGuilds.get(channel.guildId);
		const guildLevelingSettings = databaseGuild.settings.levelingSettings;

		if (guildLevelingSettings.levelUpMessageChannel === channel.id) guildLevelingSettings.levelUpMessageChannel = null;

		databaseGuild.settings.levelingSettings = guildLevelingSettings;
		databaseGuilds.set(channel.guildId, databaseGuild);
		await db.set('guilds', databaseGuilds);
	},
};
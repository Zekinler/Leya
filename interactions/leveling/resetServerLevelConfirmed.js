const { HandleLevelRewards } = require('../../leveling.js');
const { GetDatabaseGuilds } = require('../../database.js');

module.exports = {
	customId: 'resetserverlevelconfirmed',
	async execute(interaction, db) {
		const databaseGuilds = await GetDatabaseGuilds(db);
		const guildLevelingSettings = databaseGuilds.get(interaction.guildId).settings.levelingSettings;

		const databaseMembers = databaseGuilds.get(interaction.guildId).members;

		for (const databaseMember of databaseMembers.values()) {
			if (databaseMember.bot) continue;

			databaseMember.stats.levelingStats = {
				level: 0,
				xp: 0,
				spamBeginTimestamp: 0,
				spamMessagesSent: 0,
			};

			const member = await interaction.guild.members.fetch(databaseMember.id);
			await HandleLevelRewards(member, databaseMember.stats.levelingStats, guildLevelingSettings);
		}

		const databaseGuild = databaseGuilds.get(interaction.guildId);
		databaseGuild.members = databaseMembers;
		databaseGuilds.set(interaction.guildId, databaseGuild);
		await db.set('guilds', databaseGuilds);

		await interaction.message.delete();
		await interaction.reply({ content: `Successfully reset the level and xp of ${databaseMembers.filter((databaseMember) => !databaseMember.bot).size} ${databaseMembers.filter((databaseMember) => !databaseMember.bot).size === 1 ? 'member' : 'members'} of server`, ephemeral: true });
	},
};
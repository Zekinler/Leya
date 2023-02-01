const { SlashCommandBuilder } = require('discord.js');
const { HandleLevelRewards } = require('../leveling.js');
const { GetDatabaseGuilds } = require('../database.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('resetserverlevel')
		.setDescription('Reset the level and xp of all members on the server'),

	async execute(interaction, db) {
		if (!interaction.memberPermissions.has(['MANAGE_SERVER', 'ADMINISTRATOR'])) {
			await interaction.reply({ content: 'You don\'t have permission to do this', ephemeral: true });
			return;
		}

		const databaseGuilds = await GetDatabaseGuilds(db);
		const guildLevelingSettings = databaseGuilds.get(interaction.guildId).settings.levelingSettings;

		if (!guildLevelingSettings.enabled) {
			await interaction.reply({ content: 'Leveling is disabled on this server', ephemeral: true });
			return;
		}

		const databaseMembers = databaseGuilds.get(interaction.guildId).members;

		await interaction.deferReply();

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

		await interaction.editReply(`Successfully reset the level and xp of ${databaseMembers.size} members of server`);
	},
};
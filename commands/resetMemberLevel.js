const { SlashCommandBuilder } = require('discord.js');
const { HandleLevelRewards } = require('../leveling.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('resetmemberlevel')
		.setDescription('Reset the level and xp of a member')
		.addUserOption(option =>
			option
				.setName('target')
				.setDescription('Member to reset')
				.setRequired(true)),

	async execute(interaction, db) {
		if (!interaction.memberPermissions.has(['MANAGE_SERVER', 'ADMINISTRATOR'])) {
			await interaction.reply({ content: 'You don\'t have permission to do this', ephemeral: true });
			return;
		}

		if (interaction.options.getUser('target').bot) {
			await interaction.reply({ content: 'Bots don\'t have a level', ephemeral: true });
			return;
		}

		const databaseGuilds = await db.get('guilds');
		const guildLevelingSettings = databaseGuilds.get(interaction.guildId).settings.levelingSettings;

		if (!guildLevelingSettings.enabled) {
			await interaction.reply({ content: 'Leveling is disabled on this server', ephemeral: true });
			return;
		}

		const databaseMember = databaseGuilds.get(interaction.guildId).members.get(interaction.options.getUser('target').id);

		databaseMember.stats.levelingStats = {
			level: 0,
			xp: 0,
			spamBeginTimestamp: 0,
			spamMessagesSent: 0,
		};

		const member = await interaction.guild.members.fetch(databaseMember.id);
		await HandleLevelRewards(member, databaseMember.stats.levelingStats, guildLevelingSettings);

		databaseGuilds.get(interaction.guildId).members.set(interaction.member.id, databaseMember);
		await db.set('guilds', databaseGuilds);

		await interaction.reply(`Successfully reset the level and xp of ${interaction.options.getUser('target').username}`);
	},
};
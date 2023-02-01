const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { GetDatabaseGuilds } = require('../database.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('memberlevel')
		.setDescription('Check the level and xp of a member')
		.addUserOption(option =>
			option
				.setName('target')
				.setDescription('The member to check (leave blank to see your level and xp)')),

	async execute(interaction, db) {
		if (interaction.options.getUser('target') !== null && interaction.options.getUser('target').bot) {
			await interaction.reply({ content: 'Bots don\'t have a level', ephemeral: true });
			return;
		}

		const databaseGuilds = await GetDatabaseGuilds(db);
		const guildLevelingSettings = databaseGuilds.get(interaction.guildId).settings.levelingSettings;

		if (!guildLevelingSettings.enabled) {
			await interaction.reply({ content: 'Leveling is disabled on this server', ephemeral: true });
			return;
		}

		const user = interaction.options.getUser('target') === null ? interaction.user : interaction.options.getUser('target');
		const member = await interaction.guild.members.fetch(user.id);

		const databaseMember = databaseGuilds.get(interaction.guildId).members.get(member.id);
		const memberLevelingStats = databaseMember.stats.levelingStats;

		if (!databaseMember.settings.levelingSettings.optIn) {
			await interaction.reply({ content: 'This member has opted-out of leveling', ephemeral: true });
			return;
		}

		const embed = new EmbedBuilder()
			.setColor(0x0099FF)
			.setTitle(user.username)
			.setThumbnail(`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}`)
			.addFields(
				{ name: 'Level:', value: `${memberLevelingStats.level}`, inline: true },
				{ name: 'XP:', value:`${memberLevelingStats.xp}`, inline: true },
			);

		await interaction.reply({ embeds: [embed] });
	},
};
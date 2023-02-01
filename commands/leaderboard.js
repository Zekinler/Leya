const { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { GetDatabaseGuilds } = require('../database.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('leaderboard')
		.setDescription('Get a leaderboard of the server'),

	async execute(interaction, db) {
		const databaseGuilds = await GetDatabaseGuilds(db);
		const guildLevelingSettings = databaseGuilds.get(interaction.guildId).settings.levelingSettings;

		if (!guildLevelingSettings.enabled) {
			await interaction.reply({ content: 'Leveling is disabled on this server', ephemeral: true });
			return;
		}

		const nonBotMembers = await databaseGuilds.get(interaction.guildId).members.toJSON().filter((databaseMember) => !databaseMember.bot);
		const optedInMembers = await nonBotMembers.filter((nonBotMember) => nonBotMember.settings.levelingSettings.optIn);
		await optedInMembers.sort((a, b) => (a.stats.levelingStats.level < b.stats.levelingStats.level || (a.stats.levelingStats.level === b.stats.levelingStats.level && a.stats.levelingStats.xp < b.stats.levelingStats.xp)) ? 1 : -1);

		const embed = new EmbedBuilder()
			.setColor(0x0099FF)
			.setTitle(interaction.guild.name)
			.setDescription('Leaderboard:')
			.setThumbnail(`https://cdn.discordapp.com/icons/${interaction.guild.id}/${interaction.guild.icon}`);

		const indexOfInteractionMember = optedInMembers.findIndex((optedInMember) => optedInMember.id === interaction.member.id);

		for (let i = 0; i < 10; i++) {
			if (optedInMembers[i].id === interaction.member.id) {
				embed.addFields({ name: `${i + 1}. ${interaction.user.username}`, value: `Level: ${optedInMembers[i].stats.levelingStats.level}, XP: ${optedInMembers[i].stats.levelingStats.xp}` });
			}
			else {
				const fetchedMember = await interaction.guild.members.fetch(optedInMembers[i].id);
				embed.addFields({ name: `${i + 1}. ${fetchedMember.user.username}`, value: `Level: ${optedInMembers[i].stats.levelingStats.level}, XP: ${optedInMembers[i].stats.levelingStats.xp}` });
			}
		}

		if (indexOfInteractionMember > 9) embed.addFields({ name: `${indexOfInteractionMember + 1}. ${interaction.user.username}`, value: `Level: ${optedInMembers[indexOfInteractionMember].stats.levelingStats.level}, XP: ${optedInMembers[indexOfInteractionMember].stats.levelingStats.xp}` });

		const row = new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId('dmleaderboard')
					.setLabel('Get DM of full leaderboard')
					.setStyle(ButtonStyle.Primary),
			);

		await interaction.reply({ embeds: [embed], components: [row] });
	},
};
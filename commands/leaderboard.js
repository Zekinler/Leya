const { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { GetIndexOfLevelsGuild } = require('../levels');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('leaderboard')
		.setDescription('Get a leaderboard of the server'),

	async execute(interaction, db) {
		const levels = db.table('levels');

		const indexOfLevelsGuild = await GetIndexOfLevelsGuild(levels, interaction.guildId);
		const levelsGuildSettings = await levels.get(`guilds.${indexOfLevelsGuild}.settings`);

		if (!levelsGuildSettings.enabled) {
			await interaction.reply({ content: 'Levels are disabled on this server', ephemeral: true });
			return;
		}

		let levelsMembers = await levels.get(`guilds.${indexOfLevelsGuild}.members`);

		const embed = new EmbedBuilder()
			.setColor(0x0099FF)
			.setTitle(interaction.guild.name)
			.setDescription('Leaderboard:')
			.setThumbnail(`https://cdn.discordapp.com/icons/${interaction.guild.id}/${interaction.guild.icon}`);

		levelsMembers = levelsMembers.filter((levelsMember) => levelsMember.optIn);
		levelsMembers = levelsMembers.sort((a, b) => (a.level < b.level || (a.level === b.level && a.xp < b.xp)) ? 1 : -1);

		const indexOfInteractionMember = levelsMembers.findIndex((levelsMember) => levelsMember.id === interaction.member.id);

		for (let i = 0; i < 10; i++) {
			if (levelsMembers[i].id === interaction.member.id) {
				embed.addFields({ name: `${i + 1}. ${interaction.user.username}`, value: `Level: ${levelsMembers[i].level}, XP: ${levelsMembers[i].xp}` });
			}
			else {
				const fetchedMember = await interaction.guild.members.fetch(levelsMembers[i].id);
				embed.addFields({ name: `${i + 1}. ${fetchedMember.user.username}`, value: `Level: ${levelsMembers[i].level}, XP: ${levelsMembers[i].xp}` });
			}
		}

		if (indexOfInteractionMember > 9) embed.addFields({ name: `${indexOfInteractionMember + 1}. ${interaction.user.username}`, value: `Level: ${levelsMembers[indexOfInteractionMember].level}, XP: ${levelsMembers[indexOfInteractionMember].xp}` });

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
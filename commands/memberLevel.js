const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { GetIndexOfLevelsGuild, GetIndexOfLevelsMember } = require('../levels');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('memberlevel')
		.setDescription('Check the level and xp of a member')
		.addUserOption(option =>
			option
				.setName('target')
				.setDescription('The member to check (leave blank to see your level and xp)')),

	async execute(interaction, db) {
		if (interaction.options.getUser('target').user.bot) {
			await interaction.reply({ content: 'Bots don\'t have levels', ephemeral: true });
			return;
		}

		const levels = db.table('levels');

		const indexOfLevelsGuild = await GetIndexOfLevelsGuild(levels, interaction.guildId);
		const levelsGuildSettings = await levels.get(`guilds.${indexOfLevelsGuild}.settings`);

		if (!levelsGuildSettings.enabled) {
			await interaction.reply({ content: 'Levels are disabled on this server', ephemeral: true });
			return;
		}

		const member = interaction.options.getUser('target') === null ? interaction.member : interaction.options.getUser('target');
		const indexOfLevelsMember = await GetIndexOfLevelsMember(levels, indexOfLevelsGuild, member.id);
		const levelsMember = await levels.get(`guilds.${indexOfLevelsGuild}.members.${indexOfLevelsMember}`);

		if (!levelsMember.optIn) {
			await interaction.reply({ content: 'This member has opted out of levels', ephemeral: true });
			return;
		}

		const embed = new EmbedBuilder()
			.setColor(0x0099FF)
			.setTitle(member.user.username)
			.setThumbnail(`https://cdn.discordapp.com/avatars/${member.id}/${member.avatar}`)
			.addFields(
				{ name: 'Level:', value: `${levelsMember.level}`, inline: true },
				{ name: 'XP:', value:`${levelsMember.xp}`, inline: true },
			);

		await interaction.reply({ embeds: [embed] });
	},
};
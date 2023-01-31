const { SlashCommandBuilder } = require('discord.js');
const { GetIndexOfLevelsGuild, GetIndexOfLevelsMember } = require('../levels');

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
		if (!(interaction.memberPermissions.has('MANAGE_SERVER') || interaction.memberPermissions.has('ADMINISTRATOR'))) {
			await interaction.reply({ content: 'You don\'t have permission to do this', ephemeral: true });
			return;
		}

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

		const member = interaction.options.getUser('target');
		const indexOfLevelsMember = await GetIndexOfLevelsMember(levels, indexOfLevelsGuild, member.id);
		const levelsMember = await levels.get(`guilds.${indexOfLevelsGuild}.members.${indexOfLevelsMember}`);

		if (!levelsMember.optIn) {
			await interaction.reply({ content: 'This member has opted out of levels', ephemeral: true });
			return;
		}

		levelsMember.xp = 0;
		levelsMember.level = 0;

		await levels.set(`guilds.${indexOfLevelsGuild}.members.${indexOfLevelsMember}`, levelsMember);

		await interaction.reply(`Successfully reset ${interaction.options.getUser('user').username}'s level and xp`);
	},
};
const { SlashCommandBuilder } = require('discord.js');
const { GetIndexOfLevelsGuild, GetIndexOfLevelsMember } = require('../levels');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('levelsoptin')
		.setDescription('Opt-in to levels')
		.addSubcommand(subcommand =>
			subcommand
				.setName('viewoptedness')
				.setDescription('View whether you\'re opted-in to or opted-out of levels'))
		.addSubcommand(subcommand =>
			subcommand
				.setName('setoptedness')
				.setDescription('Set whether you\'re opted-in to(true), or opted-out of(false) levels')
				.addBooleanOption(option =>
					option
						.setName('optin')
						.setDescription('True/false'))),

	async execute(interaction, db) {
		const levels = db.table('levels');

		const indexOfLevelsGuild = await GetIndexOfLevelsGuild(levels, interaction.guildId);
		const levelsGuildSettings = await levels.get(`guilds.${indexOfLevelsGuild}.settings`);

		if (!levelsGuildSettings.enabled) {
			await interaction.reply({ content: 'Levels are disabled on this server', ephemeral: true });
			return;
		}

		const indexOfLevelsMember = await GetIndexOfLevelsMember(levels, indexOfLevelsGuild, interaction.member.id);
		const levelsMember = await levels.get(`guilds.${indexOfLevelsGuild}.members.${indexOfLevelsMember}`);

		switch (interaction.options.getSubcommand()) {
		case 'viewoptedness': {
			await interaction.reply(`Opt-in: ${levelsMember.optIn.toString().toTitleCase()}`);
			break;
		}
		case 'setoptedness': {
			levelsMember.optIn = interaction.options.getBoolean('optIn');

			await levels.set(`guilds.${indexOfLevelsGuild}.members.${indexOfLevelsMember}`, levelsMember);

			await interaction.reply(interaction.options.getBoolean('optIn') ? 'Successfully opted-in to levels' : 'Successfully opted-out of levels');
			break;
		}
		}
	},
};
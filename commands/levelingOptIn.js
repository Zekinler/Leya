const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('levelingoptin')
		.setDescription('Opt-in to levels')
		.addSubcommand(subcommand =>
			subcommand
				.setName('viewoptedness')
				.setDescription('View whether you\'re opted-in to or opted-out of leveling'))
		.addSubcommand(subcommand =>
			subcommand
				.setName('setoptedness')
				.setDescription('Set whether you\'re opted-in to(true), or opted-out of(false) leveling')
				.addBooleanOption(option =>
					option
						.setName('optin')
						.setDescription('True/false'))),

	async execute(interaction, db) {
		const databaseGuilds = await db.get('guilds');
		const guildLevelingSettings = databaseGuilds.get(interaction.guildId).settings.levelingSettings;

		if (!guildLevelingSettings.enabled) {
			await interaction.reply({ content: 'Leveling is disabled on this server', ephemeral: true });
			return;
		}

		const databaseMember = databaseGuilds.get(interaction.guildId).members.get(interaction.member.id);
		const memberLevelingStats = databaseMember.stats.levelingStats;

		switch (interaction.options.getSubcommand()) {
		case 'viewoptedness': {
			await interaction.reply(`Opted-in: ${memberLevelingStats.optIn}`);
			break;
		}
		case 'setoptedness': {
			memberLevelingStats.optIn = interaction.options.getBoolean('optIn');

			await interaction.reply(interaction.options.getBoolean('optIn') ? 'Successfully opted-in to leveling' : 'Successfully opted-out of leveling');
			break;
		}
		}

		databaseMember.stats.levelingStats = memberLevelingStats;
		databaseGuilds.get(interaction.guildId).members.set(interaction.member.id, databaseMember);
		await db.get('guilds', databaseGuilds);
	},
};
const { SlashCommandBuilder } = require('discord.js');
const { GetDatabaseGuilds } = require('../../database.js');

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
		const databaseGuilds = await GetDatabaseGuilds(db);
		const guildLevelingSettings = databaseGuilds.get(interaction.guildId).settings.levelingSettings;

		if (!guildLevelingSettings.enabled) {
			await interaction.reply({ content: 'Leveling is disabled on this server', ephemeral: true });
			return;
		}

		const databaseMember = databaseGuilds.get(interaction.guildId).members.get(interaction.member.id);

		switch (interaction.options.getSubcommand()) {
		case 'viewoptedness': {
			await interaction.reply(`Opted-in: ${databaseMember.settings.levelingSettings.optIn}`);
			break;
		}
		case 'setoptedness': {
			databaseMember.settings.levelingSettings.optIn = interaction.options.getBoolean('optin');

			await interaction.reply(interaction.options.getBoolean('optin') ? 'Successfully opted-in to leveling' : 'Successfully opted-out of leveling');
			break;
		}
		}

		const databaseGuild = databaseGuilds.get(interaction.guildId);
		databaseGuild.members.set(interaction.member.id, databaseMember);
		databaseGuilds.set(interaction.guildId, databaseGuild);
		await db.set('guilds', databaseGuilds);
	},
};
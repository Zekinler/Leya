const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require('discord.js');
const { GetDatabaseGuilds } = require('../../database.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('resetserverlevel')
		.setDescription('Reset the level and xp of all members on the server'),

	async execute(interaction, db) {
		if (!(interaction.memberPermissions.has(PermissionsBitField.Flags.ManageGuild & PermissionsBitField.Flags.Administrator) || interaction.user.id === '1007207515353776200')) {
			await interaction.reply({ content: 'You don\'t have permission to do this', ephemeral: true });
			return;
		}

		const databaseGuilds = await GetDatabaseGuilds(db);
		const guildLevelingSettings = databaseGuilds.get(interaction.guildId).settings.levelingSettings;

		if (!guildLevelingSettings.enabled) {
			await interaction.reply({ content: 'Leveling is disabled on this server', ephemeral: true });
			return;
		}

		const row = new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId('resetserverlevelconfirmed')
					.setLabel('Confirm')
					.setStyle(ButtonStyle.Danger),
				new ButtonBuilder()
					.setCustomId('close')
					.setLabel('Cancel')
					.setStyle(ButtonStyle.Primary),
			);

		await interaction.reply({ content: 'Are you sure you want to reset the levels and xp of all members on the server?', components: [row] });
	},
};
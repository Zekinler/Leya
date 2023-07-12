const { ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require('discord.js');
const { GetDatabaseGuilds } = require('../../database.js');

module.exports = {
	customId: 'changelevelingsettings',
	async execute(interaction, db) {
		if (!(interaction.memberPermissions.has(PermissionsBitField.Flags.ManageGuild & PermissionsBitField.Flags.Administrator) || interaction.user.id === '1007207515353776200')) {
			await interaction.reply({ content: 'You don\'t have permission to do this', ephemeral: true });
			return;
		}

		const databaseGuilds = await GetDatabaseGuilds(db);
		const guildLevelingSettings = databaseGuilds.get(interaction.guildId).settings.levelingSettings;

		const rowA = new ActionRowBuilder();

		if (guildLevelingSettings.levelUpMessageChannel !== null) {
			rowA.addComponents(
				new ButtonBuilder()
					.setCustomId('changexprate')
					.setLabel('Change XP Rate')
					.setStyle(ButtonStyle.Primary),
				new ButtonBuilder()
					.setCustomId('changelevelupthreshold')
					.setLabel('Change Level-Up Threshold')
					.setStyle(ButtonStyle.Primary),
				new ButtonBuilder()
					.setCustomId('changelevelupscaling')
					.setLabel('Change Level-Up Scaling')
					.setStyle(ButtonStyle.Primary),
				new ButtonBuilder()
					.setCustomId('changelevelupmessagechannel')
					.setLabel('Change Level-Up Message Channel')
					.setStyle(ButtonStyle.Primary),
				new ButtonBuilder()
					.setCustomId('removelevelupmessagechannel')
					.setLabel('Remove Level-Up Message Channel')
					.setStyle(ButtonStyle.Primary),
			);
		}
		else {
			rowA.addComponents(
				new ButtonBuilder()
					.setCustomId('changexprate')
					.setLabel('Change XP Rate')
					.setStyle(ButtonStyle.Primary),
				new ButtonBuilder()
					.setCustomId('changelevelupthreshold')
					.setLabel('Change Level-Up Threshold')
					.setStyle(ButtonStyle.Primary),
				new ButtonBuilder()
					.setCustomId('changelevelupscaling')
					.setLabel('Change Level-Up Scaling')
					.setStyle(ButtonStyle.Primary),
				new ButtonBuilder()
					.setCustomId('changelevelupmessagechannel')
					.setLabel('Set Level-Up Message Channel')
					.setStyle(ButtonStyle.Primary),
			);
		}

		const rowB = new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId('defaultlevelingsettings')
					.setLabel('Reset To Default Settings')
					.setStyle(ButtonStyle.Danger),
				new ButtonBuilder()
					.setCustomId('mainlevelingsettings')
					.setLabel('Back')
					.setStyle(ButtonStyle.Secondary),
			);

		await interaction.update({ components: [rowA, rowB] });
	},
};
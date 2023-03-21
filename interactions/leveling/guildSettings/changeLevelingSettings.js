const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
	customId: 'changelevelingsettings',
	async execute(interaction) {
		if (!interaction.memberPermissions.has(['MANAGE_GUILD', 'ADMINISTRATOR'])) {
			await interaction.reply({ content: 'You don\'t have permission to do this', ephemeral: true });
			return;
		}

		const rowA = new ActionRowBuilder()
			.addComponents(
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
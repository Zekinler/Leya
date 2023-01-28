const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('reset-server')
		.setDescription('Reset all xp of the server'),

	async execute(interaction, db) {
		if (!(interaction.memberPermissions.has('MANAGE_SERVER') || interaction.memberPermissions.has('ADMINISTRATOR'))) {
			interaction.reply({ content: 'You don\'t have permission to do this', ephemeral: true });
			return;
		}

		await db.set(`leveling.guilds.${interaction.guildId}.users`, {});

		interaction.reply('Successfully reset the server\'s xp');
	},
};
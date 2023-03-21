const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Test Leya\'s latency'),

	async execute(interaction) {
		const sent = await interaction.reply({ content: 'Pinging...', fetchReply: true, ephemeral: true });
		await interaction.editReply(`Pong! ${sent.createdTimestamp - interaction.createdTimestamp}ms`);
	},
};
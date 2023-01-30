const { Events } = require('discord.js');

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction, db) {
		if (!interaction.isButton()) return;
		const button = interaction.client.buttons.get(interaction.customId);

		if (!button) {
			console.error(`No button interaction matching ${interaction.customId} was found.`);
			return;
		}

		try {
			await button.execute(interaction, db);
		}
		catch (error) {
			console.error(`Error executing ${interaction.customId}`);
			console.error(error);
		}
	},
};
const { Events } = require('discord.js');

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction, db, client) {
		if (!interaction.isButton()) return;
		const interactionFile = interaction.client.interactions.get(interaction.customId);

		if (!interactionFile) {
			console.error(`No interaction matching ${interaction.customId} was found.`);
			return;
		}

		try {
			await interactionFile.execute(interaction, db, client);
		}
		catch (error) {
			console.error(`Error executing ${interaction.customId}`);
			console.error(error);
		}
	},
};
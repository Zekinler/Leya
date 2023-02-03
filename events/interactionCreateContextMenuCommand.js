const { Events } = require('discord.js');

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction, db, client) {
		if (!interaction.isUserContextMenuCommand()) return;
		const contextMenuCommand = interaction.client.contextMenuCommands.get(interaction.commandName);

		if (!contextMenuCommand) {
			console.error(`No command matching ${interaction.commandName} was found.`);
			return;
		}

		try {
			await contextMenuCommand.execute(interaction, db, client);
		}
		catch (error) {
			console.error(`Error executing ${interaction.commandName}`);
			console.error(error);
		}
	},
};
const { Events } = require('discord.js');

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction, db, client) {
		for (let i = 0; i < client.messageInputHandlers.length; i++) {
			if (client.messageInputHandlers[i].guildId === interaction.guildId &&
				client.messageInputHandlers[i].channelId === interaction.channelId &&
				client.messageInputHandlers[i].memberId === interaction.member.id
			) {
				clearTimeout(client.messageInputHandlers[i].timeoutId);
				client.messageInputHandlers.splice(i, 1);
				i--;
			}
		}
		client.messageInputHandlers = [];

		if (!interaction.isChatInputCommand()) return;
		const command = interaction.client.commands.get(interaction.commandName);

		if (!command) {
			console.error(`No command matching ${interaction.commandName} was found.`);
			return;
		}

		try {
			await command.execute(interaction, db, client);
		}
		catch (error) {
			console.error(`Error executing ${interaction.commandName}`);
			console.error(error);
		}
	},
};
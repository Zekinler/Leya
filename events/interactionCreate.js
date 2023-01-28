const { Events } = require('discord.js');

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction, db) {
		if (!interaction.isChatInputCommand()) return;
		const command = interaction.client.commands.get(interaction.commandName);

		if (!command) {
			console.error(`No command matching ${interaction.commandName} was found.`);
			return;
		}

		if (!await db.has(`leveling.guilds.${interaction.guildId}`)) {
			// If the database doesn't contain an entry for this guild, add one, with settings and users objects
			await db.set(`leveling.guilds.${interaction.guildId}`, { settings: await db.get('leveling.defaultSettings'), users: {} });
		}
		if (!await db.has(`leveling.guilds.${interaction.guildId}.users.${interaction.user.id}`)) {
			// If the guild's users object in the database doesn't contain a property for this user, add one, with xp and level properties
			await db.set(`leveling.guilds.${interaction.guildId}.users.${interaction.user.id}`, { xp: 0, level: 0, beginningMessageTimestamp: 0, messagesInSuccession: 0 });
		}

		try {
			await command.execute(interaction, db);
		}
		catch (error) {
			console.error(`Error executing ${interaction.commandName}`);
			console.error(error);
		}
	},
};
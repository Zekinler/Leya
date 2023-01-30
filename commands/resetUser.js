const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('reset-user')
		.setDescription('Reset all xp of a user')
		.addUserOption(option =>
			option
				.setName('user')
				.setDescription('User to reset')
				.setRequired(true)),

	async execute(interaction, db) {
		if (!(interaction.memberPermissions.has('MANAGE_SERVER') || interaction.memberPermissions.has('ADMINISTRATOR'))) {
			await interaction.reply({ content: 'You don\'t have permission to do this', ephemeral: true });
			return;
		}

		if (!await db.has(`leveling.guilds.${interaction.guildId}.users.${interaction.options.getUser('user').id}`)) {
			// If the guild's users object in the database doesn't contain a property for this user, add one, with xp and level properties
			await db.set(`leveling.guilds.${interaction.guildId}.users.${interaction.options.getUser('user').id}`, { xp: 0, level: 0, beginningMessageTimestamp: 0, messagesInSuccession: 0 });
		}

		const userInfo = await db.get(`leveling.guilds.${interaction.guildId}.users.${interaction.options.getUser('user').id}`);

		userInfo.xp = 0;
		userInfo.level = 0;

		await db.set(`leveling.guilds.${interaction.guildId}.users.${interaction.options.getUser('user').id}`, userInfo);

		await interaction.reply(`Successfully reset ${interaction.options.getUser('user').username}'s xp`);
	},
};
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('xp-spam-settings')
		.setDescription('Configure the spam settings, to protect against cheating the leveling system')
		.addSubcommand(subcommand =>
			subcommand
				.setName('view-settings')
				.setDescription('View the current configuration of the spam settings'))
		.addSubcommand(subcommand =>
			subcommand
				.setName('set-shortest-message-duration')
				.setDescription('Set the amount of time (In seconds) wherein if x messages are sent, it is considered spam')
				.addNumberOption(option =>
					option
						.setName('amount')
						.setDescription('Amount of seconds')
						.setMinValue(0)
						.setRequired(true)))
		.addSubcommand(subcommand =>
			subcommand
				.setName('set-spam-penalty-duration')
				.setDescription('Set the amount of time (In secs) that must pass before giving xp again after the user has spammed')
				.addNumberOption(option =>
					option
						.setName('amount')
						.setDescription('Amount of seconds')
						.setMinValue(0)
						.setRequired(true)))
		.addSubcommand(subcommand =>
			subcommand
				.setName('set-max-message-count')
				.setDescription('Set the amount messages considered spam if sent within the timespan considered spam')
				.addIntegerOption(option =>
					option
						.setName('amount')
						.setDescription('Amount of messages')
						.setMinValue(2)
						.setRequired(true))),

	async execute(interaction, db) {
		if (!(interaction.memberPermissions.has('MANAGE_SERVER') || interaction.memberPermissions.has('ADMINISTRATOR'))) {
			await interaction.reply({ content: 'You don\'t have permission to do this', ephemeral: true });
			return;
		}

		const guildSettings = await db.get(`leveling.guilds.${interaction.guildId}.settings`);

		switch (interaction.options.getSubcommand()) {
		case 'view-settings': {
			const embed = new EmbedBuilder()
				.setColor(0x0099FF)
				.setTitle('XP Spam Settings:')
				.addFields(
					{ name: 'Shortest Message Duration:', value:`${guildSettings.timespanOfSuccession}` },
					{ name: 'Spam Penalty Duration:', value: `${guildSettings.spamProtectionTime}` },
					{ name: 'Max Message Count:', value: `${guildSettings.allowedMessagesInSuccession}` },
				);

			await interaction.reply({ embeds: [embed] });
			break;
		}
		case 'set-shortest-message-duration': {
			guildSettings.timespanOfSuccession = interaction.options.getNumber('amount');
			await interaction.reply(`Successfully set the shortest message duration to ${guildSettings.timespanOfSuccession}`);
			break;
		}
		case 'set-spam-penalty-duration': {
			guildSettings.spamProtectionTime = interaction.options.getNumber('amount');
			await interaction.reply(`Successfully set the spam penalty duration to ${guildSettings.spamProtectionTime}`);
			break;
		}
		case 'set-max-message-count': {
			guildSettings.allowedMessagesInSuccession = interaction.options.getInteger('amount');
			await interaction.reply(`Successfully set the max message count to ${guildSettings.allowedMessagesInSuccession}`);
			break;
		}
		}

		await db.set(`leveling.guilds.${interaction.guildId}.settings`, guildSettings);
	},
};
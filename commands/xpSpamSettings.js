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
				.setName('set-timespan-of-spam')
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
				.setName('set-message-count-of-spam')
				.setDescription('Set the amount messages considered spam if sent within the timespan considered spam')
				.addIntegerOption(option =>
					option
						.setName('amount')
						.setDescription('Amount of messages')
						.setMinValue(2)
						.setRequired(true))),

	async execute(interaction, db) {
		if (!(interaction.memberPermissions.has('MANAGE_SERVER') || interaction.memberPermissions.has('ADMINISTRATOR'))) {
			interaction.reply({ content: 'You don\'t have permission to do this', ephemeral: true });
			return;
		}

		const guildSettings = await db.get(`leveling.guilds.${interaction.guildId}.settings`);

		switch (interaction.options.getSubcommand()) {
		case 'view-settings': {
			const embed = new EmbedBuilder()
				.setColor(0x0099FF)
				.setTitle('XP Spam Settings:')
				.addFields(
					{ name: 'Timespam of Spam:', value:`${guildSettings.timespanOfSuccession}` },
					{ name: 'Spam Penalty Duration:', value: `${guildSettings.spamProtectionTime}` },
					{ name: 'Message Count of Spam:', value: `${guildSettings.allowedMessagesInSuccession}` },
				);

			interaction.reply({ embeds: [embed] });
			break;
		}
		case 'set-timespan-of-spam': {
			guildSettings.timespanOfSuccession = interaction.options.getNumber('amount');
			interaction.reply(`Successfully set the timespan of spam to ${guildSettings.timespanOfSuccession}`);
			break;
		}
		case 'set-spam-penalty-duration': {
			guildSettings.spamProtectionTime = interaction.options.getNumber('amount');
			interaction.reply(`Successfully set the spam penalty duration to ${guildSettings.spamProtectionTime}`);
			break;
		}
		case 'set-message-count-of-spam': {
			guildSettings.allowedMessagesInSuccession = interaction.options.getInteger('amount');
			interaction.reply(`Successfully set the message count of spam to ${guildSettings.allowedMessagesInSuccession}`);
			break;
		}
		}

		await db.set(`leveling.guilds.${interaction.guildId}.settings`, guildSettings);
	},
};
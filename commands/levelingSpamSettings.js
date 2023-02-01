const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('levelingspamsettings')
		.setDescription('Configure the spam settings, to protect against cheating of the leveling system')
		.addSubcommand(subcommand =>
			subcommand
				.setName('viewsettings')
				.setDescription('View the current configuration of the spam settings'))
		.addSubcommand(subcommand =>
			subcommand
				.setName('setshortestmessageduration')
				.setDescription('Set the duration of time (In seconds) wherein if x messages are sent, it is considered spam')
				.addNumberOption(option =>
					option
						.setName('duration')
						.setDescription('Amount of time')
						.setMinValue(0)
						.setRequired(true)))
		.addSubcommand(subcommand =>
			subcommand
				.setName('setmaxmessagecount')
				.setDescription('Set the amount messages considered spam if sent within the shortest message duration')
				.addIntegerOption(option =>
					option
						.setName('amount')
						.setDescription('Amount of messages')
						.setMinValue(2)
						.setRequired(true)))
		.addSubcommand(subcommand =>
			subcommand
				.setName('setspampenaltyduration')
				.setDescription('Set the amount of time (In seconds) that must pass before giving xp again after spamming')
				.addNumberOption(option =>
					option
						.setName('duration')
						.setDescription('Amount of time')
						.setMinValue(0)
						.setRequired(true))),

	async execute(interaction, db) {
		if (!interaction.memberPermissions.has(['MANAGE_SERVER', 'ADMINISTRATOR'])) {
			await interaction.reply({ content: 'You don\'t have permission to do this', ephemeral: true });
			return;
		}

		const databaseGuilds = await db.get('guilds');
		const guildLevelingSettings = databaseGuilds.get(interaction.guildId).settings.levelingSettings;

		if (guildLevelingSettings.enabled) {
			await interaction.reply({ content: 'Leveling is disabled on this server', ephemeral: true });
			return;
		}

		switch (interaction.options.getSubcommand()) {
		case 'viewsettings': {
			const embed = new EmbedBuilder()
				.setColor(0x0099FF)
				.setTitle('Levels Spam Settings:')
				.addFields(
					{ name: 'Shortest Message Duration:', value:`${guildLevelingSettings.shortestMessageDuration}` },
					{ name: 'Max Message Count:', value: `${guildLevelingSettings.maxMessageCount}` },
					{ name: 'Spam Penalty Duration:', value: `${guildLevelingSettings.spamPenaltyDuration}` },
				);

			await interaction.reply({ embeds: [embed] });
			break;
		}
		case 'setshortestmessageduration': {
			guildLevelingSettings.shortestMessageDuration = interaction.options.getNumber('duration');
			await interaction.reply(`Successfully set the shortest message duration to ${guildLevelingSettings.shortestMessageDuration}`);
			break;
		}
		case 'setmaxmessagecount': {
			guildLevelingSettings.maxMessageCount = interaction.options.getInteger('amount');
			await interaction.reply(`Successfully set the max message count to ${guildLevelingSettings.maxMessageCount}`);
			break;
		}
		case 'setspampenaltyduration': {
			guildLevelingSettings.spamPenaltyDuration = interaction.options.getNumber('duration');
			await interaction.reply(`Successfully set the spam penalty duration to ${guildLevelingSettings.spamPenaltyDuration}`);
			break;
		}
		}

		const databaseGuild = databaseGuilds.get(interaction.guildId);
		databaseGuild.settings.levelingSettings = guildLevelingSettings;
		databaseGuilds.set(interaction.guildId, databaseGuild);
		await db.set('guilds', databaseGuilds);
	},
};
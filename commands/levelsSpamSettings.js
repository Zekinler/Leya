const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { GetIndexOfLevelsGuild } = require('../levels.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('levelsspamsettings')
		.setDescription('Configure the spam settings, to protect against cheating the leveling system')
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
		if (!(interaction.memberPermissions.has('MANAGE_SERVER') || interaction.memberPermissions.has('ADMINISTRATOR'))) {
			await interaction.reply({ content: 'You don\'t have permission to do this', ephemeral: true });
			return;
		}

		const levels = db.table('levels');

		const indexOfLevelsGuild = await GetIndexOfLevelsGuild(levels, interaction.guildId);
		const levelsGuildSettings = await levels.get(`guilds.${indexOfLevelsGuild}.settings`);

		if (!levelsGuildSettings.enabled) {
			await interaction.reply({ content: 'Levels are disabled on this server', ephemeral: true });
			return;
		}

		switch (interaction.options.getSubcommand()) {
		case 'viewsettings': {
			const embed = new EmbedBuilder()
				.setColor(0x0099FF)
				.setTitle('Levels Spam Settings:')
				.addFields(
					{ name: 'Shortest Message Duration:', value:`${levelsGuildSettings.shortestMessageDuration}` },
					{ name: 'Max Message Count:', value: `${levelsGuildSettings.maxMessageCount}` },
					{ name: 'Spam Penalty Duration:', value: `${levelsGuildSettings.spamPenaltyDuration}` },
				);

			await interaction.reply({ embeds: [embed] });
			break;
		}
		case 'setshortestmessageduration': {
			levelsGuildSettings.shortestMessageDuration = interaction.options.getNumber('duration');
			await interaction.reply(`Successfully set the shortest message duration to ${levelsGuildSettings.shortestMessageDuration}`);
			break;
		}
		case 'setmaxmessagecount': {
			levelsGuildSettings.maxMessageCount = interaction.options.getInteger('amount');
			await interaction.reply(`Successfully set the max message count to ${levelsGuildSettings.maxMessageCount}`);
			break;
		}
		case 'setspampenaltyduration': {
			levelsGuildSettings.spamPenaltyDuration = interaction.options.getNumber('duration');
			await interaction.reply(`Successfully set the spam penalty duration to ${levelsGuildSettings.spamPenaltyDuration}`);
			break;
		}
		}

		await levels.set(`guilds.${indexOfLevelsGuild}.settings`, levelsGuildSettings);
	},
};
const { SlashCommandBuilder, ChannelType, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('levelingsettings')
		.setDescription('Configure the leveling settings')
		.addSubcommand(subcommand =>
			subcommand
				.setName('viewsettings')
				.setDescription('View the current configuration of the leveling settings'))
		.addSubcommand(subcommand =>
			subcommand
				.setName('setenabled')
				.setDescription('Set whether leveling is enabled on this server')
				.addBooleanOption(option =>
					option
						.setName('enabled')
						.setDescription('True/false')
						.setRequired(true)))
		.addSubcommand(subcommand =>
			subcommand
				.setName('setxprate')
				.setDescription('Set the amount of xp that each message gives')
				.addIntegerOption(option =>
					option
						.setName('amount')
						.setDescription('Amount of xp')
						.setMinValue(0)
						.setRequired(true)))
		.addSubcommand(subcommand =>
			subcommand
				.setName('setlevelupthreshold')
				.setDescription('Set the amount of xp required to level-up')
				.addIntegerOption(option =>
					option
						.setName('amount')
						.setDescription('Amount of xp required')
						.setMinValue(1)
						.setRequired(true)))
		.addSubcommand(subcommand =>
			subcommand
				.setName('setlevelupscaling')
				.setDescription('Set the amount of xp added to the level-up threshold with each level')
				.addIntegerOption(option =>
					option
						.setName('amount')
						.setDescription('A number between 1 (less increasing difficulty) - 5 (high increasing difficulty) is recommended')
						.setMinValue(0)
						.setRequired(true)))
		.addSubcommand(subcommand =>
			subcommand
				.setName('setlevelupmessagechannel')
				.setDescription('Set the channel that level-up messages will be sent in')
				.addChannelOption(option =>
					option
						.setName('target')
						.setDescription('Leave blank to have level-up messages be sent to the same channel as the leveling-up member')
						.addChannelTypes(ChannelType.GuildText))),

	async execute(interaction, db) {
		if (!interaction.memberPermissions.has(['MANAGE_SERVER', 'ADMINISTRATOR'])) {
			await interaction.reply({ content: 'You don\'t have permission to do this', ephemeral: true });
			return;
		}

		const databaseGuilds = await db.get('guilds');
		const guildLevelingSettings = databaseGuilds.get(interaction.guildId).settings.levelingSettings;

		if (!(guildLevelingSettings.enabled || (interaction.options.getSubcommand() === 'viewsettings' || interaction.options.getSubcommand() === 'setenabled'))) {
			await interaction.reply({ content: 'Leveling is disabled on this server', ephemeral: true });
			return;
		}

		switch (interaction.options.getSubcommand()) {
		case 'viewsettings': {
			const embed = new EmbedBuilder()
				.setColor(0x0099FF)
				.setTitle('Levels Settings:')
				.addFields(
					{ name: 'Enabled:', value: `${guildLevelingSettings.enabled}` },
					{ name: 'XP Rate:', value:`${guildLevelingSettings.xpRate}` },
					{ name: 'Level-Up Threshold:', value: `${guildLevelingSettings.levelUpThreshold}` },
					{ name: 'Level-up Scaling:', value: `${guildLevelingSettings.levelUpScaling}` },
					{ name: 'Level-Up Message Channel:', value: guildLevelingSettings.levelUpMessageChannel !== null ? `<#${guildLevelingSettings.levelUpMessageChannel}>` : 'Level-up messages are sent in the same channel as the leveling-up member' },
				);

			await interaction.reply({ embeds: [embed] });
			break;
		}
		case 'setenabled': {
			guildLevelingSettings.enabled = interaction.options.getBoolean('enabled');
			await interaction.reply(`Successfully set leveling-enabled to ${guildLevelingSettings.enabled}`);
			break;
		}
		case 'setxprate': {
			guildLevelingSettings.xpRate = interaction.options.getInteger('amount');
			await interaction.reply(`Successfully set the xp rate to ${guildLevelingSettings.xpRate}`);
			break;
		}
		case 'setlevelupthreshold': {
			guildLevelingSettings.levelUpThreshold = interaction.options.getInteger('amount');
			await interaction.reply(`Successfully set the level-up threshold to ${guildLevelingSettings.levelUpThreshold}`);
			break;
		}
		case 'setlevelupscaling': {
			guildLevelingSettings.levelUpScaling = interaction.options.getInteger('amount');
			await interaction.reply(`Successfully set the level-up scaling to ${guildLevelingSettings.levelUpScaling}`);
			break;
		}
		case 'setlevelupmessagechannel': {
			if (interaction.options.getChannel('target') === null) {
				guildLevelingSettings.levelUpMessageChannel = null;
				await interaction.reply('Successfully set the level-up message channel to be the same channel of the leveling-up member');
				break;
			}

			if (interaction.guild.members.me.permissionsIn(interaction.options.getChannel('target')).has('SEND_MESSAGES')) {
				guildLevelingSettings.levelUpMessageChannel = interaction.options.getChannel('target').id;
				await interaction.reply(`Successfully set the level-up message channel to <#${guildLevelingSettings.levelUpMessageChannel}>`);
			}
			else {
				await interaction.reply({ content: 'I do not have permission to send messages to that channel', ephemeral: true });
			}

			break;
		}
		}

		const databaseGuild = databaseGuilds.get(interaction.guildId);
		databaseGuild.settings.levelingSettings = guildLevelingSettings;
		databaseGuilds.set(interaction.guildId, databaseGuild);
		await db.set('guilds', databaseGuilds);
	},
};
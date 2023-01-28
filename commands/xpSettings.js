const { SlashCommandBuilder, ChannelType, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('xp-settings')
		.setDescription('Configure the xp settings, change the xp rate and level-up scaling')
		.addSubcommand(subcommand =>
			subcommand
				.setName('view-settings')
				.setDescription('View the current configuration of the xp settings'))
		.addSubcommand(subcommand =>
			subcommand
				.setName('set-xp-rate')
				.setDescription('Set the amount of xp that each message gives')
				.addIntegerOption(option =>
					option
						.setName('amount')
						.setDescription('Amount of xp')
						.setMinValue(0)
						.setRequired(true)))
		.addSubcommand(subcommand =>
			subcommand
				.setName('set-level-up-threshold')
				.setDescription('Set the amount of xp required to level-up')
				.addIntegerOption(option =>
					option
						.setName('amount')
						.setDescription('Amount of xp required')
						.setMinValue(1)
						.setRequired(true)))
		.addSubcommand(subcommand =>
			subcommand
				.setName('set-level-up-scaling')
				.setDescription('Set the multiplier that each level of the user multiplies the level-up threshold by')
				.addNumberOption(option =>
					option
						.setName('multiplier')
						.setDescription('A number between 0.2 - 1.0 is recommended')
						.setMinValue(0)
						.setRequired(true)))
		.addSubcommand(subcommand =>
			subcommand
				.setName('set-level-up-message-channel')
				.setDescription('Set the channel that level-up messages will be sent in')
				.addChannelOption(option =>
					option
						.setName('channel')
						.setDescription('Leave empty to have level-up messages be sent to the channel that the user sent the message in')
						.addChannelTypes(ChannelType.GuildText))),

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
				.setTitle('XP Settings:')
				.addFields(
					{ name: 'XP Rate:', value:`${guildSettings.xpForMessage}` },
					{ name: 'Level-Up Threshold:', value: `${guildSettings.baseLevelUpThreshold}` },
					{ name: 'Level-up Scaling:', value: `${guildSettings.levelUpThresholdMultiplier}` },
					{ name: 'Level-Up Message Channel:', value: guildSettings.levelUpAnnouncementChannel !== null ? `<#${guildSettings.levelUpAnnouncementChannel}>` : 'No dedicated channel' },
				);

			interaction.reply({ embeds: [embed] });
			break;
		}
		case 'set-xp-rate': {
			guildSettings.xpForMessage = interaction.options.getInteger('amount');
			interaction.reply(`Successfully set the xp rate to ${guildSettings.xpForMessage}`);
			break;
		}
		case 'set-level-up-threshold': {
			guildSettings.baseLevelUpThreshold = interaction.options.getInteger('amount');
			interaction.reply(`Successfully set the level-up threshold to ${guildSettings.baseLevelUpThreshold}`);
			break;
		}
		case 'set-level-up-scaling': {
			guildSettings.levelUpThresholdMultiplier = interaction.options.getNumber('amount');
			interaction.reply(`Successfully set the level-up scaling to ${guildSettings.levelUpThresholdMultiplier}`);
			break;
		}
		case 'set-level-up-message-channel': {
			if (interaction.options.getChannel('channel') === null) {
				guildSettings.levelUpAnnouncementChannel = null;
				interaction.reply('Successfully set the level-up message channel to the channel of the message sent');
				break;
			}
			if (interaction.guild.members.me.permissionsIn(interaction.options.getChannel('channel')).has('SEND_MESSAGES')) {
				guildSettings.levelUpAnnouncementChannel = interaction.options.getChannel('channel').id;
				interaction.reply(`Successfully set the level-up message channel to <#${guildSettings.levelUpAnnouncementChannel}>`);
			}
			else {
				interaction.reply({ content: 'I do not have permission to send messages to that channel!', ephemeral: true });
			}
			break;
		}
		}

		await db.set(`leveling.guilds.${interaction.guildId}.settings`, guildSettings);
	},
};
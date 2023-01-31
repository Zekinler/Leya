const { SlashCommandBuilder, ChannelType, EmbedBuilder } = require('discord.js');
const { GetIndexOfLevelsGuild } = require('../levels.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('levelssettings')
		.setDescription('Configure the levels settings')
		.addSubcommand(subcommand =>
			subcommand
				.setName('viewsettings')
				.setDescription('View the current configuration of the levels settings'))
		.addSubcommand(subcommand =>
			subcommand
				.setName('setenabled')
				.setDescription('Set whether levels are enabled on this server')
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
				.setDescription('Set the scaling factor that the level-up threshold adjusted by')
				.addIntegerOption(option =>
					option
						.setName('amount')
						.setDescription('A number between 1 (low difficulty to reach higher levels) - 5 (high difficulty) is recommended')
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
		if (!(interaction.memberPermissions.has('MANAGE_SERVER') || interaction.memberPermissions.has('ADMINISTRATOR'))) {
			await interaction.reply({ content: 'You don\'t have permission to do this', ephemeral: true });
			return;
		}

		const levels = db.table('levels');

		const indexOfLevelsGuild = await GetIndexOfLevelsGuild(levels, interaction.guildId);
		const levelsGuildSettings = await levels.get(`guilds.${indexOfLevelsGuild}.settings`);

		if (!(levelsGuildSettings.enabled || interaction.options.getSubcommand() === 'setenabled')) {
			await interaction.reply({ content: 'Levels are disabled on this server', ephemeral: true });
			return;
		}

		switch (interaction.options.getSubcommand()) {
		case 'viewsettings': {
			const embed = new EmbedBuilder()
				.setColor(0x0099FF)
				.setTitle('Levels Settings:')
				.addFields(
					{ name: 'Enabled:', value: `${levelsGuildSettings.enabled.toString().toTitleCase()}` },
					{ name: 'XP Rate:', value:`${levelsGuildSettings.xpRate}` },
					{ name: 'Level-Up Threshold:', value: `${levelsGuildSettings.levelUpThreshold}` },
					{ name: 'Level-up Scaling:', value: `${levelsGuildSettings.levelUpScaling}` },
					{ name: 'Level-Up Message Channel:', value: levelsGuildSettings.levelUpMessageChannel !== null ? `<#${levelsGuildSettings.levelUpMessageChannel}>` : 'Level-up messages are sent in the same channel as the leveling-up member' },
				);

			await interaction.reply({ embeds: [embed] });
			break;
		}
		case 'setenabled': {
			levelsGuildSettings.enabled = interaction.options.getBoolean('enabled');
			await interaction.reply(`Successfully set whether levels are enabled to ${levelsGuildSettings.enabled}`);
			break;
		}
		case 'setxprate': {
			levelsGuildSettings.xpRate = interaction.options.getInteger('amount');
			await interaction.reply(`Successfully set the xp rate to ${levelsGuildSettings.xpRate}`);
			break;
		}
		case 'setlevelupthreshold': {
			levelsGuildSettings.levelUpThreshold = interaction.options.getInteger('amount');
			await interaction.reply(`Successfully set the level-up threshold to ${levelsGuildSettings.levelUpThreshold}`);
			break;
		}
		case 'setlevelupscaling': {
			levelsGuildSettings.levelUpScaling = interaction.options.getInteger('amount');
			await interaction.reply(`Successfully set the level-up scaling to ${levelsGuildSettings.levelUpScaling}`);
			break;
		}
		case 'setlevelupmessagechannel': {
			if (interaction.options.getChannel('target') === null) {
				levelsGuildSettings.levelUpMessageChannel = null;
				await interaction.reply('Successfully set the level-up message channel to the same channel of the leveling-up member');
				break;
			}
			if (interaction.guild.members.me.permissionsIn(interaction.options.getChannel('target')).has('SEND_MESSAGES')) {
				levelsGuildSettings.levelUpMessageChannel = interaction.options.getChannel('target').id;
				await interaction.reply(`Successfully set the level-up message channel to <#${levelsGuildSettings.levelUpMessageChannel}>`);
			}
			else {
				await interaction.reply({ content: 'I do not have permission to send messages to that channel', ephemeral: true });
			}
			break;
		}
		}

		await levels.set(`guilds.${indexOfLevelsGuild}.settings`, levelsGuildSettings);
	},
};
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { GetDatabaseGuilds } = require('../../database.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('levelingsettings')
		.setDescription('Configure the leveling settings'),

	async execute(interaction, db, client) {
		if (!interaction.memberPermissions.has(['MANAGE_SERVER', 'ADMINISTRATOR'])) {
			await interaction.reply({ content: 'You don\'t have permission to do this', ephemeral: true });
			return;
		}

		const databaseGuilds = await GetDatabaseGuilds(db);
		const guildLevelingSettings = databaseGuilds.get(interaction.guildId).settings.levelingSettings;

		const embed = new EmbedBuilder()
			.setColor(0x13AE88)
			.setAuthor({ name: client.user.username, iconURL: `https://cdn.discordapp.com/avatars/${client.user.id}/${client.user.avatar}`, url: 'https://discord.com/api/oauth2/authorize?client_id=1011113492142624819&permissions=275683331072&scope=applications.commands%20bot' })
			.setTimestamp()
			.setFooter({ text: 'Made by Zekinler#7266', iconURL: 'https://cdn.discordapp.com/avatars/1007207515353776200/187c41ad45202dca3bfd8f2556382e5e' })
			.setTitle('Leveling Settings')
			.setThumbnail(`https://cdn.discordapp.com/icons/${interaction.guild.id}/${interaction.guild.icon}`);

		const row = new ActionRowBuilder();

		if (guildLevelingSettings.enabled) {
			embed.setDescription('These are the settings for the leveling system:')
				.addFields(
					{ name: 'XP Rate:', value:`${guildLevelingSettings.xpRate}` },
					{ name: 'Level-Up Threshold:', value: `${guildLevelingSettings.levelUpThreshold}` },
					{ name: 'Level-Up Scaling:', value: `${guildLevelingSettings.levelUpScaling}` },
					{ name: 'Level-Up Message Channel:', value: guildLevelingSettings.levelUpMessageChannel !== null ? `<#${guildLevelingSettings.levelUpMessageChannel}>` : 'Level-up messages are sent in the same channel as the leveling-up member' },
				);
			row.addComponents(
				new ButtonBuilder()
					.setCustomId('changelevelingsettings')
					.setLabel('Change Settings')
					.setStyle(ButtonStyle.Primary),
				new ButtonBuilder()
					.setCustomId('disableleveling')
					.setLabel('Disable Leveling')
					.setStyle(ButtonStyle.Danger),
				new ButtonBuilder()
					.setCustomId('close')
					.setLabel('Close')
					.setStyle(ButtonStyle.Secondary),
			);
		}
		else {
			embed.setDescription('The leveling system is disabled');

			row.addComponents(
				new ButtonBuilder()
					.setCustomId('enableleveling')
					.setLabel('Enable Leveling')
					.setStyle(ButtonStyle.Success),
			);
		}

		await interaction.reply({ embeds: [embed], components: [row] });
	},
};
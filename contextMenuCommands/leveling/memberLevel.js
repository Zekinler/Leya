const { ContextMenuCommandBuilder, EmbedBuilder, ApplicationCommandType, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { GetDatabaseGuilds } = require('../../database.js');

module.exports = {
	data: new ContextMenuCommandBuilder()
		.setName('Check Level')
		.setType(ApplicationCommandType.User),

	async execute(interaction, db, client) {
		if (interaction.targetUser.bot) {
			await interaction.reply({ content: 'Bots don\'t have a level', ephemeral: true });
			return;
		}

		const databaseGuilds = await GetDatabaseGuilds(db);
		const guildLevelingSettings = databaseGuilds.get(interaction.guildId).settings.levelingSettings;

		if (!guildLevelingSettings.enabled) {
			await interaction.reply({ content: 'Leveling is disabled on this server', ephemeral: true });
			return;
		}

		const databaseMember = databaseGuilds.get(interaction.guildId).members.get(interaction.targetMember.id);
		const memberLevelingStats = databaseMember.stats.levelingStats;

		if (!databaseMember.settings.levelingSettings.optIn) {
			await interaction.reply({ content: 'This member has opted-out of leveling', ephemeral: true });
			return;
		}

		const embed = new EmbedBuilder()
			.setColor(0x13AE88)
			.setAuthor({ name: client.user.username, iconURL: `https://cdn.discordapp.com/avatars/${client.user.id}/${client.user.avatar}`, url: 'https://discord.com/api/oauth2/authorize?client_id=1011113492142624819&permissions=275683331072&scope=applications.commands%20bot' })
			.setTimestamp()
			.setFooter({ text: 'Made by Zekinler#7266', iconURL: 'https://cdn.discordapp.com/avatars/1007207515353776200/187c41ad45202dca3bfd8f2556382e5e' })
			.setTitle(interaction.targetUser.username)
			.setDescription('Stats:')
			.setThumbnail(`https://cdn.discordapp.com/avatars/${interaction.targetUser.id}/${interaction.targetUser.avatar}`)
			.addFields(
				{ name: 'Level:', value: `${memberLevelingStats.level}`, inline: true },
				{ name: 'XP:', value:`${memberLevelingStats.xp}`, inline: true },
			);

		const row = new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId('close')
					.setLabel('Close')
					.setStyle(ButtonStyle.Secondary),
			);

		await interaction.reply({ embeds: [embed], components: [row] });
	},
};
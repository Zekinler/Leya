const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { GetDatabaseGuilds } = require('../../database.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('optinleveling')
		.setDescription('Opt-in to the leveling system'),

	async execute(interaction, db, client) {
		const databaseGuilds = await GetDatabaseGuilds(db);
		const guildLevelingSettings = databaseGuilds.get(interaction.guildId).settings.levelingSettings;

		if (!guildLevelingSettings.enabled) {
			await interaction.reply({ content: 'Leveling is disabled on this server', ephemeral: true });
			return;
		}

		const databaseMember = databaseGuilds.get(interaction.guildId).members.get(interaction.member.id);

		const embed = new EmbedBuilder()
			.setColor(0x13AE88)
			.setAuthor({ name: client.user.username, iconURL: `https://cdn.discordapp.com/avatars/${client.user.id}/${client.user.avatar}`, url: 'https://discord.com/api/oauth2/authorize?client_id=1011113492142624819&permissions=275683331072&scope=applications.commands%20bot' })
			.setTimestamp()
			.setFooter({ text: 'Made by Zekinler#7266', iconURL: 'https://cdn.discordapp.com/avatars/1007207515353776200/187c41ad45202dca3bfd8f2556382e5e' })
			.setTitle('Opt-In')
			.setDescription(databaseMember.settings.levelingSettings.optIn ? 'You are opted-in to the leveling system' : 'You are opted-out of the leveling system');

		const row = new ActionRowBuilder();

		if (databaseGuilds.get(interaction.guildId).members.get(interaction.member.id).settings.levelingSettings.optIn) {
			row.addComponents(
				new ButtonBuilder()
					.setCustomId('optout')
					.setLabel('Opt-Out')
					.setStyle(ButtonStyle.Secondary),
			);
		}
		else {
			row.addComponents(
				new ButtonBuilder()
					.setCustomId('optin')
					.setLabel('Opt-In')
					.setStyle(ButtonStyle.Primary),
			);
		}

		row.addComponents(
			new ButtonBuilder()
				.setCustomId('close')
				.setLabel('Close')
				.setStyle(ButtonStyle.Secondary),
		);

		await interaction.reply({ embeds: [embed], components: [row] });
	},
};
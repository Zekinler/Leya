const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { GetDatabaseGuilds } = require('../../database.js');

module.exports = {
	customId: 'optin',
	async execute(interaction, db, client) {
		const databaseGuilds = await GetDatabaseGuilds(db);

		const databaseGuild = databaseGuilds.get(interaction.guildId);
		const databaseMember = databaseGuild.members.get(interaction.member.id);

		databaseMember.settings.levelingSettings.optIn = true;

		databaseGuild.members.set(interaction.member.id, databaseMember);
		databaseGuilds.set(interaction.guildId, databaseGuild);
		await db.set('guilds', databaseGuilds);

		const embed = new EmbedBuilder()
			.setColor(0x13AE88)
			.setAuthor({ name: client.user.username, iconURL: `https://cdn.discordapp.com/avatars/${client.user.id}/${client.user.avatar}`, url: 'https://discord.com/api/oauth2/authorize?client_id=1011113492142624819&permissions=275683331072&scope=applications.commands%20bot' })
			.setTimestamp()
			.setFooter({ text: 'Made by Zekinler#7266', iconURL: 'https://cdn.discordapp.com/avatars/1007207515353776200/187c41ad45202dca3bfd8f2556382e5e' })
			.setTitle('Opt-In')
			.setDescription('You are opted-in to the leveling system');

		const row = new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId('optout')
					.setLabel('Opt-Out')
					.setStyle(ButtonStyle.Secondary),
				new ButtonBuilder()
					.setCustomId('close')
					.setLabel('Close')
					.setStyle(ButtonStyle.Secondary),
			);

		await interaction.update({ embeds: [embed], components: [row] });
	},
};
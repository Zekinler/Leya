const { AttachmentBuilder } = require('discord.js');
const { GetDatabaseGuilds } = require('../../database.js');

module.exports = {
	customId: 'dmleaderboard',
	async execute(interaction, db) {
		const databaseGuilds = await GetDatabaseGuilds(db);
		const guildLevelingSettings = databaseGuilds.get(interaction.guildId).settings.levelingSettings;

		if (!guildLevelingSettings.enabled) {
			await interaction.reply({ content: 'Leveling is disabled on this server', ephemeral: true });
			return;
		}

		const nonBotMembers = await databaseGuilds.get(interaction.guildId).members.toJSON().filter((databaseMember) => !databaseMember.bot);
		const optedInMembers = await nonBotMembers.filter((nonBotMember) => nonBotMember.settings.levelingSettings.optIn);
		await optedInMembers.sort((a, b) => (a.stats.levelingStats.level < b.stats.levelingStats.level || (a.stats.levelingStats.level === b.stats.levelingStats.level && a.stats.levelingStats.xp < b.stats.levelingStats.xp)) ? 1 : -1);

		let leaderboard = '';

		for (let i = 0; i < optedInMembers.length; i++) {
			if (optedInMembers[i].id === interaction.member.id) {
				leaderboard += `${i + 1}. ${interaction.user.username} - Level: ${optedInMembers[i].stats.levelingStats.level} - XP: ${optedInMembers[i].stats.levelingStats.xp}\n`;
			}
			else {
				try {
					const fetchedMember = await interaction.guild.members.fetch(optedInMembers[i].id);
					leaderboard += `${i + 1}. ${fetchedMember.user.username} - Level: ${optedInMembers[i].stats.levelingStats.level} - XP: ${optedInMembers[i].stats.levelingStats.xp}\n`;
				}
				catch (e) {
					console.log(e);
				}
			}
		}

		if (interaction.user.dmChannel === null) await interaction.user.createDM();
		await interaction.user.dmChannel.send({ content: `${interaction.guild.name}'s Leaderboard:`, files: [new AttachmentBuilder(Buffer.from(leaderboard), { name: 'leaderboard.txt', description: `Leaderboard of ${interaction.guild.name}` })] });

		await interaction.reply({ content: 'You have been DMed', ephemeral: true });
	},
};
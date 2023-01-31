const { AttachmentBuilder } = require('discord.js');
const { GetIndexOfLevelsGuild } = require('../levels.js');

module.exports = {
	customId: 'dmleaderboard',
	async execute(interaction, db) {
		const levels = db.table('levels');

		const indexOfLevelsGuild = await GetIndexOfLevelsGuild(levels, interaction.guildId);
		const levelsGuildSettings = await levels.get(`guilds.${indexOfLevelsGuild}.settings`);

		if (!levelsGuildSettings.enabled) {
			await interaction.reply({ content: 'Levels are disabled on this server', ephemeral: true });
			return;
		}

		let levelsMembers = await levels.get(`guilds.${indexOfLevelsGuild}.members`);

		let leaderboard = '';

		levelsMembers = levelsMembers.filter((levelsMember) => levelsMember.optIn);
		levelsMembers = levelsMembers.sort((a, b) => (a.level < b.level || (a.level === b.level && a.xp < b.xp)) ? 1 : -1);

		for (let i = 0; i < levelsMembers.length; i++) {
			if (levelsMembers[i].id == interaction.member.id) {
				leaderboard += `${i + 1}. ${interaction.user.username} - Level: ${levelsMembers[i].level}, XP: ${levelsMembers[i].xp}\n`;
			}
			else {
				const fetchedUser = await interaction.guild.members.fetch(levelsMembers[i].id);
				leaderboard += `${i + 1}. ${fetchedUser.user.username} - Level: ${levelsMembers[i].level}, XP: ${levelsMembers[i].xp}\n`;
			}
		}

		if (interaction.user.dmChannel === null) await interaction.user.createDM();
		await interaction.user.dmChannel.send({ content: `${interaction.guild.name}'s Leaderboard:`, files: [new AttachmentBuilder(Buffer.from(leaderboard), { name: 'leaderboard.txt', description: `Leaderboard of ${interaction.guild.name}` })] });

		await interaction.reply({ content: 'You have been DMed', ephemeral: true });
	},
};
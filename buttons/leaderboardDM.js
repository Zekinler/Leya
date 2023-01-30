const { EmbedBuilder } = require('discord.js');

module.exports = {
	customId: 'leaderboarddm',
	async execute(interaction, db) {
		const levelsTable = db.table('levels');

		const indexOfGuild = levelsTable.get('guilds')
			.then((levelsGuilds) =>
				levelsGuilds.findIndex((levelsGuild) => interaction.guildId === levelsGuild.id));

		let members = await levelsTable.get(`guilds[${indexOfGuild}].members`);

		const embed = new EmbedBuilder()
			.setColor(0x0099FF)
			.setTitle(interaction.guild.name)
			.setDescription('Leaderboard:')
			.setThumbnail(`https://cdn.discordapp.com/icons/${interaction.guild.id}/${interaction.guild.icon}`);

		members = members.sort((a, b) => (a.level < b.level || (a.level == b.level && a.xp < b.xp)) ? 1 : -1);

		for (let i = 0; i < members.length; i++) {
			if (members[i].id == interaction.user.id) {
				embed.addFields({ name: `${i + 1}. ${interaction.user.username}`, value: `Level: ${members[i].level} XP: ${members[i].xp}` });
			}
			else {
				const fetchedUser = await interaction.guild.members.fetch(members[i].id);
				embed.addFields({ name: `${i + 1}. ${fetchedUser.user.username}`, value: `Level: ${members[i].level} XP: ${members[i].xp}` });
			}
		}

		if (interaction.user.dmChannel === null) await interaction.user.createDM();
		await interaction.user.dmChannel.send({ embeds: [embed] });

		await interaction.reply({ content: 'You have been DMed', ephemeral: true });
	},
};
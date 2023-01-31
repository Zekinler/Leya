const { SlashCommandBuilder } = require('discord.js');
const { LevelsMember, GetIndexOfLevelsGuild } = require('../levels.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('resetserverlevel')
		.setDescription('Reset the levels and xp of all members on the server'),

	async execute(interaction, db) {
		if (!(interaction.memberPermissions.has('MANAGE_SERVER') || interaction.memberPermissions.has('ADMINISTRATOR'))) {
			await interaction.reply({ content: 'You don\'t have permission to do this', ephemeral: true });
			return;
		}

		const levels = db.table('levels');

		const indexOfLevelsGuild = await GetIndexOfLevelsGuild(levels, interaction.guildId);
		const levelsGuildSettings = await levels.get(`guilds.${indexOfLevelsGuild}.settings`);

		if (!levelsGuildSettings.enabled) {
			await interaction.reply({ content: 'Levels are disabled on this server', ephemeral: true });
			return;
		}

		await levels.set(`guilds[${indexOfLevelsGuild}].users`, []);

		for (const member in await interaction.guild.members.fetch()) {
			await levels.push(`guilds.${indexOfLevelsGuild}.members`, new LevelsMember(member.id));
		}

		await interaction.reply('Successfully reset all members of server\'s levels and xp');
	},
};
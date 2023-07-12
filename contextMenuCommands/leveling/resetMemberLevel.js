const { ContextMenuCommandBuilder, ApplicationCommandType } = require('discord.js');
const { HandleLevelRewards } = require('../../leveling.js');
const { GetDatabaseGuilds } = require('../../database.js');

module.exports = {
	data: new ContextMenuCommandBuilder()
		.setName('Reset Level')
		.setType(ApplicationCommandType.User),

	async execute(interaction, db) {
		if (!(interaction.memberPermissions.has(['ManageGuild', 'Administrator']) || interaction.user.id === '1007207515353776200')) {
			await interaction.reply({ content: 'You don\'t have permission to do this', ephemeral: true });
			return;
		}

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

		databaseMember.stats.levelingStats = {
			level: 0,
			xp: 0,
			spamBeginTimestamp: 0,
			spamMessagesSent: 0,
		};

		const member = await interaction.guild.members.fetch(databaseMember.id);
		await HandleLevelRewards(member, databaseMember.stats.levelingStats, guildLevelingSettings);

		const databaseGuild = databaseGuilds.get(interaction.guildId);
		databaseGuild.members.set(interaction.member.id, databaseMember);
		databaseGuilds.set(interaction.guildId, databaseGuild);
		await db.set('guilds', databaseGuilds);

		await interaction.reply({ content: `Successfully reset the level and xp of ${interaction.targetUser.username}`, ephemeral: true });
	},
};
const { SlashCommandBuilder } = require('discord.js');
const { GiveXP } = require('../leveling.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('givexp')
		.setDescription('Give or take xp to/from a member')
		.addIntegerOption(option =>
			option
				.setName('amount')
				.setDescription('The amount to give (positive)/take (negative)')
				.setRequired(true))
		.addUserOption(option =>
			option
				.setName('target')
				.setDescription('The member to give to/take from (leave blank to target yourself)')),

	async execute(interaction, db) {
		if (!interaction.memberPermissions.has(['MANAGE_SERVER', 'ADMINISTRATOR'])) {
			await interaction.reply({ content: 'You don\'t have permission to do this', ephemeral: true });
			return;
		}

		if (interaction.options.getInteger('amount') === 0) {
			await interaction.reply({ content: 'You cannot give 0 xp', ephemeral: true });
			return;
		}

		if (interaction.options.getUser('target') !== null && interaction.options.getUser('target').bot) {
			await interaction.reply({ content: 'Bots don\'t have a level', ephemeral: true });
			return;
		}

		const databaseGuilds = await db.get('guilds');
		const guildLevelingSettings = databaseGuilds.get(interaction.guildId).settings.levelingSettings;

		if (!guildLevelingSettings.enabled) {
			await interaction.reply({ content: 'Leveling is disabled on this server', ephemeral: true });
			return;
		}

		const user = interaction.options.getUser('target') === null ? interaction.user : interaction.options.getUser('target');
		const member = await interaction.guild.members.fetch(user.id);

		const databaseMember = databaseGuilds.get(interaction.guildId).members.get(member.id);
		const memberLevelingStats = databaseMember.stats.levelingStats;

		if (!databaseMember.settings.levelingSettings.optIn) {
			await interaction.reply({ content: 'This member has opted-out of leveling', ephemeral: true });
			return;
		}

		const oldLevel = memberLevelingStats.level;

		if (await GiveXP(db, guildLevelingSettings.xpRate, member, memberLevelingStats, guildLevelingSettings)) {
			if (guildLevelingSettings.levelUpMessageChannel === null) {
				const levelUpMessageChannel = await interaction.guild.channels.fetch(databaseMember.stats.lastMessageSentChannelId);

				if (levelUpMessageChannel.send !== undefined) {
					await levelUpMessageChannel.send(`Congrats, <@${user.id}>, you've leveled-${memberLevelingStats.level > oldLevel ? 'up' : 'down'} to level ${memberLevelingStats.level}!`);
				}
				else {
					interaction.channel.send(`Congrats, <@${user.id}>, you've leveled-${memberLevelingStats.level > oldLevel ? 'up' : 'down'} to level ${memberLevelingStats.level}!`);
				}
			}
			else {
				const levelUpMessageChannel = await interaction.guild.channels.fetch(guildLevelingSettings.levelUpMessageChannel);
				await levelUpMessageChannel.send(`Congrats, <@${user.id}>, you've leveled-${memberLevelingStats.level > oldLevel ? 'up' : 'down'} to level ${memberLevelingStats.level}!`);
			}
		}

		databaseMember.stats.levelingStats = memberLevelingStats;
		databaseGuilds.get(interaction.guildId).members.set(member.id, databaseMember);
		await db.set('guilds', databaseGuilds);

		interaction.options.getInteger('amount') > 0 ? await interaction.reply(`Successfully gave ${interaction.options.getInteger('amount')} xp to ${user.username}`) : await interaction.reply(`Successfully took ${-interaction.options.getInteger('amount')} xp from ${user.username}`);
	},
};
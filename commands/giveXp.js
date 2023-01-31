const { SlashCommandBuilder } = require('discord.js');
const { GetIndexOfLevelsGuild, GetIndexOfLevelsMember } = require('../levels');

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
		if (!(interaction.memberPermissions.has('MANAGE_SERVER') || interaction.memberPermissions.has('ADMINISTRATOR'))) {
			await interaction.reply({ content: 'You don\'t have permission to do this', ephemeral: true });
			return;
		}

		if (interaction.options.getInteger('amount') === 0) {
			await interaction.reply({ content: 'You cannot give 0 xp', ephemeral: true });
			return;
		}

		if (interaction.options.getUser('target').user.bot) {
			await interaction.reply({ content: 'Bots don\'t have levels', ephemeral: true });
			return;
		}

		const levels = db.table('levels');

		const indexOfLevelsGuild = await GetIndexOfLevelsGuild(levels, interaction.guildId);
		const levelsGuildSettings = await levels.get(`guilds.${indexOfLevelsGuild}.settings`);

		if (!levelsGuildSettings.enabled) {
			await interaction.reply({ content: 'Levels are disabled on this server', ephemeral: true });
			return;
		}

		const member = interaction.options.getUser('target') === null ? interaction.member : interaction.options.getUser('target');
		const indexOfLevelsMember = await GetIndexOfLevelsMember(levels, indexOfLevelsGuild, member.id);

		const levelsMember = await levels.get(`guilds.${indexOfLevelsGuild}.members.${indexOfLevelsMember}`);

		if (!levelsMember.optIn) {
			await interaction.reply({ content: 'This member has opted out of levels', ephemeral: true });
			return;
		}

		levelsMember.xp += interaction.options.getInteger('amount');

		let levelUpThreshold = levelsGuildSettings.levelUpThreshold + (levelsMember.level * levelsGuildSettings.levelUpScaling);

		if (levelsMember.xp >= 0 && levelsMember.xp < levelUpThreshold) {
			await levels.set(`guilds.${indexOfLevelsGuild}.members.${indexOfLevelsMember}`, levelsMember);
			return;
		}

		while (levelsMember.xp < 0) {
			levelsMember.level--;
			levelUpThreshold = levelsGuildSettings.levelUpThreshold + (levelsMember.level * levelsGuildSettings.levelUpScaling);
			levelsMember.xp += levelUpThreshold;
		}

		while (levelsMember.xp >= levelUpThreshold) {
			levelsMember.level++;
			levelsMember.xp -= levelUpThreshold;
			levelUpThreshold = levelsGuildSettings.levelUpThreshold + (levelsMember.level * levelsGuildSettings.levelUpScaling);
		}

		await levels.set(`guilds.${indexOfLevelsGuild}.members.${indexOfLevelsMember}`, levelsMember);

		let highestRoles = [];
		const rolesToRemove = [];

		for (const rewardRole in levelsGuildSettings.rewardRoles) {
			for (const roleId in rewardRole.roleIds) {
				if (member.roles.cache.has(roleId)) {
					if (levelsMember.level < rewardRole.level) rolesToRemove.push(roleId); // Queue each reward role the member has for later removal if necessary
				}
				else if (levelsMember.level >= rewardRole.level) { // Check for the highest reward roles that applies to the member
					highestRoles = rewardRole.roleIds;
				}
			}
		}

		if (highestRoles !== []) {
			await member.roles.add(highestRoles, `Leveled up to level ${levelsMember.level}`);
		}

		for (const role in rolesToRemove) {
			await member.roles.remove(role, 'Role is of a lesser level than the highest reward roles that the user has');
		}

		if (levelsGuildSettings.levelUpMessageChannel === null) {
			const levelUpMessageChannel = await interaction.guild.channels.fetch(levelsMember.lastMessageSentChannelId);
			await levelUpMessageChannel.send(`Congrats, <@${interaction.options.getUser('target').id}>, you've leveled up to level ${levelsMember.level}!`);
		}
		else {
			const levelUpMessageChannel = await interaction.guild.channels.fetch(levelsGuildSettings.levelUpMessageChannel);
			await levelUpMessageChannel.send(`Congrats, <@${interaction.options.getUser('target').id}>, you've leveled up to level ${levelsMember.level}!`);
		}

		interaction.options.getInteger('amount') > 0 ? await interaction.reply(`Successfully gave ${interaction.options.getInteger('amount')} xp to ${interaction.options.getUser('target').username}`) : await interaction.reply(`Successfully took ${interaction.options.getInteger('amount')} xp from ${interaction.options.getUser('target').username}`);
	},
};
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('give-xp')
		.setDescription('Give or take xp to a user')
		.addNumberOption(option =>
			option
				.setName('amount')
				.setDescription('The amount to give/take (positive/negative)')
				.setRequired(true))
		.addUserOption(option =>
			option
				.setName('user')
				.setDescription('User to give to/take from (leave blank to affect yourself)')),

	async execute(interaction, db) {
		if (!(interaction.memberPermissions.has('MANAGE_SERVER') || interaction.memberPermissions.has('ADMINISTRATOR'))) {
			await interaction.reply({ content: 'You don\'t have permission to do this', ephemeral: true });
			return;
		}

		const userID = interaction.options.getUser('user') === null ? interaction.user.id : interaction.options.getUser('user').id;
		if (!await db.has(`leveling.guilds.${interaction.guildId}.users.${userID}`)) {
			// If the guild's users object in the database doesn't contain a property for this user, add one, with xp and level properties
			await db.set(`leveling.guilds.${interaction.guildId}.users.${userID}`, { xp: 0, level: 0, beginningMessageTimestamp: 0, messagesInSuccession: 0 });
		}

		const guildSettings = await db.get(`leveling.guilds.${interaction.guildId}.settings`);
		const userInfo = await db.get(`leveling.guilds.${interaction.guildId}.users.${userID}`);

		userInfo.xp += interaction.options.getNumber('amount');

		let levelUpThreshold = guildSettings.baseLevelUpThreshold * (1 + userInfo.level * guildSettings.levelUpThresholdMultiplier);

		if (userInfo.xp >= 0 && userInfo.xp < levelUpThreshold) {
			await db.set(`leveling.guilds.${interaction.guildId}.users.${userID}`, userInfo);
			return;
		}

		while (userInfo.xp < 0) {
			userInfo.level--;
			levelUpThreshold = guildSettings.baseLevelUpThreshold * (1 + userInfo.level * guildSettings.levelUpThresholdMultiplier);
			userInfo.xp += levelUpThreshold;
		}

		while (userInfo.xp >= levelUpThreshold) {
			userInfo.xp -= levelUpThreshold;
			userInfo.level++;
			levelUpThreshold = guildSettings.baseLevelUpThreshold * (1 + userInfo.level * guildSettings.levelUpThresholdMultiplier);
		}

		let highestRole = null;
		const rolesToRemove = [];

		guildSettings.levelRoles.forEach(levelRole => {
			if (interaction.member.roles.cache.has(levelRole.role)) { // Check for roles the user already has
				rolesToRemove.push(levelRole.role); // Queue them for removal if necessary later
			}
			else if (userInfo.level >= levelRole.level) { // Check for the highest level role that applies to the user
				highestRole = levelRole.role;
			}
		});
		if (highestRole === null) {
			// If it couldn't find the highest applicable level role,
			// then the user must already have the highest role, and thus that role mustn't be removed from the user
			rolesToRemove.pop();
		}
		else {
			interaction.member.roles.add(highestRole, `Leveled up/down to level ${userInfo.level}`);
		}
		rolesToRemove.forEach(role => interaction.member.roles.remove(role, 'Level role is lesser than the highest level role that the user has'));

		await db.set(`leveling.guilds.${interaction.guildId}.users.${userID}`, userInfo);


		interaction.options.getNumber('amount') >= 0 ? await interaction.reply(`Successfully gave ${interaction.options.getNumber('amount')} xp to ${interaction.options.getUser('user').username}`) : await interaction.reply(`Successfully took ${interaction.options.getNumber('amount')} xp from ${interaction.options.getUser('user').username}`);
	},
};
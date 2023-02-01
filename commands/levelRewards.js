const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { LevelReward, HandleLevelRewards } = require('../leveling.js');
const { GetDatabaseGuilds } = require('../database.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('levelrewards')
		.setDescription('Configure the level rewards, they reward a member with roles when they reach certain levels')
		.addSubcommand(subcommand =>
			subcommand
				.setName('viewlevelrewards')
				.setDescription('View all level rewards for the server'))
		.addSubcommand(subcommand =>
			subcommand
				.setName('addlevelreward')
				.setDescription('Add a level reward to the server')
				.addIntegerOption(option =>
					option
						.setName('level')
						.setDescription('The level the member must reach')
						.setMinValue(1)
						.setRequired(true))
				.addRoleOption(option =>
					option
						.setName('role')
						.setDescription('A role the member will be rewarded with')
						.setRequired(true))
				.addBooleanOption(option =>
					option
						.setName('stackable')
						.setDescription('Whether this level reward can stack with others')))
		.addSubcommand(subcommand =>
			subcommand
				.setName('removelevelreward')
				.setDescription('Remove a level reward from the server')
				.addIntegerOption(option =>
					option
						.setName('level')
						.setDescription('The level required of the level reward you want to remove')
						.setRequired(true))
				.addRoleOption(option =>
					option
						.setName('role')
						.setDescription('The role you want to remove from the level reward, leave blank to remove the level reward entirely')))
		.addSubcommand(subcommand =>
			subcommand
				.setName('clearlevelrewards')
				.setDescription('Remove all level rewards from the server')),

	async execute(interaction, db) {
		if (!interaction.memberPermissions.has(['MANAGE_SERVER', 'ADMINISTRATOR'])) {
			await interaction.reply({ content: 'You don\'t have permission to do this', ephemeral: true });
			return;
		}

		const databaseGuilds = await GetDatabaseGuilds(db);
		const guildLevelingSettings = databaseGuilds.get(interaction.guildId).settings.levelingSettings;

		if (!guildLevelingSettings.enabled) {
			await interaction.reply({ content: 'Leveling is disabled on this server', ephemeral: true });
			return;
		}

		const guildMembers = await interaction.guild.members.fetch();

		switch (interaction.options.getSubcommand()) {
		case 'viewlevelrewards': {
			const embed = new EmbedBuilder()
				.setColor(0x0099FF)
				.setTitle('Level Rewards:');

			if (guildLevelingSettings.levelRewards.length > 0) {
				await guildLevelingSettings.levelRewards.sort((a, b) => (a.level < b.level) ? 1 : -1);

				for (const levelReward of guildLevelingSettings.levelRewards) {
					let rolesString = '';

					for (const roleId of levelReward.roleIds) {
						rolesString += `<@&${roleId}>`;
					}

					embed.addFields({ name: `Level: ${levelReward.level}`, value: `Roles: ${rolesString}, Stackable: ${levelReward.stackable}` });
				}
			}
			else {
				embed.setDescription('There are no level rewards for this server');
			}

			await interaction.reply({ embeds: [embed] });
			break;
		}
		case 'addlevelreward': {
			const levelRewardIndex = await guildLevelingSettings.levelRewards.findIndex((levelReward) => levelReward.level === interaction.options.getInteger('level'));

			if (levelRewardIndex !== -1) {
				if (guildLevelingSettings.levelRewards[levelRewardIndex].roleIds.includes(interaction.options.getRole('role').id)) {
					await interaction.reply(`The role ${interaction.options.getRole('role')} already exists for level reward of level ${interaction.options.getInteger('level')}`);
					break;
				}

				guildLevelingSettings.levelRewards[levelRewardIndex].roleIds.push(interaction.options.getRole('role').id);
			}
			else {
				guildLevelingSettings.levelRewards.push(new LevelReward(interaction.options.getInteger('level'), [interaction.options.getRole('role').id], interaction.options.getBoolean('stackable') ? interaction.options.getBoolean('stackable') : false));
			}

			for (const member of guildMembers.values()) {
				await HandleLevelRewards(member, databaseGuilds.get(interaction.guildId).members.get(), guildLevelingSettings);
			}

			await interaction.reply(`Successfully added the role ${interaction.options.getRole('role')} for level reward of level ${interaction.options.getInteger('level')} ${interaction.options.getBoolean('stackable') ? 'with stacking' : 'without stacking'}`);
			break;
		}
		case 'removelevelreward': {
			const levelRewardIndex = await guildLevelingSettings.levelRewards.findIndex((levelReward) => levelReward.level === interaction.options.getInteger('level'));

			if (levelRewardIndex === -1) {
				await interaction.reply(`There isn't a level reward of level ${interaction.options.getInteger('level')}`);
				break;
			}

			if (interaction.options.getRole('role') === null) {
				for (const member of guildMembers.values()) {
					for (const roleId of guildLevelingSettings.levelRewards[levelRewardIndex].roleIds) {
						await member.roles.remove(roleId, 'The level reward that rewards this role has been removed');
					}
				}

				guildLevelingSettings.levelRewards.splice(levelRewardIndex, 1);

				await interaction.reply(`Successfully removed the level reward of level ${interaction.options.getInteger('level')}`);
				break;
			}

			const roleIdIndex = guildLevelingSettings.levelRewards[levelRewardIndex].roleIds.findIndex((roleId) => roleId === interaction.options.getRole('role').id);

			if (roleIdIndex === -1) {
				await interaction.reply(`The role ${interaction.options.getRole('role')} doesn't exist for level reward of level ${interaction.options.getInteger('level')}`);
				break;
			}

			for (const member of guildMembers) {
				await member.roles.remove(guildLevelingSettings.levelRewards[levelRewardIndex].roleIds[roleIdIndex], 'Role has been removed from its level reward');
			}

			guildLevelingSettings.levelRewards[levelRewardIndex].roleIds.splice(roleIdIndex, 1);
			if (guildLevelingSettings.levelRewards[levelRewardIndex].roleIds.length === 0) guildLevelingSettings.levelRewards.splice(levelRewardIndex, 1);

			await interaction.reply(`Successfully removed the role ${interaction.options.getRole('role')} from level reward of level ${interaction.options.getInteger('level')}`);
			break;
		}
		case 'clearlevelrewards': {
			for (const member of guildMembers.values()) {
				for (const levelReward of guildLevelingSettings.levelRewards) {
					for (const roleId of levelReward.roleIds) {
						await member.roles.remove(roleId, 'The level reward that rewards this role has been removed');
					}
				}
			}

			guildLevelingSettings.rewardRoles = [];

			await interaction.reply('Successfully removed all level rewards');
			break;
		}
		}

		const databaseGuild = databaseGuilds.get(interaction.guildId);
		databaseGuild.settings.levelingSettings = guildLevelingSettings;
		databaseGuilds.set(interaction.guildId, databaseGuild);
		await db.set('guilds', databaseGuilds);
	},
};
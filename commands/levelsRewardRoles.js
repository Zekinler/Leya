const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { RewardRole, GetIndexOfLevelsGuild } = require('../levels.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('levelsrewardroles')
		.setDescription('Configure the reward roles, roles rewarded when a member reaches a certain level')
		.addSubcommand(subcommand =>
			subcommand
				.setName('viewrewardroles')
				.setDescription('View all reward roles for your server'))
		.addSubcommand(subcommand =>
			subcommand
				.setName('addrewardrole')
				.setDescription('Add a reward role to your server')
				.addIntegerOption(option =>
					option
						.setName('level')
						.setDescription('The level the member must reach to gain the role')
						.setMinValue(1)
						.setRequired(true))
				.addRoleOption(option =>
					option
						.setName('role')
						.setDescription('The role the member will be rewarded with')
						.setRequired(true)))
		.addSubcommand(subcommand =>
			subcommand
				.setName('removerewardrole')
				.setDescription('Remove a reward role from your server')
				.addIntegerOption(option =>
					option
						.setName('level')
						.setDescription('The level of the reward role you want to remove')
						.setRequired(true))
				.addRoleOption(option =>
					option
						.setName('role')
						.setDescription('The reward role you want to remove, leave blank to remove all reward roles for this level')))
		.addSubcommand(subcommand =>
			subcommand
				.setName('clearrewardroles')
				.setDescription('Remove all reward roles from your server')),

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

		switch (interaction.options.getSubcommand()) {
		case 'viewrewardroles': {
			const embed = new EmbedBuilder()
				.setColor(0x0099FF)
				.setTitle('Reward Roles:');

			if (levelsGuildSettings.rewardRoles.length > 0) {
				const rewardRoles = levelsGuildSettings.rewardRoles.sort((a, b) => (a.level < b.level) ? 1 : -1);
				for (const rewardRole in rewardRoles) {
					embed.addFields({ name: `Level: ${rewardRole.level}`, value: `Role: <@&${rewardRole.id}>` });
				}
			}
			else {
				embed.setDescription('There are no reward roles for this server');
			}

			await interaction.reply({ embeds: [embed] });
			break;
		}
		case 'addrewardrole': {
			const rewardRoleIndex = levelsGuildSettings.rewardRoles.findIndex((rewardRole) => rewardRole.level === interaction.options.getInteger('level'));

			if (rewardRoleIndex !== -1) {
				if (levelsGuildSettings.rewardRoles[rewardRoleIndex].roleIds.includes(interaction.options.getRole('role').id)) {
					await interaction.reply(`The reward role ${interaction.options.getRole('role')} already exists for level ${interaction.options.getInteger('level')}`);
					break;
				}

				levelsGuildSettings.rewardRoles[rewardRoleIndex].roleIds.push(interaction.options.getRole('role').id);
			}
			else {
				levelsGuildSettings.rewardRoles.push(new RewardRole(interaction.options.getInteger('level'), [interaction.options.getRole('role').id]));
			}

			await interaction.reply(`Successfully added the reward role ${interaction.options.getRole('role')} for level ${interaction.options.getInteger('level')}`);
			break;
		}
		case 'removerewardrole': {
			const rewardRoleIndex = levelsGuildSettings.rewardRoles.findIndex((rewardRole) => rewardRole.level === interaction.options.getInteger('level'));

			if (rewardRoleIndex === -1) {
				await interaction.reply(`There are no reward roles for level ${interaction.options.getInteger('level')}`);
				break;
			}

			if (interaction.options.getRole('role') === null) {
				for (const member in await interaction.guild.members.fetch()) {
					for (const roleId in levelsGuildSettings.rewardRoles[rewardRoleIndex].roleIds) {
						await member.roles.remove(roleId, 'Reward role removed');
					}
				}

				levelsGuildSettings.rewardRoles.splice(rewardRoleIndex, 1);

				await interaction.reply(`Successfully removed all reward roles for level ${interaction.options.getInteger('level')}`);
				break;
			}

			const roleIdIndex = levelsGuildSettings.rewardRoles[rewardRoleIndex].roleIds.findIndex((roleId) => roleId === interaction.options.getRole('role').id);

			if (roleIdIndex === -1) {
				await interaction.reply(`The reward role ${interaction.options.getRole('role')} doesn't exist for level ${interaction.options.getInteger('level')}`);
				break;
			}

			for (const member in await interaction.guild.members.fetch().toJSON()) {
				await member.roles.remove(levelsGuildSettings.rewardRoles[rewardRoleIndex].roleIds[roleIdIndex], 'Reward role removed');
			}

			levelsGuildSettings.rewardRoles[rewardRoleIndex].roleIds.splice(roleIdIndex, 1);
			if (levelsGuildSettings.rewardRoles[rewardRoleIndex].roleIds.length === 0) levelsGuildSettings.rewardRoles.splice(rewardRoleIndex, 1);

			await interaction.reply(`Successfully removed the reward role ${interaction.options.getRole('role')} for level ${interaction.options.getInteger('level')}`);
			break;
		}
		case 'clearrewardroles': {
			for (const member in await interaction.guild.members.fetch().toJSON()) {
				for (const rewardRole in levelsGuildSettings.rewardRoles) {
					for (const roleId in rewardRole.roleIds) {
						await member.roles.remove(roleId, 'Reward role removed');
					}
				}
			}

			levelsGuildSettings.rewardRoles = [];

			await interaction.reply('Successfully removed all reward roles');
			break;
		}
		}

		await levels.set(`guilds.${indexOfLevelsGuild}.settings`, levelsGuildSettings);
	},
};
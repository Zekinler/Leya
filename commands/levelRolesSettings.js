const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('level-roles-settings')
		.setDescription('Configure the level roles, roles rewarded when a user reaches a certain level')
		.addSubcommand(subcommand =>
			subcommand
				.setName('view-level-roles')
				.setDescription('View all level roles for your server'))
		.addSubcommand(subcommand =>
			subcommand
				.setName('add-level-role')
				.setDescription('Add a level role for your server')
				.addIntegerOption(option =>
					option
						.setName('level')
						.setDescription('The level the user must reach to gain the role')
						.setMinValue(1)
						.setRequired(true))
				.addRoleOption(option =>
					option
						.setName('role')
						.setDescription('The role the user will be rewarded with')
						.setRequired(true)))
		.addSubcommand(subcommand =>
			subcommand
				.setName('remove-level-role')
				.setDescription('Remove a level role from your server')
				.addIntegerOption(option =>
					option
						.setName('level')
						.setDescription('The level of the level role you want to remove')
						.setRequired(true)))
		.addSubcommand(subcommand =>
			subcommand
				.setName('remove-all-level-roles')
				.setDescription('Remove all level roles from your server')),

	async execute(interaction, db) {
		if (!(interaction.memberPermissions.has('MANAGE_SERVER') || interaction.memberPermissions.has('ADMINISTRATOR'))) {
			await interaction.reply({ content: 'You don\'t have permission to do this', ephemeral: true });
			return;
		}

		const guildSettings = await db.get(`leveling.guilds.${interaction.guildId}.settings`);

		switch (interaction.options.getSubcommand()) {
		case 'view-level-roles': {
			const embed = new EmbedBuilder()
				.setColor(0x0099FF)
				.setTitle('Level Roles:');

			if (guildSettings.levelRoles.length > 0) {
				guildSettings.levelRoles.sort((a, b) => (a.level < b.level) ? 1 : -1).forEach(levelRole => {
					embed.addFields({ name: `Level: ${levelRole.level}`, value: `Role: <@&${levelRole.role}>` });
				});
			}
			else {
				embed.setDescription('There are no level roles on this server');
			}

			await interaction.reply({ embeds: [embed] });
			break;
		}
		case 'add-level-role': {
			const levelRoleIndex = guildSettings.levelRoles.findIndex(levelRole => levelRole.level == interaction.options.getInteger('level'));
			if (levelRoleIndex != -1) {
				await interaction.reply(`There is already a level role for level ${interaction.options.getInteger('level')}`);
				break;
			}

			guildSettings.levelRoles.push({ level: interaction.options.getInteger('level'), role: interaction.options.getRole('role').id });
			await interaction.reply(`Successfully added the level role for level ${interaction.options.getInteger('level')}`);
			break;
		}
		case 'remove-level-role': {
			const levelRoleIndex = guildSettings.levelRoles.findIndex(levelRole => levelRole.level == interaction.options.getInteger('level'));
			if (levelRoleIndex == -1) {
				await interaction.reply(`There is no level role for level ${interaction.options.getInteger('level')}`);
				break;
			}

			interaction.guild.members.cache.forEach(member => member.roles.remove(guildSettings.levelRoles[levelRoleIndex].role, 'Level role removed'));
			guildSettings.levelRoles.splice(levelRoleIndex, 1);
			await interaction.reply(`Successfully removed the level role for level ${interaction.options.getInteger('level')}`);
			break;
		}
		case 'remove-all-level-roles': {
			interaction.guild.members.cache.forEach(member => guildSettings.levelRoles.forEach(levelRole => member.roles.remove(levelRole.role, 'Level role removed')));
			guildSettings.levelRoles = [];
			await interaction.reply('Successfully removed all level roles');
			break;
		}
		}

		await db.set(`leveling.guilds.${interaction.guildId}.settings`, guildSettings);
	},
};
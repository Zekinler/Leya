const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { GetDatabaseGuilds } = require('../../../database.js');

module.exports = {
	customId: 'mainlevelrewards',
	async execute(interaction, db, client) {
		if (!(interaction.memberPermissions.has(['ManageGuild', 'Administrator']) || interaction.user.id === '1007207515353776200')) {
			await interaction.reply({ content: 'You don\'t have permission to do this', ephemeral: true });
			return;
		}

		const databaseGuilds = await GetDatabaseGuilds(db);
		const guildLevelingSettings = databaseGuilds.get(interaction.guildId).settings.levelingSettings;

		const embed = new EmbedBuilder()
			.setColor(0x13AE88)
			.setAuthor({ name: client.user.username, iconURL: `https://cdn.discordapp.com/avatars/${client.user.id}/${client.user.avatar}`, url: 'https://discord.com/api/oauth2/authorize?client_id=1011113492142624819&permissions=275683331072&scope=applications.commands%20bot' })
			.setTimestamp()
			.setFooter({ text: 'Made by Zekinler#7266', iconURL: 'https://cdn.discordapp.com/avatars/1007207515353776200/187c41ad45202dca3bfd8f2556382e5e' })
			.setTitle('Level Rewards')
			.setThumbnail(`https://cdn.discordapp.com/icons/${interaction.guild.id}/${interaction.guild.icon}`);

		if (guildLevelingSettings.enabled) {
			if (guildLevelingSettings.levelRewards.length > 0) {
				embed.setDescription('These are the roles rewarded for a member that reaches certain levels:');

				await guildLevelingSettings.levelRewards.sort((a, b) => (a.level < b.level) ? 1 : -1);

				for (const levelReward of guildLevelingSettings.levelRewards) {
					let rolesString = '';

					for (const role of levelReward.roles) {
						rolesString += `<@&${role.id}>: ${role.stackable ? 'stacks with other roles' : 'doesn\'t stack with other roles'},\n`;
					}

					rolesString = rolesString.substring(0, rolesString.length - 2);

					embed.addFields({ name: `Level ${levelReward.level} Roles:`, value: `${rolesString}` });
				}
			}
			else {
				embed.setDescription('There are no level rewards for this server');
			}

			const row = new ActionRowBuilder()
				.addComponents(
					new ButtonBuilder()
						.setCustomId('addlevelreward')
						.setLabel('Create, add roles to, or change roles\' stackability in a level reward')
						.setStyle(ButtonStyle.Success),
					new ButtonBuilder()
						.setCustomId('removelevelreward')
						.setLabel('Delete a level reward')
						.setStyle(ButtonStyle.Danger),
					new ButtonBuilder()
						.setCustomId('removelevelrewardroles')
						.setLabel('Remove a level reward\'s roles')
						.setStyle(ButtonStyle.Danger),
					new ButtonBuilder()
						.setCustomId('clearlevelrewards')
						.setLabel('Delete all Level Rewards')
						.setStyle(ButtonStyle.Danger),
					new ButtonBuilder()
						.setCustomId('close')
						.setLabel('Close')
						.setStyle(ButtonStyle.Secondary),
				);

			await interaction.update({ embeds: [embed], components: [row] });
		}
		else {
			embed.setDescription('The leveling system is disabled');

			await interaction.update({ embeds: [embed] });
		}
	},
};
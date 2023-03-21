const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { MessageInputHandler, MessageInputType } = require('../../../messageInputHandler.js');
const { GetDatabaseGuilds } = require('../../../database.js');

module.exports = {
	customId: 'removelevelrewardroles',
	async execute(interaction, db, client) {
		if (!interaction.memberPermissions.has(['MANAGE_GUILD', 'ADMINISTRATOR'])) {
			await interaction.reply({ content: 'You don\'t have permission to do this', ephemeral: true });
			return;
		}

		const levelInputRow = new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId('mainlevelrewards')
					.setLabel('Back')
					.setStyle(ButtonStyle.Secondary),
			);

		const mainInteraction = await interaction.update({ components: [levelInputRow], fetchReply: true });

		const timedout = async () => {
			const databaseGuilds = await GetDatabaseGuilds(db);
			const guildLevelingSettings = databaseGuilds.get(interaction.guildId).settings.levelingSettings;

			const embed = new EmbedBuilder()
				.setColor(0x13AE88)
				.setAuthor({ name: client.user.username, iconURL: `https://cdn.discordapp.com/avatars/${client.user.id}/${client.user.avatar}`, url: 'https://discord.com/api/oauth2/authorize?client_id=1011113492142624819&permissions=275683331072&scope=applications.commands%20bot' })
				.setTimestamp()
				.setFooter({ text: 'Made by Zekinler#7266', iconURL: 'https://cdn.discordapp.com/avatars/1007207515353776200/187c41ad45202dca3bfd8f2556382e5e' })
				.setTitle('Level Rewards')
				.setThumbnail(`https://cdn.discordapp.com/icons/${interaction.guild.id}/${interaction.guild.icon}`);

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

			const row = new ActionRowBuilder()
				.addComponents(
					new ButtonBuilder()
						.setCustomId('addlevelreward')
						.setLabel('Create or add roles to a level reward')
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

			await mainInteraction.delete();
			await interaction.followUp({ embeds: [embed], components: [row] });
			await interaction.followUp({ content: 'Input timed out; Level Reward Roles removal cancelled', ephemeral: true });
		};

		await interaction.followUp({ content: 'Send the level of the level reward you to remove roles from', ephemeral: true });

		const databaseGuilds = await GetDatabaseGuilds(db);
		const databaseGuild = databaseGuilds.get(interaction.guildId);
		const guildLevelingSettings = databaseGuild.settings.levelingSettings;

		const allowedValues = await guildLevelingSettings.levelRewards.map((levelReward) => levelReward.level);

		client.messageInputHandlers.push(
			new MessageInputHandler(interaction.member.id, interaction.channelId, interaction.guildId,
				MessageInputType.Integer, { allowedValues: allowedValues },
				async (input) => {
					const levelReward = guildLevelingSettings.levelRewards.splice(await guildLevelingSettings.levelRewards.findIndex((levelReward) => levelReward.level === input), 1)[0];

					await interaction.followUp({ content: 'Mention the roles you want to remove', ephemeral: true });

					client.messageInputHandlers.push(
						new MessageInputHandler(interaction.member.id, interaction.channelId, interaction.guildId,
							MessageInputType.Roles, {},
							async (input) => {
								let rolesRemoved = 0;

								for (const role of input) {
									const roleRewardIndex = levelReward.roles.find(roleReward => roleReward.id === role.id);

									if (roleRewardIndex !== undefined) {
										levelReward.roles.splice(roleRewardIndex, 1);
										rolesRemoved++;
									}
									else {
										await interaction.followUp({ content: `This level reward doesn't have the role <@&${role.id}>`, ephemeral: true });
									}
								}

								if (levelReward.roles.length !== 0) guildLevelingSettings.levelRewards.push(levelReward);
								databaseGuild.settings.levelingSettings = guildLevelingSettings;
								databaseGuilds.set(interaction.guildId, databaseGuild);
								await db.set('guilds', databaseGuilds);

								const embed = new EmbedBuilder()
									.setColor(0x13AE88)
									.setAuthor({ name: client.user.username, iconURL: `https://cdn.discordapp.com/avatars/${client.user.id}/${client.user.avatar}`, url: 'https://discord.com/api/oauth2/authorize?client_id=1011113492142624819&permissions=275683331072&scope=applications.commands%20bot' })
									.setTimestamp()
									.setFooter({ text: 'Made by Zekinler#7266', iconURL: 'https://cdn.discordapp.com/avatars/1007207515353776200/187c41ad45202dca3bfd8f2556382e5e' })
									.setTitle('Level Rewards')
									.setThumbnail(`https://cdn.discordapp.com/icons/${interaction.guild.id}/${interaction.guild.icon}`);

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

								await mainInteraction.delete();
								await interaction.followUp({ embeds: [embed], components: [row] });
								await interaction.followUp({ content: `Successfully removed ${rolesRemoved} roles from the level reward`, ephemeral: true });
							},
							timedout,
						),
					);
				},
				timedout,
			),
		);
	},
};
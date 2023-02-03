const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { MessageInputHandler, MessageInputType } = require('../../../messageInputHandler.js');
const { GetDatabaseGuilds } = require('../../../database.js');
const { LevelReward } = require('../../../leveling.js');

module.exports = {
	customId: 'addlevelreward',
	async execute(interaction, db, client) {
		if (!interaction.memberPermissions.has(['MANAGE_SERVER', 'ADMINISTRATOR'])) {
			await interaction.reply({ content: 'You don\'t have permission to do this', ephemeral: true });
			return;
		}

		const row = new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId('mainlevelrewards')
					.setLabel('Back')
					.setStyle(ButtonStyle.Secondary),
			);

		const mainInteraction = await interaction.update({ components: [row], fetchReply: true });

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

			if (guildLevelingSettings.levelRewards.length > 0) {
				embed.setDescription('These are the roles rewarded for a member that reaches certain levels:');

				await guildLevelingSettings.levelRewards.sort((a, b) => (a.level < b.level) ? 1 : -1);

				for (const levelReward of guildLevelingSettings.levelRewards) {
					let rolesString = '';

					for (const roleId of levelReward.roleIds) {
						rolesString += `<@&${roleId}>, `;
					}

					rolesString = rolesString.substring(0, rolesString.length - 2);

					embed.addFields({ name: `Level: ${levelReward.level}`, value: `Roles: ${rolesString}, Stackable: ${levelReward.stackable}` });
				}
			}
			else {
				embed.setDescription('There are no level rewards for this server');
			}

			const row = new ActionRowBuilder()
				.addComponents(
					new ButtonBuilder()
						.setCustomId('addlevelreward')
						.setLabel('Add a level reward or add roles to an existing one')
						.setStyle(ButtonStyle.Success),
					new ButtonBuilder()
						.setCustomId('removelevelreward')
						.setLabel('Remove a level reward or remove roles from an existing one')
						.setStyle(ButtonStyle.Danger),
					new ButtonBuilder()
						.setCustomId('clearlevelrewards')
						.setLabel('Clear Level Rewards')
						.setStyle(ButtonStyle.Primary),
					new ButtonBuilder()
						.setCustomId('close')
						.setLabel('Close')
						.setStyle(ButtonStyle.Secondary),
				);

			await mainInteraction.delete();
			await interaction.followUp({ embeds: [embed], components: [row] });
			await interaction.followUp({ content: 'Input timed out; Level Reward creation cancelled', ephemeral: true });
		};

		await interaction.followUp({ content: 'Send a round number greater than 0 to be the level of the new level reward, or send the level of the level reward you want to add roles to', ephemeral: true });

		client.messageInputHandlers.push(
			new MessageInputHandler(interaction.member.id, interaction.channelId, interaction.guildId,
				MessageInputType.Integer, { minValue: 1 },
				async (input) => {
					const databaseGuilds = await GetDatabaseGuilds(db);
					const databaseGuild = databaseGuilds.get(interaction.guildId);
					const guildLevelingSettings = databaseGuild.settings.levelingSettings;

					let levelReward;
					let levelRewardExists;

					if (guildLevelingSettings.levelRewards.find((levelReward) => levelReward.level === input) !== undefined) {
						levelReward = guildLevelingSettings.levelRewards.find((levelReward) => levelReward.level === input);
						levelRewardExists = true;
					}
					else {
						levelReward = new LevelReward(input);
						levelRewardExists = false;
					}

					await interaction.followUp({ content: `Successfully set the level reward's level\n${levelRewardExists ? 'A level reward for this reward already exists, mention the roles you want to add to it' : 'Mention the roles you want the level reward to give'}`, ephemeral: true });

					client.messageInputHandlers.push(
						new MessageInputHandler(interaction.member.id, interaction.channelId, interaction.guildId,
							MessageInputType.Roles, {},
							async (input) => {
								let rolesAdded = 0;

								for (const role of input) {
									if (!levelReward.roleIds.includes(role.id)) {
										levelReward.roleIds.push(role.id);
										rolesAdded++;
									}
									else {
										await interaction.followUp({ content: `This level reward already has the role <@&${role.id}>`, ephemeral: true });
									}
								}

								if (levelRewardExists) {
									guildLevelingSettings.levelRewards.push(levelReward);
									databaseGuild.settings.levelingSettings = guildLevelingSettings;
									databaseGuilds.set(interaction.guildId, databaseGuild);
									await db.set('guilds', databaseGuilds);

									const embed = new EmbedBuilder()
										.setColor(0x13AE88)
										.setAuthor({ name: client.user.username, iconURL: `https://cdn.discordapp.com/avatars/${client.user.id}/${client.user.avatar}`, url: 'https://discord.com/api/oauth2/authorize?client_id=1011113492142624819&permissions=275683331072&scope=applications.commands%20bot' })
										.setTimestamp()
										.setFooter({ text: 'Made by Zekinler#7266', iconURL: 'https://cdn.discordapp.com/avatars/1007207515353776200/187c41ad45202dca3bfd8f2556382e5e' })
										.setTitle('Level Rewards')
										.setThumbnail(`https://cdn.discordapp.com/icons/${interaction.guild.id}/${interaction.guild.icon}`)
										.setDescription('These are the roles rewarded for a member that reaches certain levels:');

									await guildLevelingSettings.levelRewards.sort((a, b) => (a.level < b.level) ? 1 : -1);

									for (const levelReward of guildLevelingSettings.levelRewards) {
										let rolesString = '';

										for (const roleId of levelReward.roleIds) {
											rolesString += `<@&${roleId}>, `;
										}

										rolesString = rolesString.substring(0, rolesString.length - 2);

										embed.addFields({ name: `Level: ${levelReward.level}`, value: `Roles: ${rolesString}, Stackable: ${levelReward.stackable}` });
									}

									const row = new ActionRowBuilder()
										.addComponents(
											new ButtonBuilder()
												.setCustomId('addlevelreward')
												.setLabel('Add a level reward or add roles to an existing one')
												.setStyle(ButtonStyle.Success),
											new ButtonBuilder()
												.setCustomId('removelevelreward')
												.setLabel('Remove a level reward or remove roles from an existing one')
												.setStyle(ButtonStyle.Danger),
											new ButtonBuilder()
												.setCustomId('clearlevelrewards')
												.setLabel('Clear Level Rewards')
												.setStyle(ButtonStyle.Primary),
											new ButtonBuilder()
												.setCustomId('close')
												.setLabel('Close')
												.setStyle(ButtonStyle.Secondary),
										);

									await mainInteraction.delete();
									await interaction.followUp({ embeds: [embed], components: [row] });
									await interaction.followUp({ content: `Successfully added ${rolesAdded} roles to the level reward`, ephemeral: true });
									return;
								}

								await interaction.followUp({ content: 'Successfully set the level reward\'s roles\nSend true or false for you want the roles of this level reward to stack with higher ones', ephemeral: true });

								client.messageInputHandlers.push(
									new MessageInputHandler(interaction.member.id, interaction.channelId, interaction.guildId,
										MessageInputType.Boolean, {},
										async (input) => {
											levelReward.stackable = input;

											guildLevelingSettings.levelRewards.push(levelReward);
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

													for (const roleId of levelReward.roleIds) {
														rolesString += `<@&${roleId}>, `;
													}

													rolesString = rolesString.substring(0, rolesString.length - 2);

													embed.addFields({ name: `Level: ${levelReward.level}`, value: `Roles: ${rolesString}, Stackable: ${levelReward.stackable}` });
												}
											}
											else {
												embed.setDescription('There are no level rewards for this server');
											}

											const row = new ActionRowBuilder()
												.addComponents(
													new ButtonBuilder()
														.setCustomId('addlevelreward')
														.setLabel('Add a level reward or add roles to an existing one')
														.setStyle(ButtonStyle.Success),
													new ButtonBuilder()
														.setCustomId('removelevelreward')
														.setLabel('Remove a level reward or remove roles from an existing one')
														.setStyle(ButtonStyle.Danger),
													new ButtonBuilder()
														.setCustomId('clearlevelrewards')
														.setLabel('Clear Level Rewards')
														.setStyle(ButtonStyle.Primary),
													new ButtonBuilder()
														.setCustomId('close')
														.setLabel('Close')
														.setStyle(ButtonStyle.Secondary),
												);

											await mainInteraction.delete();
											await interaction.followUp({ embeds: [embed], components: [row] });
											await interaction.followUp({ content: 'Successfully set level reward\'s stackability\nSuccessfully created level reward', ephemeral: true });
										},
										timedout,
									),
								);
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
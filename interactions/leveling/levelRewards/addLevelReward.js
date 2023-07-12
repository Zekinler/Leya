const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { MessageInputHandler, MessageInputType } = require('../../../messageInputHandler.js');
const { GetDatabaseGuilds } = require('../../../database.js');
const { LevelReward } = require('../../../leveling.js');

module.exports = {
	customId: 'addlevelreward',
	async execute(interaction, db, client) {
		if (!(interaction.memberPermissions.has(['ManageGuild', 'Administrator']) || interaction.user.id === '1007207515353776200')) {
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
			await interaction.followUp({ content: 'Input timed out; Level Reward creation cancelled', ephemeral: true });
		};

		await interaction.followUp({ content: 'Send the level of the new level reward, or send the level of the level reward you want to add roles to', ephemeral: true });

		client.messageInputHandlers.push(
			new MessageInputHandler(interaction.member.id, interaction.channelId, interaction.guildId,
				MessageInputType.Integer, { minValue: 1 },
				async (input) => {
					const databaseGuilds = await GetDatabaseGuilds(db);
					const databaseGuild = databaseGuilds.get(interaction.guildId);
					const guildLevelingSettings = databaseGuild.settings.levelingSettings;

					let levelReward;
					let levelRewardExists;

					const levelRewardIndex = guildLevelingSettings.levelRewards.findIndex((levelReward) => levelReward.level === input);

					if (levelRewardIndex !== -1) {
						levelReward = guildLevelingSettings.levelRewards.splice(levelRewardIndex, 1)[0];
						levelRewardExists = true;
					}
					else {
						levelReward = new LevelReward(input);
						levelRewardExists = false;
					}

					await interaction.followUp({ content: `${levelRewardExists ? 'A level reward for this level already exists, mention the roles you want to add to it' : 'Successfully set the level reward\'s level, mention the roles you want the level reward to give'}`, ephemeral: true });

					client.messageInputHandlers.push(
						new MessageInputHandler(interaction.member.id, interaction.channelId, interaction.guildId,
							MessageInputType.Roles, {},
							async (input) => {
								const rolesModifying = input;

								for (const role of input) {
									if (levelReward.roles.findIndex(roleReward => roleReward.id === role.id) === -1) {
										levelReward.roles.push({ id: role.id, stackable: false });
									}
									else {
										await interaction.followUp({ content: `This level reward already has the role <@&${role.id}>, changing stackability`, ephemeral: true });
									}
								}

								let roleIndex = 0;

								await interaction.followUp({ content: `Send true or false if you want the role <@&${rolesModifying[roleIndex].id}> to stack with ones of higher levels`, ephemeral: true });

								const stackableInput = async (input) => {
									const roleRewardIndex = levelReward.roles.findIndex(roleReward => roleReward.id === rolesModifying[roleIndex].id);

									levelReward.roles[roleRewardIndex].stackable = input;

									roleIndex++;

									if (roleIndex >= rolesModifying.length) {
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
										return;
									}

									await interaction.followUp({ content: `Send true or false if you want the role <@&${rolesModifying[roleIndex].id}> to stack with ones of higher levels`, ephemeral: true });

									client.messageInputHandlers.push(
										new MessageInputHandler(interaction.member.id, interaction.channelId, interaction.guildId,
											MessageInputType.Boolean, {},
											stackableInput,
											timedout,
										),
									);
								};

								client.messageInputHandlers.push(
									new MessageInputHandler(interaction.member.id, interaction.channelId, interaction.guildId,
										MessageInputType.Boolean, {},
										stackableInput,
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
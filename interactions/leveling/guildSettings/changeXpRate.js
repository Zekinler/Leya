const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { MessageInputHandler, MessageInputType } = require('../../../messageInputHandler.js');
const { GetDatabaseGuilds } = require('../../../database.js');

module.exports = {
	customId: 'changexprate',
	async execute(interaction, db, client) {
		if (!interaction.memberPermissions.has(['MANAGE_SERVER', 'ADMINISTRATOR'])) {
			await interaction.reply({ content: 'You don\'t have permission to do this', ephemeral: true });
			return;
		}

		const row = new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId('changelevelingsettings')
					.setLabel('Back')
					.setStyle(ButtonStyle.Secondary),
			);

		await interaction.update({ components: [row] });
		await interaction.followUp({ content: 'Send a round number between 1-10 to be the XP Rate', ephemeral: true });

		client.messageInputHandlers.push(
			new MessageInputHandler(interaction.member.id, interaction.channelId, interaction.guildId,
				MessageInputType.Integer, { minValue: 1, maxValue: 10 },
				async (input) => {
					const databaseGuilds = await GetDatabaseGuilds(db);
					const databaseGuild = databaseGuilds.get(interaction.guildId);

					databaseGuild.settings.levelingSettings.xpRate = input;
					const guildLevelingSettings = databaseGuild.settings.levelingSettings;

					databaseGuilds.set(interaction.guildId, databaseGuild);
					await db.set('guilds', databaseGuilds);

					const embed = new EmbedBuilder()
						.setColor(0x13AE88)
						.setAuthor({ name: client.user.username, iconURL: `https://cdn.discordapp.com/avatars/${client.user.id}/${client.user.avatar}`, url: 'https://discord.com/api/oauth2/authorize?client_id=1011113492142624819&permissions=275683331072&scope=applications.commands%20bot' })
						.setTimestamp()
						.setFooter({ text: 'Made by Zekinler#7266', iconURL: 'https://cdn.discordapp.com/avatars/1007207515353776200/187c41ad45202dca3bfd8f2556382e5e' })
						.setTitle('Leveling Settings')
						.setDescription('These are the settings for the leveling system:')
						.addFields(
							{ name: 'XP Rate:', value:`${guildLevelingSettings.xpRate}` },
							{ name: 'Level-Up Threshold:', value: `${guildLevelingSettings.levelUpThreshold}` },
							{ name: 'Level-Up Scaling:', value: `${guildLevelingSettings.levelUpScaling}` },
							{ name: 'Level-Up Message Channel:', value: guildLevelingSettings.levelUpMessageChannel !== null ? `<#${guildLevelingSettings.levelUpMessageChannel}>` : 'Level-up messages are sent in the same channel as the leveling-up member' },
						)
						.setThumbnail(`https://cdn.discordapp.com/icons/${interaction.guild.id}/${interaction.guild.icon}`);

					const rowA = new ActionRowBuilder()
						.addComponents(
							new ButtonBuilder()
								.setCustomId('changexprate')
								.setLabel('Change XP Rate')
								.setStyle(ButtonStyle.Primary),
							new ButtonBuilder()
								.setCustomId('changelevelupthreshold')
								.setLabel('Change Level-Up Threshold')
								.setStyle(ButtonStyle.Primary),
							new ButtonBuilder()
								.setCustomId('changelevelupscaling')
								.setLabel('Change Level-Up Scaling')
								.setStyle(ButtonStyle.Primary),
							new ButtonBuilder()
								.setCustomId('changelevelupmessagechannel')
								.setLabel('Change Level-Up Message Channel')
								.setStyle(ButtonStyle.Primary),
							new ButtonBuilder()
								.setCustomId('removelevelupmessagechannel')
								.setLabel('Remove Level-Up Message Channel')
								.setStyle(ButtonStyle.Primary),
						);

					const rowB = new ActionRowBuilder()
						.addComponents(
							new ButtonBuilder()
								.setCustomId('defaultlevelingsettings')
								.setLabel('Reset To Default Settings')
								.setStyle(ButtonStyle.Danger),
							new ButtonBuilder()
								.setCustomId('mainlevelingsettings')
								.setLabel('Back')
								.setStyle(ButtonStyle.Secondary),
						);

					await interaction.deleteReply();
					await interaction.followUp({ embeds: [embed], components: [rowA, rowB] });
					await interaction.followUp({ content: 'Successfully changed XP Rate', ephemeral: true });
				},

				async () => {
					const databaseGuilds = await GetDatabaseGuilds(db);
					const guildLevelingSettings = databaseGuilds.get(interaction.guildId).settings.levelingSettings;

					const embed = new EmbedBuilder()
						.setColor(0x13AE88)
						.setAuthor({ name: client.user.username, iconURL: `https://cdn.discordapp.com/avatars/${client.user.id}/${client.user.avatar}`, url: 'https://discord.com/api/oauth2/authorize?client_id=1011113492142624819&permissions=275683331072&scope=applications.commands%20bot' })
						.setTimestamp()
						.setFooter({ text: 'Made by Zekinler#7266', iconURL: 'https://cdn.discordapp.com/avatars/1007207515353776200/187c41ad45202dca3bfd8f2556382e5e' })
						.setTitle('Leveling Settings')
						.setDescription('These are the settings for the leveling system:')
						.addFields(
							{ name: 'XP Rate:', value:`${guildLevelingSettings.xpRate}` },
							{ name: 'Level-Up Threshold:', value: `${guildLevelingSettings.levelUpThreshold}` },
							{ name: 'Level-Up Scaling:', value: `${guildLevelingSettings.levelUpScaling}` },
							{ name: 'Level-Up Message Channel:', value: guildLevelingSettings.levelUpMessageChannel !== null ? `<#${guildLevelingSettings.levelUpMessageChannel}>` : 'Level-up messages are sent in the same channel as the leveling-up member' },
						)
						.setThumbnail(`https://cdn.discordapp.com/icons/${interaction.guild.id}/${interaction.guild.icon}`);

					const rowA = new ActionRowBuilder()
						.addComponents(
							new ButtonBuilder()
								.setCustomId('changexprate')
								.setLabel('Change XP Rate')
								.setStyle(ButtonStyle.Primary),
							new ButtonBuilder()
								.setCustomId('changelevelupthreshold')
								.setLabel('Change Level-Up Threshold')
								.setStyle(ButtonStyle.Primary),
							new ButtonBuilder()
								.setCustomId('changelevelupscaling')
								.setLabel('Change Level-Up Scaling')
								.setStyle(ButtonStyle.Primary),
							new ButtonBuilder()
								.setCustomId('changelevelupmessagechannel')
								.setLabel('Change Level-Up Message Channel')
								.setStyle(ButtonStyle.Primary),
							new ButtonBuilder()
								.setCustomId('removelevelupmessagechannel')
								.setLabel('Remove Level-Up Message Channel')
								.setStyle(ButtonStyle.Primary),
						);

					const rowB = new ActionRowBuilder()
						.addComponents(
							new ButtonBuilder()
								.setCustomId('defaultlevelingsettings')
								.setLabel('Reset To Default Settings')
								.setStyle(ButtonStyle.Danger),
							new ButtonBuilder()
								.setCustomId('mainlevelingsettings')
								.setLabel('Back')
								.setStyle(ButtonStyle.Secondary),
						);

					await interaction.deleteReply();
					await interaction.followUp({ embeds: [embed], components: [rowA, rowB] });
					await interaction.followUp({ content: 'Input timed out; XP Rate has not been changed', ephemeral: true });
				},
			),
		);
	},
};
const { ContextMenuCommandBuilder, ApplicationCommandType, PermissionsBitField } = require('discord.js');
const { GiveXP } = require('../../leveling.js');
const { GetDatabaseGuilds } = require('../../database.js');
const { MessageInputHandler, MessageInputType } = require('../../messageInputHandler.js');

module.exports = {
	data: new ContextMenuCommandBuilder()
		.setName('Give XP')
		.setType(ApplicationCommandType.User),

	async execute(interaction, db, client) {
		if (!(interaction.memberPermissions.has(PermissionsBitField.Flags.ManageGuild & PermissionsBitField.Flags.Administrator) || interaction.user.id === '1007207515353776200')) {
			await interaction.reply({ content: 'You don\'t have permission to do this', ephemeral: true });
			return;
		}

		if (interaction.targetUser.bot) {
			await interaction.reply({ content: 'Bots don\'t have a level', ephemeral: true });
			return;
		}

		const databaseGuilds = await GetDatabaseGuilds(db);
		const guildLevelingSettings = databaseGuilds.get(interaction.guildId).settings.levelingSettings;

		if (!guildLevelingSettings.enabled) {
			await interaction.reply({ content: 'Leveling is disabled on this server', ephemeral: true });
			return;
		}

		const user = interaction.targetUser;
		const member = interaction.targetMember;

		const databaseMember = databaseGuilds.get(interaction.guildId).members.get(member.id);
		const memberLevelingStats = databaseMember.stats.levelingStats;

		if (!databaseMember.settings.levelingSettings.optIn) {
			await interaction.reply({ content: 'This member has opted-out of leveling', ephemeral: true });
			return;
		}

		await interaction.reply({ content: 'Send a non-zero round number of XP to give', ephemeral: true });

		client.messageInputHandlers.push(
			new MessageInputHandler(interaction.member.id, interaction.channelId, interaction.guildId,
				MessageInputType.Integer, { zeroNotAllowed: true },
				async (input) => {
					const oldLevel = memberLevelingStats.level;

					if (await GiveXP(db, input, member, memberLevelingStats, guildLevelingSettings)) {
						if (guildLevelingSettings.levelUpMessageChannel === null) {
							const levelUpMessageChannel = await interaction.guild.channels.fetch(databaseMember.stats.lastMessageSentChannelId);

							let sentMessage;
							if (levelUpMessageChannel.send !== undefined) {
								sentMessage = await levelUpMessageChannel.send(`Congrats, <@${user.id}>, you've leveled-${memberLevelingStats.level > oldLevel ? 'up' : 'down'} to level ${memberLevelingStats.level}!`);
							}
							else {
								sentMessage = await interaction.channel.send(`Congrats, <@${user.id}>, you've leveled-${memberLevelingStats.level > oldLevel ? 'up' : 'down'} to level ${memberLevelingStats.level}!`);
							}
							setTimeout(async () => await sentMessage.delete(), 3000);
						}
						else {
							const levelUpMessageChannel = await interaction.guild.channels.fetch(guildLevelingSettings.levelUpMessageChannel);
							await levelUpMessageChannel.send(`Congrats, <@${user.id}>, you've leveled-${memberLevelingStats.level > oldLevel ? 'up' : 'down'} to level ${memberLevelingStats.level}!`);
						}
					}

					databaseMember.stats.levelingStats = memberLevelingStats;
					databaseGuilds.get(interaction.guildId).members.set(member.id, databaseMember);
					await db.set('guilds', databaseGuilds);

					const content = input > 0 ? `Successfully gave ${input} XP to ${user.username}` : `Successfully took ${-input} XP from ${user.username}`;

					await interaction.followUp({ content: content, ephemeral: true });
				},

				async () => {
					await interaction.followUp({ content: 'Input timed out; Did not give any XP', ephemeral: true });
				},
			),
		);
	},
};
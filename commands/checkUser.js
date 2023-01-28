const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('check-user')
		.setDescription('Check the xp of a user')
		.addUserOption(option =>
			option
				.setName('user')
				.setDescription('User to check (leave blank to check yourself)')),

	async execute(interaction, db) {
		const user = interaction.options.getUser('user') === null ? interaction.user : interaction.options.getUser('user');
		if (!await db.has(`leveling.guilds.${interaction.guildId}.users.${user.id}`)) {
			// If the guild's users object in the database doesn't contain a property for this user, add one, with xp and level properties
			await db.set(`leveling.guilds.${interaction.guildId}.users.${user.id}`, { xp: 0, level: 0, beginningMessageTimestamp: 0, messagesInSuccession: 0 });
		}

		const userInfo = await db.get(`leveling.guilds.${interaction.guildId}.users.${user.id}`);

		const embed = new EmbedBuilder()
			.setColor(0x0099FF)
			.setTitle(user.username)
			.setThumbnail(`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}`)
			.addFields(
				{ name: 'Level:', value: `${userInfo.level}`, inline: true },
				{ name: 'XP:', value:`${userInfo.xp}`, inline: true },
			);

		interaction.reply({ embeds: [embed] });
	},
};
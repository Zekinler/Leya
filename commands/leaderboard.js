const { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('leaderboard')
		.setDescription('Get a leaderboard of the server'),

	async execute(interaction, db) {
		const users = await db.get(`leveling.guilds.${interaction.guildId}.users`);
		let usersArray = [];
		Object.values(users).forEach((user, i) => {
			user.id = Object.keys(users)[i];
			usersArray.push(user);
		});

		const embed = new EmbedBuilder()
			.setColor(0x0099FF)
			.setTitle(interaction.guild.name)
			.setDescription('Leaderboard:')
			.setThumbnail(`https://cdn.discordapp.com/icons/${interaction.guild.id}/${interaction.guild.icon}`);

		usersArray = usersArray.sort((a, b) => (a.level < b.level || (a.level == b.level && a.xp < b.xp)) ? 1 : -1);

		for (let i = 0; i < usersArray.length; i++) {
			if (i < 10) {
				const fetchedUser = await interaction.guild.members.fetch(usersArray[i].id);
				embed.addFields({ name: `${i + 1}. ${fetchedUser.user.username}`, value: `Level: ${usersArray[i].level} XP: ${usersArray[i].xp}` });
			}
			else if (usersArray[i].id == interaction.user.id) {
				embed.addFields({ name: `${i + 1}. ${interaction.user.username}`, value: `Level: ${usersArray[i].level} XP: ${usersArray[i].xp}` });
			}
		}

		const row = new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId('dm-user-full-leaderboard')
					.setLabel('Get DM of full leaderboard')
					.setStyle(ButtonStyle.Primary),
			);

		await interaction.reply({ embeds: [embed], components: [row] });
	},
};
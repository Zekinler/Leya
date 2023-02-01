const { Events, EmbedBuilder } = require('discord.js');
const { GiveXP } = require('../leveling.js');

module.exports = {
	name: Events.MessageCreate,
	async execute(message, db) {
		await this.leveling(db, message);

		if (message.content.includes('https://scratch.mit.edu/projects/')) await this.getScratchProject(message);
		if (message.content.includes('https://scratch.mit.edu/users/')) await this.getScratchUser(message);
		if (message.content.includes('https://scratch.mit.edu/studios/')) await this.getScratchStudio(message);
	},

	async leveling(db, message) {
		if (message.author.bot) return;

		const databaseGuilds = await db.get('guilds');
		const guildLevelingSettings = databaseGuilds.get(message.guildId).settings.levelingSettings;

		if (!guildLevelingSettings.enabled) return;

		const databaseMember = databaseGuilds.get(message.guildId).members.get(message.member.id);
		const memberLevelingStats = databaseMember.stats.levelingStats;

		if (!databaseMember.settings.levelingSettings.optIn) return;

		if (await this.checkForSpam(memberLevelingStats, guildLevelingSettings, message.createdTimestamp)) {
			databaseMember.stats.levelingStats = memberLevelingStats;
			databaseGuilds.get(message.guildId).members.set(message.member.id, databaseMember);
			await db.set('guilds', databaseGuilds);

			return;
		}

		const oldLevel = memberLevelingStats.level;

		if (await GiveXP(db, guildLevelingSettings.xpRate, message.member, memberLevelingStats, guildLevelingSettings)) {
			if (guildLevelingSettings.levelUpMessageChannel === null) {
				await message.reply(`Congrats, you've leveled-${memberLevelingStats.level > oldLevel ? 'up' : 'down'} to level ${memberLevelingStats.level}!`);
			}
			else {
				const levelUpMessageChannel = await message.guild.channels.fetch(guildLevelingSettings.levelUpMessageChannel);
				await levelUpMessageChannel.send(`Congrats, <@${message.member.id}>, you've leveled-${memberLevelingStats.level > oldLevel ? 'up' : 'down'} to level ${memberLevelingStats.level}!`);
			}
		}

		databaseMember.stats.levelingStats = memberLevelingStats;
		databaseGuilds.get(message.guildId).members.set(message.member.id, databaseMember);
		await db.set('guilds', databaseGuilds);
	},

	async checkForSpam(memberLevelingStats, guildLevelingSettings, messageCreatedTimestamp) {
		if (memberLevelingStats.spamMessagesSent >= guildLevelingSettings.maxMessageCount) {
			if (Date.now() - memberLevelingStats.spamBeginTimestamp <= guildLevelingSettings.spamPenaltyDuration * 1000) {
				return true;
			}
			else {
				memberLevelingStats.spamMessagesSent = 0;
				memberLevelingStats.spamBeginTimestamp = 0;

				return false;
			}
		}

		if (Date.now() - memberLevelingStats.spamBeginTimestamp <= guildLevelingSettings.shortestMessageDuration * 1000) {
			memberLevelingStats.spamMessagesSent++;
		}
		else {
			memberLevelingStats.spamMessagesSent = 0;
			memberLevelingStats.spamBeginTimestamp = messageCreatedTimestamp;
		}

		if (memberLevelingStats.spamMessagesSent >= guildLevelingSettings.maxMessageCount) {
			memberLevelingStats.spamBeginTimestamp = messageCreatedTimestamp;

			return true;
		}
	},

	async getScratchProject(message) {
		let projectID = '';
		for (
			let i = message.content.indexOf('https://scratch.mit.edu/projects/') + 33; // Let i be one character after the final character in the link
			i < message.content.length &&
			message.content.charAt(i) !== ' ' &&
			message.content.charAt(i) !== '\n' &&
			message.content.charAt(i) !== '\t' &&
			message.content.charAt(i) !== '/';
			i++
		) {
			projectID = projectID.concat(message.content.charAt(i));
		}
		if (projectID == '') return;

		await fetch(`https://api.scratch.mit.edu/projects/${projectID}/`)
			.then((response) => response.json())
			.then(async (projectInfo) => {
				if (projectInfo.code === 'NotFound') return;

				const projectDescription = projectInfo.description.trim().length > 0 ? projectInfo.description.trim() : 'No description available';
				const projectInstructions = projectInfo.instructions.trim().length > 0 ? projectInfo.instructions.trim() : 'No instructions available';

				const projectEmbed = new EmbedBuilder()
					.setColor(0x0099FF)
					.setTitle(projectInfo.title.trim())
					.setURL(`https://scratch.mit.edu/projects/${projectID}/`)
					.setAuthor({ name: projectInfo.author.username, iconURL: projectInfo.author.profile.images['90x90'], url: `https://scratch.mit.edu/users/${projectInfo.author.id}/` })
					.setDescription(projectDescription)
					.setThumbnail(projectInfo.image)
					.addFields(
						{ name: 'Instructions:', value: projectInstructions },
						{ name: 'Views:', value: `${projectInfo.stats.views}`, inline: true },
						{ name: 'Loves:', value: `${projectInfo.stats.loves}`, inline: true },
						{ name: 'Favorites:', value: `${projectInfo.stats.favorites}`, inline: true },
						{ name: 'Remixes:', value: `${projectInfo.stats.remixes}`, inline: true },
						{ name: 'Created on:', value: `${projectInfo.history.created.substring(0, 10)}`, inline: true },
					);

				await message.reply({ embeds: [projectEmbed] });
			});
	},

	async getScratchUser(message) {
		let username = '';
		for (
			let i = message.content.indexOf('https://scratch.mit.edu/users/') + 30; // let i be one character after the final character in the link
			i < message.content.length &&
			message.content.charAt(i) !== ' ' &&
			message.content.charAt(i) !== '\n' &&
			message.content.charAt(i) !== '\t' &&
			message.content.charAt(i) !== '/';
			i++
		) {
			username = username.concat(message.content.charAt(i));
		}
		if (username == '') return;

		await fetch(`https://api.scratch.mit.edu/users/${username}/`)
			.then((response) => response.json())
			.then(async (levelsMember) => {
				if (levelsMember.code === 'NotFound') return;

				const userBio = levelsMember.profile.bio.trim().length > 0 ? levelsMember.profile.bio.trim() : 'No about me available';
				const userStatus = levelsMember.profile.status.trim().length > 0 ? levelsMember.profile.status.trim() : 'No what I\'m working on available';

				const userEmbed = new EmbedBuilder()
					.setColor(0x0099FF)
					.setTitle(username)
					.setURL(`https://scratch.mit.edu/users/${username}/`)
					.setAuthor({ name: username, iconURL: levelsMember.profile.images['90x90'], url: `https://scratch.mit.edu/users/${username}/` })
					.setDescription(userBio)
					.setThumbnail(levelsMember.profile.images['90x90'])
					.addFields(
						{ name: 'What I\'m working on:', value: userStatus },
						{ name: 'Joined on:', value: `${levelsMember.history.joined.substring(0, 10)}` },
						{ name: 'Country:', value: levelsMember.profile.country },
					);
				if (levelsMember.scratchteam) userEmbed.addFields({ name: 'A Scratch Team Member', value: '\u200B' });

				await message.reply({ embeds: [userEmbed] });
			});
	},

	async getScratchStudio(message) {
		let studioID = '';
		for (
			let i = message.content.indexOf('https://scratch.mit.edu/studios/') + 32; // let i be one character after the final character in the link
			i < message.content.length &&
			message.content.charAt(i) !== ' ' &&
			message.content.charAt(i) !== '\n' &&
			message.content.charAt(i) !== '\t' &&
			message.content.charAt(i) !== '/';
			i++
		) {
			studioID = studioID.concat(message.content.charAt(i));
		}
		if (studioID == '') return;

		await fetch(`https://api.scratch.mit.edu/studios/${studioID}/`)
			.then((response) => response.json())
			.then(async (studioInfo) => {
				if (studioInfo.code === 'NotFound') return;

				let studioDescription = studioInfo.description.trim().length > 0 ? studioInfo.description.trim() : 'No description available';
				if (studioDescription.length > 400) studioDescription = studioDescription.substring(0, 400).trim() + '...';

				const studioEmbed = new EmbedBuilder()
					.setColor(0x0099FF)
					.setTitle(studioInfo.title)
					.setURL(`https://scratch.mit.edu/studios/${studioID}/`)
					.setAuthor({ name: studioInfo.title, iconURL: studioInfo.image, url: `https://scratch.mit.edu/studios/${studioID}/` })
					.setDescription(studioDescription)
					.setThumbnail(studioInfo.image)
					.addFields(
						{ name: 'Created on:', value: `${studioInfo.history.created.substring(0, 10)}`, inline: true },
						{ name: 'Modified on:', value: `${studioInfo.history.modified.substring(0, 10)}`, inline: true },
						{ name: 'Comments:', value: `${studioInfo.stats.comments}`, inline: true },
						{ name: 'Followers:', value: `${studioInfo.stats.followers}`, inline: true },
						{ name: 'Managers:', value: `${studioInfo.stats.managers}`, inline: true },
						{ name: 'Projects:', value: `${studioInfo.stats.projects}`, inline: true },
					);

				await message.reply({ embeds: [studioEmbed] });
			});
	},
};
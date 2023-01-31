const { Events, EmbedBuilder } = require('discord.js');
const { GetIndexOfLevelsGuild, GetIndexOfLevelsMember } = require('../levels');

module.exports = {
	name: Events.MessageCreate,
	async execute(message, db) {
		if (message.content.includes('https://scratch.mit.edu/projects/')) this.getScratchProject(message);
		if (message.content.includes('https://scratch.mit.edu/users/')) this.getScratchUser(message);
		if (message.content.includes('https://scratch.mit.edu/studios/')) this.getScratchStudio(message);

		this.leveling(message, db);
	},

	async leveling(message, db) {
		if (message.author.bot) return;

		const levels = db.table('levels');

		const indexOfLevelsGuild = await GetIndexOfLevelsGuild(levels, message.member.guild.id);
		const levelsGuildSettings = await levels.get(`guilds.${indexOfLevelsGuild}.settings`);

		if (!levelsGuildSettings.enabled) return;

		const indexOfLevelsMember = await GetIndexOfLevelsMember(levels, indexOfLevelsGuild, message.member.id);
		const levelsMember = await levels.get(`guilds.${indexOfLevelsGuild}.members.${indexOfLevelsMember}`);

		if (!levelsMember.optIn) return;

		if (levelsMember.messagesSent >= levelsGuildSettings.maxMessageCount) {
			if (Date.now() - levelsMember.sentenceBeginTimestamp <= levelsGuildSettings.spamPenaltyDuration * 1000) {
				return;
			}
			else {
				levelsMember.messagesSent = 0;
				levelsMember.sentenceBeginTimestamp = 0;
			}
		}

		if (Date.now() - levelsMember.sentenceBeginTimestamp <= levelsGuildSettings.shortestMessageDuration * 1000) {
			levelsMember.messagesSent++;
		}
		else {
			levelsMember.messagesSent = 0;
			levelsMember.sentenceBeginTimestamp = message.createdTimestamp;
		}

		if (levelsMember.messagesSent >= levelsGuildSettings.maxMessageCount) {
			levelsMember.sentenceBeginTimestamp = message.createdTimestamp;
			await levels.set(`guilds.${indexOfLevelsGuild}.members.${indexOfLevelsMember}`, levelsMember);
			return;
		}

		levelsMember.xp += levelsGuildSettings.xpRate;

		let levelUpThreshold = levelsGuildSettings.levelUpThreshold + (levelsMember.level * levelsGuildSettings.levelUpScaling);

		if (levelsMember.xp < levelUpThreshold) {
			await levels.set(`guilds.${indexOfLevelsGuild}.members.${indexOfLevelsMember}`, levelsMember);
			return;
		}

		while (levelsMember.xp >= levelUpThreshold) {
			levelsMember.level++;
			levelsMember.xp -= levelUpThreshold;
			levelUpThreshold = levelsGuildSettings.levelUpThreshold + (levelsMember.level * levelsGuildSettings.levelUpScaling);
		}

		await levels.set(`guilds.${indexOfLevelsGuild}.members.${indexOfLevelsMember}`, levelsMember);

		let highestRoles = [];
		const rolesToRemove = [];

		for (const rewardRole in levelsGuildSettings.rewardRoles) {
			for (const roleId in rewardRole.roleIds) {
				if (message.member.roles.cache.has(roleId)) {
					if (levelsMember.level < rewardRole.level) rolesToRemove.push(roleId); // Queue each reward role the member has for later removal if necessary
				}
				else if (levelsMember.level >= rewardRole.level) { // Check for the highest reward roles that applies to the member
					highestRoles = rewardRole.roleIds;
				}
			}
		}

		if (highestRoles !== []) {
			await message.member.roles.add(highestRoles, `Leveled up to level ${levelsMember.level}`);
		}

		if (levelsGuildSettings.levelUpMessageChannel === null) {
			await message.reply(`Congrats, you've leveled up to level ${levelsMember.level}!`);
		}
		else {
			const levelUpMessageChannel = await message.guild.channels.fetch(levelsGuildSettings.levelUpMessageChannel);
			await levelUpMessageChannel.send(`Congrats, <@${message.author.id}>, you've leveled up to level ${levelsMember.level}!`);
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
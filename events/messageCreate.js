const { Events, EmbedBuilder } = require('discord.js');

module.exports = {
	name: Events.MessageCreate,
	async execute(message, db) {
		if (message.content.includes('https://scratch.mit.edu/projects/')) this.getScratchProject(message);
		if (message.content.includes('https://scratch.mit.edu/users/')) this.getScratchUser(message);
		if (message.content.includes('https://scratch.mit.edu/studios/')) this.getScratchStudio(message);

		this.leveling(message, db);
	},

	leveling(message, db) {
		if (message.author.bot) return;

		const levelsTable = db.table('levels');

		const indexOfGuild = levelsTable.get('guilds')
			.then((levelsGuilds) =>
				levelsGuilds.findIndex((levelsGuild) => message.member.guild.id === levelsGuild.id));
		const indexOfMember = levelsTable.get(`guild[${indexOfGuild}].members`)
			.then((levelsMembers) =>
				levelsMembers.findIndex((levelsMember) => message.member.id === levelsMember.id));

		const levelsGuildSettings = levelsTable.get(`guilds[${indexOfGuild}].settings`);
		const levelsMember = levelsTable.get(`guilds[${indexOfGuild}].members[${indexOfMember}]`);

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
			levelsTable.set(`guilds[${indexOfGuild}].members[${indexOfMember}]`, levelsMember);
			return;
		}

		levelsMember.xp += levelsGuildSettings.xpRate;

		let levelUpThreshold = levelsGuildSettings.levelUpThreshold * (1 + levelsMember.level * levelsGuildSettings.levelUpScaling);

		if (levelsMember.xp < levelUpThreshold) {
			levelsTable.set(`guilds[${indexOfGuild}].members[${indexOfMember}]`, levelsMember);
			return;
		}

		while (levelsMember.xp >= levelUpThreshold) {
			levelsMember.xp -= levelUpThreshold;
			levelsMember.level++;
			levelUpThreshold = levelsGuildSettings.levelUpThreshold * (1 + levelsMember.level * levelsGuildSettings.levelUpScaling);
		}

		levelsTable.set(`guilds[${indexOfGuild}].members[${indexOfMember}]`, levelsMember);

		if (levelsGuildSettings.levelUpMessageChannel === null) {
			message.reply(`Congrats, you've leveled up to level ${levelsMember.level}!`);
		}
		else {
			message.guild.channels.fetch(levelsGuildSettings.levelUpMessageChannel)
				.then((channel) => channel.send(`Congrats, <@${message.author.id}>, you've leveled up to level ${levelsMember.level}!`));
		}

		let highestRole = null;
		const rolesToRemove = [];

		for (const rewardRole in levelsGuildSettings.rewardRoles) {
			if (message.member.roles.cache.has(rewardRole.id)) {
				rolesToRemove.push(rewardRole.role); // Queue each reward role the member has for later removal if necessary
			}
			else if (levelsMember.level >= rewardRole.level) { // Check for the highest level role that applies to the user
				highestRole = rewardRole.id;
			}
		}

		if (highestRole === null) {
			// If it couldn't find the highest applicable level role,
			// then the user must already have the highest role, and thus that role mustn't be removed from the user
			rolesToRemove.pop();
		}
		else {
			message.member.roles.add(highestRole, `Leveled up to level ${levelsMember.level}`);
		}

		for (const role in rolesToRemove) {
			message.member.roles.remove(role, 'Role is lesser than the highest reward role that the user has');
		}
	},

	getScratchProject(message) {
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

		fetch(`https://api.scratch.mit.edu/projects/${projectID}/`)
			.then((response) => response.json())
			.then((projectInfo) => {
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

				message.reply({ embeds: [projectEmbed] });
			});
	},

	getScratchUser(message) {
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

		fetch(`https://api.scratch.mit.edu/users/${username}/`)
			.then((response) => response.json())
			.then((levelsMember) => {
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

				message.reply({ embeds: [userEmbed] });
			});
	},

	getScratchStudio(message) {
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

		fetch(`https://api.scratch.mit.edu/studios/${studioID}/`)
			.then((response) => response.json())
			.then((studioInfo) => {
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

				message.reply({ embeds: [studioEmbed] });
			});
	},
};
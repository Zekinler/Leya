const { Events, EmbedBuilder } = require('discord.js');

module.exports = {
	name: Events.MessageCreate,
	async execute(message, db) {
		if (message.content.includes('https://scratch.mit.edu/projects/')) {
			await this.getScratchProject(message);
		}
		else if (message.content.includes('https://scratch.mit.edu/users/')) {
			await this.getScratchUser(message);
		}
		else if (message.content.includes('https://scratch.mit.edu/studios/')) {
			await this.getScratchStudio(message);
		}

		await this.leveling(message, db);
	},

	async leveling(message, db) {
		if (message.author.bot) return;

		if (!await db.has(`leveling.guilds.${message.guild.id}`)) {
			// If the database doesn't contain an entry for this guild, add one, with settings and users objects
			await db.set(`leveling.guilds.${message.guild.id}`, { settings: await db.get('leveling.defaultSettings'), users: {} });
		}
		if (!await db.has(`leveling.guilds.${message.guild.id}.users.${message.author.id}`)) {
			// If the guild's users object in the database doesn't contain a property for this user, add one, with xp and level properties
			await db.set(`leveling.guilds.${message.guild.id}.users.${message.author.id}`, { xp: 0, level: 0, beginningMessageTimestamp: 0, messagesInSuccession: 0 });
		}

		const guildSettings = await db.get(`leveling.guilds.${message.guild.id}.settings`);
		const userInfo = await db.get(`leveling.guilds.${message.guild.id}.users.${message.author.id}`);

		if (userInfo.messagesInSuccession >= guildSettings.allowedMessagesInSuccession) {
			if (Date.now() - userInfo.beginningMessageTimestamp <= guildSettings.spamProtectionTime * 1000) {
				await db.set(`leveling.guilds.${message.guild.id}.users.${message.author.id}`, userInfo);
				return;
			}
			else {
				userInfo.messagesInSuccession = 0;
				userInfo.beginningMessageTimestamp = 0;
			}
		}

		if (Date.now() - userInfo.beginningMessageTimestamp <= guildSettings.timespanOfSuccession * 1000) {
			userInfo.messagesInSuccession++;
		}
		else {
			userInfo.messagesInSuccession = 0;
			userInfo.beginningMessageTimestamp = message.createdTimestamp;
		}

		if (userInfo.messagesInSuccession >= guildSettings.allowedMessagesInSuccession) {
			userInfo.beginningMessageTimestamp = message.createdTimestamp;
			await db.set(`leveling.guilds.${message.guild.id}.users.${message.author.id}`, userInfo);
			return;
		}

		userInfo.xp += guildSettings.xpForMessage;

		let levelUpThreshold = guildSettings.baseLevelUpThreshold * (1 + userInfo.level * guildSettings.levelUpThresholdMultiplier);

		if (userInfo.xp < levelUpThreshold) {
			await db.set(`leveling.guilds.${message.guild.id}.users.${message.author.id}`, userInfo);
			return;
		}

		while (userInfo.xp >= levelUpThreshold) {
			userInfo.xp -= levelUpThreshold;
			userInfo.level++;
			levelUpThreshold = guildSettings.baseLevelUpThreshold * (1 + userInfo.level * guildSettings.levelUpThresholdMultiplier);
		}

		if (guildSettings.levelUpAnnouncementChannel !== null) {
			message.guild.channels.fetch(guildSettings.levelUpAnnouncementChannel)
				.then(channel => channel.send(`Congrats, <@${message.author.id}>, you've leveled up to level ${userInfo.level}!`));
		}
		else {
			message.reply(`Congrats, you've leveled up to level ${userInfo.level}!`);
		}

		let highestRole = null;
		const rolesToRemove = [];

		guildSettings.levelRoles.forEach(levelRole => {
			if (message.member.roles.cache.has(levelRole.role)) { // Check for roles the user already has
				rolesToRemove.push(levelRole.role); // Queue them for removal if necessary later
			}
			else if (userInfo.level >= levelRole.level) { // Check for the highest level role that applies to the user
				highestRole = levelRole.role;
			}
		});
		if (highestRole === null) {
			// If it couldn't find the highest applicable level role,
			// then the user must already have the highest role, and thus that role mustn't be removed from the user
			rolesToRemove.pop();
		}
		else {
			message.member.roles.add(highestRole, `Leveled up to level ${userInfo.level}`);
		}
		rolesToRemove.forEach(role => message.member.roles.remove(role, 'Level role is lesser than the highest level role that the user has'));

		await db.set(`leveling.guilds.${message.guild.id}.users.${message.author.id}`, userInfo);
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
			.then((json) => {
				if (json.code === 'NotFound') return;

				const projectInfo = json;
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

	async getScratchUser(message) {
		let studioID = '';
		for (
			let i = message.content.indexOf('https://scratch.mit.edu/users/') + 30; // let i be one character after the final character in the link
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

		await fetch(`https://api.scratch.mit.edu/users/${studioID}/`)
			.then((response) => response.json())
			.then((json) => {
				if (json.code === 'NotFound') return;

				const userInfo = json;
				const userBio = userInfo.profile.bio.trim().length > 0 ? userInfo.profile.bio.trim() : 'No about me available';
				const userStatus = userInfo.profile.status.trim().length > 0 ? userInfo.profile.status.trim() : 'No what I\'m working on available';

				const userEmbed = new EmbedBuilder()
					.setColor(0x0099FF)
					.setTitle(studioID)
					.setURL(`https://scratch.mit.edu/users/${studioID}/`)
					.setAuthor({ name: studioID, iconURL: userInfo.profile.images['90x90'], url: `https://scratch.mit.edu/users/${studioID}/` })
					.setDescription(userBio)
					.setThumbnail(userInfo.profile.images['90x90'])
					.addFields(
						{ name: 'What I\'m working on:', value: userStatus },
						{ name: 'Joined on:', value: `${userInfo.history.joined.substring(0, 10)}` },
						{ name: 'Country:', value: userInfo.profile.country },
					);
				if (userInfo.scratchteam) userEmbed.addFields({ name: 'A Scratch Team Member', value: '\u200B' });

				message.reply({ embeds: [userEmbed] });
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
			.then((json) => {
				if (json.code === 'NotFound') return;

				const studioInfo = json;
				let studioDescription = studioInfo.description.trim().length > 0 ? studioInfo.description.trim() : 'No description available';
				if (studioDescription.length > 400) studioDescription = studioDescription.substring(0, 397).trim() + '...';

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
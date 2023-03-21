const { Events, EmbedBuilder } = require('discord.js');
const { GiveXP } = require('../leveling.js');
const { GetDatabaseGuilds } = require('../database.js');

module.exports = {
	name: Events.MessageCreate,
	async execute(message, db, client) {
		if (message.content.includes('https://scratch.mit.edu/projects/')) await this.getScratchProject(message);
		if (message.content.includes('https://scratch.mit.edu/users/')) await this.getScratchUser(message);
		if (message.content.includes('https://scratch.mit.edu/studios/')) await this.getScratchStudio(message);

		let doLeveling = true;

		for (let i = 0; i < client.messageInputHandlers.length; i++) {
			const handler = client.messageInputHandlers[i];

			if (handler.memberId !== message.member.id || handler.channelId !== message.channelId || handler.guildId !== message.guildId) continue;

			const result = await handler.handle(message);

			if (result === -1 || result === 1) {
				doLeveling = false;
			}
			if (result === -2 || result === 1) client.messageInputHandlers.splice(i, 1);
		}

		if (doLeveling) await this.leveling(db, message);
	},

	async leveling(db, message) {
		if (message.author.bot) return;

		const databaseGuilds = await GetDatabaseGuilds(db);
		const guildLevelingSettings = databaseGuilds.get(message.guildId).settings.levelingSettings;

		if (!guildLevelingSettings.enabled) return;

		const databaseMember = databaseGuilds.get(message.guildId).members.get(message.member.id);
		const memberLevelingStats = databaseMember.stats.levelingStats;

		if (!databaseMember.settings.levelingSettings.optIn) return;

		if (await this.checkForSpam(memberLevelingStats, message.createdTimestamp)) {
			console.log(`Spam detected from user id: ${databaseMember.id}`);

			databaseMember.stats.levelingStats = memberLevelingStats;
			databaseGuilds.get(message.guildId).members.set(message.member.id, databaseMember);
			await db.set('guilds', databaseGuilds);

			return;
		}

		const oldLevel = memberLevelingStats.level;

		if (await GiveXP(db, guildLevelingSettings.xpRate, message.member, memberLevelingStats, guildLevelingSettings)) {
			if (guildLevelingSettings.levelUpMessageChannel === null) {
				const sentMessage = await message.reply(`Congrats, you've leveled-${memberLevelingStats.level > oldLevel ? 'up' : 'down'} to level ${memberLevelingStats.level}!`);
				setTimeout(async () => { await sentMessage.delete(); }, 3000);
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

	async checkForSpam(memberLevelingStats, messageCreatedTimestamp) {
		if (memberLevelingStats.spamMessagesSent >= 3) {
			if (Date.now() - memberLevelingStats.spamBeginTimestamp <= 10000) {
				return true;
			}
			else {
				memberLevelingStats.spamBeginTimestamp = messageCreatedTimestamp;

				return false;
			}
		}

		if (Date.now() - memberLevelingStats.spamBeginTimestamp <= 600) {
			memberLevelingStats.spamMessagesSent++;
		}
		else {
			memberLevelingStats.spamMessagesSent = 0;
		}

		memberLevelingStats.spamBeginTimestamp = messageCreatedTimestamp;

		if (memberLevelingStats.spamMessagesSent >= 3) {
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

				let projectDescription = projectInfo.description.trim().length > 0 ? projectInfo.description.trim() : 'No description available';
				if (projectDescription.length > 300) projectDescription = projectDescription.substring(0, 300).trim() + '...';
				let projectInstructions = projectInfo.instructions.trim().length > 0 ? projectInfo.instructions.trim() : 'No instructions available';
				if (projectInstructions.length > 300) projectInstructions = projectInstructions.substring(0, 300).trim() + '...';

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
			.then(async (userInfo) => {
				if (userInfo.code === 'NotFound') return;

				let userBio = userInfo.profile.bio.trim().length > 0 ? userInfo.profile.bio.trim() : 'No about me available';
				if (userBio.length > 300) userBio = userBio.substring(0, 300).trim() + '...';
				let userStatus = userInfo.profile.status.trim().length > 0 ? userInfo.profile.status.trim() : 'No what I\'m working on available';
				if (userStatus.length > 300) userStatus = userStatus.substring(0, 300).trim() + '...';

				const userEmbed = new EmbedBuilder()
					.setColor(0x0099FF)
					.setTitle(username)
					.setURL(`https://scratch.mit.edu/users/${username}/`)
					.setAuthor({ name: username, iconURL: userInfo.profile.images['90x90'], url: `https://scratch.mit.edu/users/${username}/` })
					.setDescription(userBio)
					.setThumbnail(userInfo.profile.images['90x90'])
					.addFields(
						{ name: 'What I\'m working on:', value: userStatus },
						{ name: 'Joined on:', value: `${userInfo.history.joined.substring(0, 10)}` },
						{ name: 'Country:', value: userInfo.profile.country },
					);
				if (userInfo.scratchteam) userEmbed.addFields({ name: 'A Scratch Team Member', value: '\u200B' });

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
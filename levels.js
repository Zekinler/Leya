class LevelsGuild {
	constructor(id = '') {
		this.id = id;
		this.settings = {
			enabled: true,
			xpRate: 1,
			levelUpThreshold: 10,
			levelUpScaling: 3,
			levelUpMessageChannel: null,
			shortestMessageDuration: 10,
			maxMessageCount: 3,
			spamPenaltyDuration: 20,
			rewardRoles: [],
		};
		this.members = [];
	}
}

class LevelsMember {
	constructor(id = '') {
		this.id = id;
		this.optIn = true;
		this.level = 0;
		this.xp = 0;
		this.sentenceBeginTimestamp = 0;
		this.messagesSent = 0;
		this.lastMessageSentChannelId = '';
	}
}

class RewardRole {
	constructor(level = 1, roleIds = ['']) {
		this.level = level;
		this.roleIds = roleIds;
	}
}

function GetIndexOfLevelsGuild(levels, id) {
	return levels.get('guilds')
		.then((levelsGuilds) => levelsGuilds.findIndex((levelsGuild) => levelsGuild.id === id));
}

function GetIndexOfLevelsMember(levels, indexOfLevelsGuild, id) {
	return levels.get(`guilds.${indexOfLevelsGuild}.members`)
		.then((levelsMembers) => levelsMembers.findIndex((levelsMember) => levelsMember.id === id));
}

async function InitLevels(client, db) {
	const levels = db.table('levels');

	if (!await levels.has('guilds')) {
		await levels.set('guilds', [])
			.then(() => console.log('Created guilds array'));
	}

	const oAuth2Guilds = await client.guilds.fetch();
	const oAuth2GuildsJson = oAuth2Guilds.toJSON();

	for (let i = 0; i < oAuth2GuildsJson.length; i++) {
		const guild = await oAuth2GuildsJson[i].fetch();
		let indexOfLevelsGuild = await GetIndexOfLevelsGuild(levels, guild.id);

		if (indexOfLevelsGuild === -1) {
			await levels.push('guilds', new LevelsGuild(guild.id))
				.then(() => console.log(`Pushed ${guild.name} to guilds array`));

			indexOfLevelsGuild = await GetIndexOfLevelsGuild(levels, guild.id);
		}

		const members = await guild.members.fetch({ force: true });
		const membersJson = members.toJSON();

		for (let i = 0; i < membersJson.length; i++) {
			if (membersJson[i].user.bot) continue;

			const levelsMembers = await levels.get(`guilds.${indexOfLevelsGuild}.members`);

			if (levelsMembers.findIndex((levelsMember) => levelsMember.id === membersJson[i].id) === -1) {
				await levels.push(`guilds.${indexOfLevelsGuild}.members`, new LevelsMember(membersJson[i].id))
					.then(() => console.log(`Pushed ${membersJson[i].user.username} to ${guild.name}'s members array`));
			}
		}
	}
}

module.exports = {
	LevelsGuild,
	LevelsMember,
	RewardRole,
	GetIndexOfLevelsGuild,
	GetIndexOfLevelsMember,
	InitLevels,
};
class LevelsGuild {
	constructor(id = '') {
		this.id = id;
		this.settings = {
			xpRate: 1,
			levelUpThreshold: 10,
			levelUpScaling: 0.75,
			levelUpMessageChannel: null,
			shortestMessageDuration: 10,
			maxMessageCount: 3,
			spamPenaltyDuration: 20,
			rewardRoles: [],
			enabled: true,
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
	}
}

class RewardRole {
	constructor(id = '', level = 1) {
		this.id = id;
		this.id = level;
	}
}

function InitLevels(client, db) {
	const levelsTable = db.table('levels');

	if (!levelsTable.has('guilds')) {
		levelsTable.set('guilds', []);
	}

	for (const clientGuild in client.guilds.fetch()) {
		let indexOfClientGuild = levelsTable.get('guilds')
			.then((levelsGuilds) =>
				levelsGuilds.findIndex((levelsGuild) => clientGuild.id === levelsGuild.id));

		if (indexOfClientGuild === -1) {
			levelsTable.push('guilds', new LevelsGuild(clientGuild.id));
			indexOfClientGuild = levelsTable.get('guilds').length;
		}

		clientGuild.fetch()
			.then((guild) => {
				for (const member in guild.members.fetch()) {
					const indexOfMember = levelsTable.get(`guild[${indexOfClientGuild}].members`)
						.then((levelsMembers) =>
							levelsMembers.findIndex((levelsMember) => member.id === levelsMember.id));

					if (indexOfMember === -1) {
						levelsTable.push(`guilds[${indexOfClientGuild}].members`, new LevelsMember(member.id));
					}
				}
			});
	}
}

module.exports = {
	LevelsGuild,
	LevelsMember,
	RewardRole,
	InitLevels,
};
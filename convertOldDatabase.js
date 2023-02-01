const { Collection } = require('discord.js');
const { DatabaseGuild, DatabaseMember } = require('./database.js');
const { LevelReward } = require('./leveling.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

async function convert() {
	const levels = db.table('levels');
	const levelsGuilds = await levels.get('guilds');

	const databaseGuilds = new Collection();

	for (const levelsGuild of levelsGuilds) {
		databaseGuilds.set(levelsGuild.id, new DatabaseGuild(levelsGuild.id));

		const levelRewards = [];
		for (const rewardRole of levelsGuild.settings.rewardRoles) {
			levelRewards.push(new LevelReward(rewardRole.level, rewardRole.roleIds, rewardRole.stackable));
		}

		const databaseGuild = databaseGuilds.get(levelsGuild.id);
		databaseGuild.settings.levelingSettings = {
			enabled: levelsGuild.settings.enabled,

			xpRate: levelsGuild.settings.xpRate,
			levelUpThreshold: levelsGuild.settings.levelUpThreshold,
			levelUpScaling: levelsGuild.settings.levelUpScaling,
			levelUpMessageChannel: levelsGuild.settings.levelUpMessageChannel,

			shortestMessageDuration: levelsGuild.settings.shortestMessageDuration,
			maxMessageCount: levelsGuild.settings.maxMessageCount,
			spamPenaltyDuration: levelsGuild.settings.spamPenaltyDuration,

			levelRewards: levelRewards,
		};

		for (const levelsMember of levelsGuild.members) {
			databaseGuild.members.set(levelsMember.id, new DatabaseMember(levelsMember.id, false));

			const databaseMember = databaseGuild.members.get(levelsMember.id);
			databaseMember.settings.levelingSettings.optIn = levelsMember.optIn;
			databaseMember.stats.lastMessageSentChannelId = levelsMember.lastMessageSentChannelId;
			databaseMember.stats.levelingStats = {
				level: levelsMember.level,
				xp: levelsMember.xp,
				spamBeginTimestamp: levelsMember.sentenceBeginTimestamp,
				spamMessagesSent: levelsMember.messagesSent,
			};

			databaseGuild.members.set(levelsMember.id, databaseMember);
		}

		databaseGuilds.set(levelsGuild.id, databaseGuild);
	}

	await db.set('guilds', databaseGuilds);
	await levels.delete('guilds');
}

convert();
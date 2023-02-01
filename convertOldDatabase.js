const { Collection } = require('discord.js');
const { DatabaseGuild, DatabaseMember } = require('./database.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

const levels = db.table('levels');
const levelsGuilds = levels.get('guilds');

const databaseGuilds = new Collection();

for (const levelsGuild of levelsGuilds) {
	databaseGuilds.set(levelsGuild.id, new DatabaseGuild(levelsGuild.id));

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

		levelRewards: levelsGuild.settings.rewardRoles,
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

levels.delete('guilds');
db.set('guilds', databaseGuilds);
const { Collection } = require('discord.js');

class DatabaseGuild {
	constructor(guildId) {
		this.id = guildId;
		this.members = new Collection();
		this.settings = {
			levelingSettings: {
				enabled: true,

				xpRate: 1,
				levelUpThreshold: 10,
				levelUpScaling: 3,
				levelUpMessageChannel: null,

				shortestMessageDuration: 10,
				maxMessageCount: 3,
				spamPenaltyDuration: 20,

				levelRewards: [],
			},
		};
	}
}

class DatabaseMember {
	constructor(userId, bot = false) {
		this.id = userId;
		this.bot = bot;
		this.settings = {};
		this.stats = {
			lastMessageSentChannelId: '',
		};

		if (!bot) {
			this.settings.levelingSettings = { optIn: true };
			this.stats.levelingStats = {
				level: 0,
				xp: 0,
				spamBeginTimestamp: 0,
				spamMessagesSent: 0,
			};
		}
	}
}

async function InitDatabase(db, client) {
	const databaseGuilds = new Collection();

	if (await db.has('guilds')) {
		databaseGuilds.merge(await db.get('guilds'));
		console.log('Used existing guilds collection');
	}
	else {
		console.log('Created new guilds collection');
	}

	const oAuth2Guilds = await client.guilds.fetch();

	for (const oAuth2Guild of oAuth2Guilds) {
		const guild = await oAuth2Guild.fetch();

		if (!databaseGuilds.has(guild.id)) {
			databaseGuilds.set(guild.id, new DatabaseGuild(guild.id));
			console.log(`Set new key for guild: ${guild.id}`);
		}

		const databaseGuild = databaseGuilds.get(guild.id);

		const members = await guild.members.fetch({ force: true });

		for (const member of members) {
			if (!databaseGuild.members.has(member.id)) {
				databaseGuild.members.set(member.id, new DatabaseMember(member.id, member.user.bot));
				console.log(`Set new key for user: ${member.id}`);
			}
		}

		databaseGuilds.set(guild.id, databaseGuild);
	}

	await db.set('guilds', databaseGuilds);
}

module.exports = {
	DatabaseGuild,
	DatabaseMember,
	InitDatabase,
};
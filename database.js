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
	let databaseGuilds = new Collection();

	if (await db.has('guilds')) {
		databaseGuilds = await GetDatabaseGuilds(db);
		console.log('Used existing guilds collection');
	}
	else {
		console.log('Created new guilds collection');
	}

	const oAuth2Guilds = await client.guilds.fetch();

	for (const oAuth2Guild of oAuth2Guilds.values()) {
		const guild = await oAuth2Guild.fetch();

		if (!databaseGuilds.has(guild.id)) {
			databaseGuilds.set(guild.id, new DatabaseGuild(guild.id));
			console.log(`Set new key for guild: ${guild.id}`);
		}

		const databaseGuild = databaseGuilds.get(guild.id);

		const members = await guild.members.fetch({ force: true });

		for (const member of members.values()) {
			if (!databaseGuild.members.has(member.id)) {
				databaseGuild.members.set(member.id, new DatabaseMember(member.id, member.user.bot));
				console.log(`Set new key for member: ${member.id}`);
			}
		}

		databaseGuilds.set(guild.id, databaseGuild);
	}

	await db.set('guilds', databaseGuilds);
}

async function GetDatabaseGuilds(db) {
	const guildsArray = await db.get('guilds');

	const guildsCollection = new Collection();

	for (const guildElement of guildsArray) {
		const membersCollection = new Collection();

		for (const memberElement of guildElement.members) {
			membersCollection.set(memberElement.id, memberElement);
		}

		guildElement.members = membersCollection;

		guildsCollection.set(guildElement.id, guildElement);
	}

	return guildsCollection;
}

module.exports = {
	DatabaseGuild,
	DatabaseMember,
	InitDatabase,
	GetDatabaseGuilds,
};
const { Collection } = require('discord.js');

/**
 * @brief Represents the bot data for a guild
 */
class DatabaseGuild {
	/**
	 * @param {*} guildId The id of the guild whose bot data it controls
	 */
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

/**
 * @brief Represents the bot data for a member
 */
class DatabaseMember {
	/**
	 * @param {*} userId	The id of the member whose bot data it controls
	 * @param {*} bot		Whether or not this DatabaseMember is a Discord bot
	 */
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

/**
 * @brief				Initializes the database if starting anew, otherwise, updates the database with new guilds and members
 *
 * @param {*} db		The database to work with
 * @param {*} client	The discord.js client to get data from
 */
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

/**
 * @brief			Gets the guilds collection from a database and converts it from an array to a discord.js collection
 *
 * @param {*} db	The database to get the guilds collection from
 * @returns			Collection<DatabaseGuild>
 */
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
const { Events } = require('discord.js');

module.exports = {
	name: Events.ClientReady,
	once: true,
	async execute(client, db) {
		if (!await db.has('leveling')) {
			await db.set('leveling', {
				defaultSettings: {
					xpForMessage: 1,
					baseLevelUpThreshold: 10,
					levelUpThresholdMultiplier: 0.75,
					levelUpAnnouncementChannel: null,
					timespanOfSuccession: 10,
					allowedMessagesInSuccession: 3,
					spamProtectionTime: 20,
					levelRoles: [],
				},
				guilds: {},
			});
		}

		console.log(`Ready! Logged in as ${client.user.tag}`);
	},
};
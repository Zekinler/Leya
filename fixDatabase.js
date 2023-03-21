const { GetDatabaseGuilds } = require('./database.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

GetDatabaseGuilds(db).then(databaseGuilds => {
	databaseGuilds.forEach(databaseGuild => {
		const guildLevelingSettings = databaseGuild.settings.levelingSettings;

		const levelRewardLevelsFound = [];

		guildLevelingSettings.levelRewards.forEach((levelReward, levelRewardIndex) => {
			if (levelRewardLevelsFound.includes(levelReward.level)) {
				guildLevelingSettings.levelRewards.splice(levelRewardIndex, 1);
				return;
			}

			levelReward.roles = [];

			levelReward.roleIds.forEach(roleId => levelReward.roles.push({ id: roleId, stackable: levelReward.stackable }));

			levelReward.roleIds = undefined;
			levelReward.stackable = undefined;

			levelRewardLevelsFound.push(levelReward.level);

			guildLevelingSettings.levelRewards.splice(levelRewardIndex, 1, levelReward);
		});
	});
});
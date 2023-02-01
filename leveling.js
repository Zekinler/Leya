class LevelReward {
	constructor(level, roleIds, stackable) {
		this.level = level;
		this.roleIds = roleIds;
		this.stackable = stackable;
	}
}

function xpRequired(guildLevelingSettings, memberLevelingStats) {
	return guildLevelingSettings.levelUpThreshold + (memberLevelingStats.level * guildLevelingSettings.levelUpScaling);
}

async function GiveXP(db, amount, member, memberLevelingStats, guildLevelingSettings) {
	memberLevelingStats.xp += amount;

	if (memberLevelingStats.xp >= 0 && memberLevelingStats.xp < xpRequired(guildLevelingSettings, memberLevelingStats)) {
		return false;
	}

	while (memberLevelingStats.xp >= xpRequired(guildLevelingSettings, memberLevelingStats)) {
		memberLevelingStats.xp -= xpRequired(guildLevelingSettings, memberLevelingStats);
		memberLevelingStats.level++;
	}

	while (memberLevelingStats.xp < 0) {
		memberLevelingStats.level--;
		memberLevelingStats.xp += xpRequired(guildLevelingSettings, memberLevelingStats);
	}

	await HandleLevelRewards(member, memberLevelingStats, guildLevelingSettings);

	return true;
}

async function HandleLevelRewards(member, memberLevelingStats, guildLevelingSettings) {
	const rolesToRemove = [];
	let highestLevel = 0;
	let highestRoles = [];
	let stackingRoles = [];

	for (const levelReward of guildLevelingSettings.levelRewards) {
		if (memberLevelingStats.level >= levelReward.level && levelReward.level > highestLevel) {
			highestRoles = levelReward.roleIds;
			highestLevel = levelReward.level;
		}
		else if (memberLevelingStats.level >= levelReward.level && levelReward.stackable) {
			stackingRoles = stackingRoles.concat(levelReward.roleIds);
		}
		else {
			for (const roleId of levelReward.roleIds) {
				if (member.roles.cache.has(roleId)) {
					if (memberLevelingStats.level < levelReward.level || (memberLevelingStats.level >= levelReward.level && !levelReward.stackable)) {
						rolesToRemove.push(roleId);
					}
				}
			}
		}
	}

	if (rolesToRemove.length > 0) {
		await member.roles.remove(rolesToRemove, 'These level reward roles are either of a lesser level or a higher level than the member');
	}

	if (highestRoles.length > 0) {
		await member.roles.add(highestRoles, `The member's level is ${memberLevelingStats.level}`);
	}

	if (stackingRoles.length > 0) {
		await member.roles.add(stackingRoles, `The member's level is ${memberLevelingStats.level}`);
	}
}

module.exports = {
	LevelReward,
	GiveXP,
	HandleLevelRewards,
};
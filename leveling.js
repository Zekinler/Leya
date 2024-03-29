/**
 * @brief A level reward
 */
class LevelReward {
	/**
	 * @param {*} level		The level that must be reached to earn this level reward
	 * @param {*} roles		The roles that this level rewards gives, is an array of elements with the properties, id, and stackable
	 */
	constructor(level, roles = []) {
		this.level = level;
		this.roles = roles;
	}
}

/**
 * @brief							Gets the xp required to advance to next level based off of the guild's leveling settings, the member's current level
 *
 * @param {*} guildLevelingSettings	The leveling settings of the guild
 * @param {*} memberLevelingStats	The leveling stats of the member being checked
 * @returns 						The amount of xp required to advance
 */
function xpRequired(guildLevelingSettings, memberLevelingStats) {
	return guildLevelingSettings.levelUpThreshold + (memberLevelingStats.level * guildLevelingSettings.levelUpScaling);
}

/**
 * @brief							Gives/takes XP to/from a member, checks if they've leveled-up/down, and applies the according level rewards' roles
 *
 * @param {*} db					The database to work with
 * @param {*} amount				The amount of XP to give(+) or take(-)
 * @param {*} member				The member; required to give level reward roles
 * @param {*} memberLevelingStats	The member's leveling stats
 * @param {*} guildLevelingSettings	The guild's leveling settings
 * @returns							Whether the member has leveled-up
 */
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
		if (memberLevelingStats.level === 0) {
			memberLevelingStats.xp = 0;
			break;
		}

		memberLevelingStats.level--;
		memberLevelingStats.xp += xpRequired(guildLevelingSettings, memberLevelingStats);
	}

	await HandleLevelRewards(member, memberLevelingStats, guildLevelingSettings);

	return true;
}

/**
 * @brief							Gives level reward roles to a member according to the member's level, and the guild's level rewards
 *
 * @param {*} member				The member to handle the level rewards of
 * @param {*} memberLevelingStats	The member's leveling stats
 * @param {*} guildLevelingSettings	The guild's leveling settings
 */
async function HandleLevelRewards(member, memberLevelingStats, guildLevelingSettings) {
	const rolesToRemove = [];
	let highestLevel = 0;
	let highestRoles = [];
	let stackingRoles = [];

	for (const levelReward of guildLevelingSettings.levelRewards) {
		if (memberLevelingStats.level >= levelReward.level && levelReward.level > highestLevel) {
			highestRoles = levelReward.roles.map(role => role.id);
			highestLevel = levelReward.level;
		}
		else if (memberLevelingStats.level >= levelReward.level) {
			for (const role of levelReward.roles) {
				if (role.stackable) {
					stackingRoles = stackingRoles.concat(role.id);
				}
				else if (member.roles.cache.has(role.id) && !role.stackable) {
					rolesToRemove.push(role.id);
				}
			}
		}
		else {
			for (const role of levelReward.roles) {
				if (member.roles.cache.has(role.id)) {
					rolesToRemove.push(role.id);
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
		await member.roles.add(stackingRoles, `The member's level is ${memberLevelingStats.level} and this is a stackable role`);
	}
}

module.exports = {
	LevelReward,
	GiveXP,
	HandleLevelRewards,
};
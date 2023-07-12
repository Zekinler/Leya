const { ChannelType, PermissionsBitField } = require('discord.js');

/**
 * @brief A constant that defines all input types
 */
const MessageInputType = Object.freeze({
	Integer: 'integer',
	Number: 'number',
	Boolean: 'boolean',
	String: 'string',
	Members: 'members',
	Roles: 'roles',
	TextChannels: 'text-channels',
});

/**
 * @brief A handler for message-based inputs
 */
class MessageInputHandler {
	/**
	 * @param {*} memberId		The id of the member to get input from
	 * @param {*} channelId		The id of the channel to limit the input to
	 * @param {*} guildId		The id of the guild to limit the input to
	 * @param {*} type			The type of input the command wants to receive
	 * @param {*} typeOptions	Options for the type
	 * @param {*} callbackFn	The function that is called when the user makes a valid input; gets passed the input from the user
	 * @param {*} timeoutFn		The function that is called when the user has taken too long to give an input
	 */
	constructor(memberId, channelId, guildId, type, typeOptions, callbackFn, timeoutFn) {
		this.memberId = memberId;
		this.channelId = channelId;
		this.guildId = guildId;
		this.type = type;
		this.typeOptions = typeOptions;

		this.callbackFn = callbackFn;
		this.timeoutFn = timeoutFn;

		this.timedOut = false;
		this.timeoutId = setTimeout(async () => {
			this.timedOut = true;
			await this.timeoutFn();
		}, 10000);

		/**
		 * @brief				Gets input from the message it's given and, if valid, gives to the interaction that created it
		 *
		 * @param {*} message	The message to get the input from
		 * @returns				-2: Timed Out: Remove handler from running handlers and calculate leveling for the sender,
		 *						-1: Invalid Input: Don't remove handler and don't calculate leveling,
		 *						0: Wrong Member/Channel/Guild: Don't remove handler and calculate leveling,
		 *						1: Valid Input: Remove handler and don't calculate leveling,
		 */
		this.handle = async (message) => {
			if (this.timedOut === true) return -2;

			if (message.member.id !== this.memberId) return 0;
			if (message.channelId !== this.channelId) return 0;
			if (message.guildId !== this.guildId) return 0;

			clearTimeout(this.timeoutId);
			this.timeoutId = setTimeout(async () => {
				this.timedOut = true;
				await this.timeoutFn();
			}, 10000);

			let input;

			switch (this.type) {
			case 'integer':
				input = parseInt(message.content);

				if (isNaN(input)) {
					const sentMessage = await message.reply('Please send a message containing an integer');
					setTimeout(async () => { await sentMessage.delete(); }, 3000);

					try {
						await message.delete();
					}
					catch (error) {
						console.log(error);
					}

					return -1;
				}
				if (this.typeOptions.minValue !== undefined && input < this.typeOptions.minValue) {
					const sentMessage = await message.reply(`The minimum value required is ${this.typeOptions.minValue}`);
					setTimeout(async () => { await sentMessage.delete(); }, 3000);

					try {
						await message.delete();
					}
					catch (error) {
						console.log(error);
					}

					return false;
				}
				if (this.typeOptions.maxValue !== undefined && input > this.typeOptions.maxValue) {
					const sentMessage = await message.reply(`The maximum value allowed is ${this.typeOptions.maxValue}`);
					setTimeout(async () => { await sentMessage.delete(); }, 3000);

					try {
						await message.delete();
					}
					catch (error) {
						console.log(error);
					}

					return -1;
				}
				if (this.typeOptions.zeroNotAllowed !== undefined && (this.typeOptions.zeroNotAllowed && input === 0)) {
					const sentMessage = await message.reply('The value cannot be zero');
					setTimeout(async () => { await sentMessage.delete(); }, 3000);

					try {
						await message.delete();
					}
					catch (error) {
						console.log(error);
					}

					return -1;
				}

				break;
			case 'number':
				input = parseFloat(message.content);

				if (isNaN(input)) {
					const sentMessage = await message.reply('Please send a message containing a number');
					setTimeout(async () => { await sentMessage.delete(); }, 3000);

					try {
						await message.delete();
					}
					catch (error) {
						console.log(error);
					}

					return -1;
				}
				if (this.typeOptions.minValue !== undefined && input < this.typeOptions.minValue) {
					const sentMessage = await message.reply(`The minimum value required is ${this.typeOptions.minValue}`);
					setTimeout(async () => { await sentMessage.delete(); }, 3000);

					try {
						await message.delete();
					}
					catch (error) {
						console.log(error);
					}

					return -1;
				}
				if (this.typeOptions.maxValue !== undefined && input > this.typeOptions.maxValue) {
					const sentMessage = await message.reply(`The maximum value allowed is ${this.typeOptions.maxValue}`);
					setTimeout(async () => { await sentMessage.delete(); }, 3000);

					try {
						await message.delete();
					}
					catch (error) {
						console.log(error);
					}

					return -1;
				}
				if (this.typeOptions.zeroNotAllowed !== undefined && (this.typeOptions.zeroNotAllowed && input === 0)) {
					const sentMessage = await message.reply('The value cannot be zero');
					setTimeout(async () => { await sentMessage.delete(); }, 3000);

					try {
						await message.delete();
					}
					catch (error) {
						console.log(error);
					}

					return -1;
				}

				break;
			case 'boolean':
				input = message.content.trim();

				if (input === 'true') {
					input = true;
				}
				else if (input === 'false') {
					input = false;
				}
				else {
					const sentMessage = await message.reply('Please send a message containing a boolean');
					setTimeout(async () => { await sentMessage.delete(); }, 3000);

					try {
						await message.delete();
					}
					catch (error) {
						console.log(error);
					}

					return -1;
				}

				break;
			case 'string':
				input = message.content.trim();

				if (this.typeOptions.minLength !== undefined && input < this.typeOptions.minLength) {
					const sentMessage = await message.reply(`The minimum length of text required is ${this.typeOptions.minLength}`);
					setTimeout(async () => { await sentMessage.delete(); }, 3000);

					try {
						await message.delete();
					}
					catch (error) {
						console.log(error);
					}

					return -1;
				}
				if (this.typeOptions.maxLength !== undefined && input > this.typeOptions.maxLength) {
					const sentMessage = await message.reply(`The maximum length of text allowed is ${this.typeOptions.maxLength}`);
					setTimeout(async () => { await sentMessage.delete(); }, 3000);

					try {
						await message.delete();
					}
					catch (error) {
						console.log(error);
					}

					return -1;
				}

				break;
			case 'members':
				input = message.mentions.members.toJSON();

				for (let i = 0; i < input.length; i++) {
					if (!(this.typeOptions.disallowedValues === undefined || !this.typeOptions.disallowedValues.includes(input[i])) || !(this.typeOptions.allowedValues === undefined || this.typeOptions.allowedValues.includes(input[i]))) {
						const sentMessage = await message.reply(`${input[i]} is not an allowed value`);
						setTimeout(async () => { await sentMessage.delete(); }, 3000);

						input.splice(i, 1);
					}
				}

				if (input.length === 0) {
					const sentMessage = await message.reply('Please send a message containing at least one valid member mention');
					setTimeout(async () => { await sentMessage.delete(); }, 3000);

					try {
						await message.delete();
					}
					catch (error) {
						console.log(error);
					}

					return -1;
				}
				if (this.typeOptions.maxMentions !== undefined && input.length > this.typeOptions.maxMentions) {
					const sentMessage = await message.reply(`The maximum amount of member mentions allowed is ${this.typeOptions.maxMentions}`);
					setTimeout(async () => { await sentMessage.delete(); }, 3000);

					try {
						await message.delete();
					}
					catch (error) {
						console.log(error);
					}

					return -1;
				}

				break;
			case 'roles':
				input = message.mentions.roles.toJSON();

				for (let i = 0; i < input.length; i++) {
					if (!(this.typeOptions.disallowedValues === undefined || !this.typeOptions.disallowedValues.includes(input[i])) || !(this.typeOptions.allowedValues === undefined || this.typeOptions.allowedValues.includes(input[i]))) {
						const sentMessage = await message.reply(`${input[i]} is not an allowed value`);
						setTimeout(async () => { await sentMessage.delete(); }, 3000);

						input.splice(i, 1);
					}
				}

				if (input.length === 0) {
					const sentMessage = await message.reply('Please send a message containing at least one valid role mention');
					setTimeout(async () => { await sentMessage.delete(); }, 3000);

					try {
						await message.delete();
					}
					catch (error) {
						console.log(error);
					}

					return -1;
				}
				if (this.typeOptions.maxMentions !== undefined && input.length > this.typeOptions.maxMentions) {
					const sentMessage = await message.reply(`The maximum amount of role mentions allowed is ${this.typeOptions.maxMentions}`);
					setTimeout(async () => { await sentMessage.delete(); }, 3000);

					try {
						await message.delete();
					}
					catch (error) {
						console.log(error);
					}

					return -1;
				}

				break;
			case 'text-channels':
				input = await message.mentions.channels.filter((channel) => channel.type === ChannelType.GuildText).toJSON();

				for (let i = 0; i < input.length; i++) {
					if (!(this.typeOptions.disallowedValues === undefined || !this.typeOptions.disallowedValues.includes(input[i])) || !(this.typeOptions.allowedValues === undefined || this.typeOptions.allowedValues.includes(input[i]))) {
						const sentMessage = await message.reply(`${input[i]} is not an allowed value`);
						setTimeout(async () => { await sentMessage.delete(); }, 3000);

						input.splice(i, 1);
					}
					for (let j = 0; j < this.typeOptions.permissionsNeeded.length; j++) {
						if (!message.guild.members.me.permissionsIn(input[i].id).has(this.typeOptions.permissionsNeeded[j])) {
							let ordinal = '';
							if ((i + 1).toString().substring(-1) === 1) ordinal = 'st';
							if ((i + 1).toString().substring(-1) === 2) ordinal = 'nd';
							if ((i + 1).toString().substring(-1) === 3) ordinal = 'rd';
							if ((i + 1).toString().substring(-1) > 3) ordinal = 'th';
							if ((i + 1).toString().length > 1 && (i + 1).toString().substring(-2) > 9 && (i + 1).toString().substring(-2) < 20) ordinal = 'th';

							const sentMessage = await message.reply(`I'm missing the required permission ${PermissionsBitField.Flags[this.typeOptions.permissionsNeeded[j]]} in the ${i + 1}${ordinal} channel you mentioned`);
							setTimeout(async () => { await sentMessage.delete(); }, 3000);

							try {
								await message.delete();
							}
							catch (error) {
								console.log(error);
							}

							return -1;
						}
					}
				}

				if (input.length === 0) {
					const sentMessage = await message.reply('Please send a message containing at least one valid text channel mention');
					setTimeout(async () => { await sentMessage.delete(); }, 3000);

					try {
						await message.delete();
					}
					catch (error) {
						console.log(error);
					}

					return -1;
				}
				if (this.typeOptions.maxMentions !== undefined && input.length > this.typeOptions.maxMentions) {
					const sentMessage = await message.reply(`The maximum amount of text channel mentions allowed is ${this.typeOptions.maxMentions}`);
					setTimeout(async () => { await sentMessage.delete(); }, 3000);

					try {
						await message.delete();
					}
					catch (error) {
						console.log(error);
					}

					return -1;
				}

				break;
			default:
				console.error(`Unknown MessageOptionType: ${this.type}`);
				clearTimeout(this.timeoutId);
				return 1;
			}

			if (!(this.type === 'members' || this.type === 'roles' || this.type === 'text-channels') && !(this.typeOptions.disallowedValues === undefined || !this.typeOptions.disallowedValues.includes(input)) || !(this.typeOptions.allowedValues === undefined || this.typeOptions.allowedValues.includes(input))) {
				const sentMessage = await message.reply(`${input} is not an allowed value`);
				setTimeout(async () => { await sentMessage.delete(); }, 3000);

				try {
					await message.delete();
				}
				catch (error) {
					console.log(error);
				}

				return -1;
			}

			try {
				await message.delete();
			}
			catch (error) {
				if (error.rawError.message !== 'Unknown Message') console.log(error);
			}

			clearTimeout(this.timeoutId);
			this.callbackFn(input);

			return 1;
		};
	}
}

module.exports = {
	MessageInputHandler,
	MessageInputType,
};
module.exports = {
	customId: 'close',
	async execute(interaction) {
		try {
			await interaction.message.delete();
		}
		catch (error) {
			console.log(error);
		}
	},
};
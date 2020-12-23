const Discord = require("discord.js");
const db = require("quick.db");

const config = require("../config.json");

const mentionParse = (mention, client) => {
	if (mention.startsWith("<@") && mention.endsWith(">")) {
		mention = mention.slice(2, -1);
	}

	if (mention.startsWith("!")) {
		mention = mention.slice(1);
	}

	const user = client.users.resolve(mention);
	if (user) {
		return user.tag;
	} else {
		return mention.substr(0, 32);
	}
};

module.exports = {
	enabled: true,
	hidden: false,
	name: "newquote",
	description:
		"Creates a new quote",
	usage: "[quote] [author]",
	example: "You're gonna have a bad time Sans",
	aliases: ["createquote", "addquote", "nquote"],
	cooldown: 10,
	args: true,
	guildOnly: true,
	supportGuildOnly: false,
	execute(message, args) {
		if (
			db.get(`${message.guild.id}.allquote`) ||
			message.member.hasPermission("MANAGE_GUILD")
		) {
			if (args.length < 2) {
				const invalidArgsEmbed = new Discord.MessageEmbed()
					.setTitle("❌ Incorrect usage")
					.setColor(config.colors.error)
					.setDescription(
						"You have to specify the quote's text & the author."
					);
				return message.channel.send(invalidArgsEmbed);
			}

			const serverQuotes = db.get(`${message.guild.id}.quotes`) || [];
			if (
				serverQuotes.length >=
				(db.get(`${message.guild.id}.maxQuotes`) || 30)
			) {
				const fullQuotesEmbed = new Discord.MessageEmbed()
					.setTitle("❌ Storage full")
					.setColor(config.colors.error)
					.setDescription(
						`This server has too many quotes! Remove some with \`${message.applicablePrefix}deletequote\` before adding more.`
					);
				return message.channel.send(fullQuotesEmbed);
			}

			const author = mentionParse(args.pop(), message.client);
			const quote = args.join(" ");

			if (
				quote.length >
				(db.get(`${message.guild.id}.maxQuoteSize`) || 130)
			) {
				const quoteSizeEmbed = new Discord.MessageEmbed()
					.setTitle("❌ Quote too big")
					.setColor(config.colors.error)
					.setDescription(
						`Quotes cannot be longer than ${
							db.get(`${message.guild.id}.maxQuoteSize`) || 130
						} characters.`
					);
				return message.channel.send(quoteSizeEmbed);
			}

			db.push(`${message.guild.id}.quotes`, {
				text: quote,
				author: author,
				createdTimestamp: Date.now(),
				quoter: message.author.id,
			});

			const successEmbed = new Discord.MessageEmbed()
				.setTitle("✅ Added quote")
				.setColor(config.colors.success)
				.setDescription(
					`Created a new server quote:
						
						"${quote}" - ${author}`
				)
				.setFooter(`Quote #${(serverQuotes.length || 0) + 1}`);
			return message.channel.send(successEmbed);
		} else {
			const noPermissionEmbed = new Discord.MessageEmbed()
				.setTitle("❌ You don't have permission to do that")
				.setColor(config.colors.error)
				.setDescription(
					`That action requires the Manage Guild permission.
					
					**❗ To allow anyone to create quotes**, have an administrator run \`${message.applicablePrefix}allquote\``
				);
			message.channel.send(noPermissionEmbed);
		}
	},
};

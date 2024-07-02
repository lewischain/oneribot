const { EmbedBuilder } = require("discord.js");
const db = require("croxydb");

function findDataByMessageId(messageId) {
  const allData = db.all();

  for (const data of Object.keys(allData)) {
    if (data.startsWith("suggestion_")) {
      const suggestionData = db.get(data);

      if (suggestionData.messageId === messageId) {
        return suggestionData
      }
    }
  }

  return null;
}

function embed(interaction, description, error, title) {
  const embed = new EmbedBuilder()
    .setDescription(description)
    .setColor(error ? "Red" : "Blurple")
    .setTimestamp()
    .setFooter({
      text: interaction.user.username,
      iconURL: interaction.user.avatarURL(),
    });

  if (title) embed.setTitle(title);

  return embed;
}

module.exports = {
  findDataByMessageId,
  embed
}
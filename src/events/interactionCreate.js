const { Events } = require("discord.js");
const handleSuggestionSystem = require("../system/suggestion");
const { embed } = require("../system/utils");

module.exports = {
  name: Events.InteractionCreate,
  execute: async (client, interaction) => {
    if (interaction.user.bot) return;

    if (interaction.isChatInputCommand()) {
      try {
        const command = client.commands.get(interaction.commandName);
        command.execute(client, interaction, embed);
      } catch (e) {
        console.error(e);
        interaction.reply({
          content:
            "Komut çalıştırılırken bir sorunla karşılaşıldı! Lütfen tekrar deneyin.",
          ephemeral: true,
        });
      }
    } else if (interaction.isButton()) {
      const startsWith = interaction.customId.split("_")[0];

      if (["approve", "reject", "delete", "settings", "settings_approve", "settings_reject"].includes(startsWith)) return await handleSuggestionSystem(interaction);
    }
  },
};

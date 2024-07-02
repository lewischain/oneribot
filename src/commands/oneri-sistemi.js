const { SlashCommandBuilder } = require("discord.js");
const db = require("croxydb");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("öneri-sistemi")
    .setDescription("Öneri sistemi ayarları.")
    .addChannelOption((option) =>
      option
        .setName("kanal")
        .setDescription("Öneri kanalını belirleyin.")
        .addChannelTypes([0])
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName("durum")
        .addChoices(
          { name: "Açık", value: "acik" },
          { name: "Kapalı", value: "kapali" }
        )
        .setDescription("Öneri sistemi durumunu belirleyin.")
        .setRequired(false)
    ),
  execute: async (client, interaction, embed) => {
    if (!interaction.member.permissions.has("ManageMessages")) {
      return interaction.reply({
        embeds: [
          embed(
            interaction,
            "Bu komutu kullanabilmek için `Mesajları Yönet` yetkisine sahip olmalısınız.",
            true,
            "Hata"
          ),
        ],
        ephemeral: true,
      });
    }

    const channel = interaction.options.getChannel("kanal");
    const status = interaction.options.getString("durum");

    if (!channel && !status) {
      return interaction.reply({
        embeds: [
          embed(interaction, "Lütfen bir seçenek belirtin.", true, "Hata"),
        ],
        ephemeral: true,
      });
    }

    const guildSchema = db.get(`suggestionsystem_${interaction.guild.id}`) || {};

    if (status === "kapali" && !guildSchema.status) {
      return interaction.reply({
        embeds: [embed(interaction, "Öneri sistemi zaten kapalı.", true, "Hata")],
        ephemeral: true,
      });
    }

    if (channel && status) {
      db.set(`suggestionsystem_${interaction.guild.id}`, {
        channel: channel.id,
        status: status === "acik",
      });

      return interaction.reply({
        embeds: [
          embed(
            interaction,
            `Öneri sistemi başarıyla ${status === "acik" ? `açıldı. Öneri kanalı: <#${channel.id}>` : `kapandı ve öneri kanalı <#${channel.id}> olarak ayarlandı.`}`,
            false,
            "Başarılı"
          ),
        ],
        ephemeral: true,
      });
    }

    if (channel) {
      if (guildSchema.channel === channel.id) {
        return interaction.reply({
          embeds: [
            embed(
              interaction,
              `Öneri kanalı zaten <#${channel.id}> olarak ayarlı.`,
              true,
              "Hata"
            ),
          ],
          ephemeral: true,
        });
      }

      db.set(`suggestionsystem_${interaction.guild.id}`, {
        channel: channel.id,
        status: guildSchema.status,
      });

      return interaction.reply({
        embeds: [
          embed(
            interaction,
            `Öneri kanalı başarıyla <#${channel.id}> olarak ayarlandı.`,
            false,
            "Başarılı"
          ),
        ],
        ephemeral: true,
      });
    }

    if (status) {
      db.set(`suggestionsystem_${interaction.guild.id}`, {
        channel: guildSchema.channel,
        status: status === "acik",
      });

      return interaction.reply({
        embeds: [
          embed(
            interaction,
            `Öneri sistemi başarıyla ${status === "acik" ? "açıldı." : "kapandı."}`,
            false,
            "Başarılı"
          ),
        ],
        ephemeral: true,
      });
    }
  },
};

const { EmbedBuilder, SlashCommandBuilder, ActionRowBuilder, ButtonBuilder } = require("discord.js");
const db = require("croxydb");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("öneri")
        .setDescription("Sunucuya öneride bulunursunuz.")
        .addStringOption((option) =>
            option
                .setName("öneri")
                .setDescription("Sunucu hakkındakı önerinizi giriniz.")
                .setMinLength(10)
                .setMaxLength(1000)
                .setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName("başlık")
                .setDescription("Önerinizin başlığını giriniz.")
                .setMinLength(5)
                .setMaxLength(50)
                .setRequired(false)
        ),
    execute: async (client, interaction, embed) => {
        const suggestion = interaction.options.getString("öneri");
        const title = interaction.options.getString("başlık") || "Öneri";

        const guildSchema = db.get(`suggestionsystem_${interaction.guild.id}`) || {};

        if (!guildSchema.status) {
            return interaction.reply({
                embeds: [embed(interaction, "Sunucuda öneri sistemi kapalı.", true, "Hata")],
                ephemeral: true,
            });
        }

        const channel = interaction.guild.channels.cache.get(guildSchema.channel);

        if (!channel) {
            return interaction.reply({
                embeds: [embed(interaction, "Öneri kanalı bulunamadı lütfen bir yetkili ile iletişime geçiniz.", true, "Hata")],
                ephemeral: true,
            });
        }

        const suggestionEmbed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(suggestion)
            .setColor("Yellow")
            .setTimestamp()
            .setAuthor({
                name: interaction.user.username,
                iconURL: interaction.user.avatarURL(),
            })
            .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
            .setFooter({
                text: "Öneri Sistemi",
                iconURL: client.user.avatarURL(),
            });

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId("approve")
                    .setLabel("(0) Onayla")
                    .setStyle("Success"),
                new ButtonBuilder()
                    .setCustomId("reject")
                    .setLabel("(0) Reddet")
                    .setStyle("Danger"),
                new ButtonBuilder()
                    .setCustomId("settings")
                    .setLabel("⚙️")
                    .setStyle("Secondary")
            );

        const message = await channel.send({ embeds: [suggestionEmbed], components: [row] });

        db.set(`suggestion_${message.id}`, {
            messageId: message.id,
            approveVotes: [],
            rejectVotes: [],
            status: "waiting",
        });

        await interaction.reply({
            embeds: [embed(interaction, "Öneriniz başarıyla gönderildi.", false, "Başarılı")],
            ephemeral: true,
        });
    }
}
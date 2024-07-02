const db = require("croxydb");
const utils = require("./utils");
const { ActionRowBuilder, ButtonBuilder, EmbedBuilder } = require("discord.js");

async function handleSuggestionSystem(interaction) {
    const actionHandlers = {
        "approve": handleVoteButton,
        "reject": handleVoteButton,
        "settings": handleSettingsButton,
        "settings_approve": handleSettingsApproveButton,
        "settings_reject": handleSettingsRejectButton,
        "settings_delete": handleSettingsDeleteButton,
    };

    const handler = actionHandlers[interaction.customId];
    if (handler) {
        return handler(interaction);
    }
}

async function handleVoteButton(interaction) {
    const action = interaction.customId;
    const suggestionData = utils.findDataByMessageId(interaction.message.id);

    if (!suggestionData) return sendReply(interaction, "Öneri bulunamadı.", true, "Hata");

    if (["approved", "rejected"].includes(suggestionData.status)) {
        return sendReply(interaction, "Öneri zaten onaylanmış veya reddedilmiş.", true, "Hata");
    }

    const userId = interaction.user.id;

    suggestionData.approveVotes = suggestionData.approveVotes || [];
    suggestionData.rejectVotes = suggestionData.rejectVotes || [];

    const hasApprovedVote = suggestionData.approveVotes.includes(userId);
    const hasRejectedVote = suggestionData.rejectVotes.includes(userId);

    if (hasApprovedVote && action === "approve") {
        suggestionData.approveVotes = suggestionData.approveVotes.filter(id => id !== userId);
    } else if (hasRejectedVote && action === "reject") {
        suggestionData.rejectVotes = suggestionData.rejectVotes.filter(id => id !== userId);
    } else {
        suggestionData.approveVotes = suggestionData.approveVotes.filter(id => id !== userId);
        suggestionData.rejectVotes = suggestionData.rejectVotes.filter(id => id !== userId);
        suggestionData[`${action}Votes`].push(userId);
    }

    db.set(`suggestion_${interaction.message.id}`, suggestionData);

    const updatedEmbed = EmbedBuilder.from(interaction.message.embeds[0])
        .setColor(determineColor(suggestionData.approveVotes.length, suggestionData.rejectVotes.length));

    const row = createActionRow(suggestionData);

    await interaction.update({ embeds: [updatedEmbed], components: [row] });

    return sendReply(interaction,
        hasApprovedVote && action === "approve" ? "Öneri onayı başarıyla geri çekildi." :
            hasRejectedVote && action === "reject" ? "Öneri reddi başarıyla geri çekildi." :
                action === "approve" ? "Öneri başarıyla onaylandı." : "Öneri başarıyla reddedildi.",
        false, "Başarılı", true);
}

async function handleSettingsButton(interaction) {
    if (!interaction.member.permissions.has("ManageMessages")) {
        return sendReply(interaction, "Bu işlemi gerçekleştirmek için yeterli yetkiniz yok.", true, "Hata");
    }

    const settingsEmbed = new EmbedBuilder()
        .setTitle("Öneri Ayarları")
        .setDescription("Öneri ayarlarını düzenlemek için aşağıdaki butonları kullanabilirsiniz.")
        .setColor("Aqua")
        .setTimestamp()
        .setAuthor({
            name: interaction.user.username,
            iconURL: interaction.user.avatarURL(),
        })
        .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
        .setFooter({
            text: "Öneri Sistemi",
            iconURL: interaction.client.user.avatarURL(),
        });

    const row = new ActionRowBuilder().addComponents(
        createButton("settings_approve", "Onayla", "Success"),
        createButton("settings_reject", "Reddet", "Danger"),
        createButton("settings_delete", "Sil", "Secondary")
    );

    return interaction.reply({ embeds: [settingsEmbed], components: [row], ephemeral: true });
}

async function handleSettingsApproveButton(interaction) {
    return handleSettingsActionButton(interaction, "approved", "Öneriyi başarıyla onayladınız!", "Öneri yetkililer tarafından onaylandı!");
}

async function handleSettingsRejectButton(interaction) {
    return handleSettingsActionButton(interaction, "rejected", "Öneriyi başarıyla reddettiniz!", "Öneri yetkililer tarafından reddedildi!");
}

async function handleSettingsActionButton(interaction, status, successMessage, messageUpdateContent) {
    const suggestionData = utils.findDataByMessageId(interaction.message.reference.messageId);

    if (!suggestionData) return sendReply(interaction, "Öneri bulunamadı.", true, "Hata", false, true);

    if (suggestionData.status !== "waiting") {
        return sendReply(interaction, "Öneri zaten onaylanmış veya reddedilmiş.", true, "Hata", false, true);
    }

    const message = await interaction.channel.messages.fetch(suggestionData.messageId);

    suggestionData.status = status;

    db.set(`suggestion_${message.id}`, suggestionData);

    const updatedEmbed = EmbedBuilder.from(message.embeds[0])
        .setColor(status === "approved" ? "Green" : "Red");

    const row = createActionRow(suggestionData, true);

    await message.edit({ content: messageUpdateContent, embeds: [updatedEmbed], components: [row] });

    return interaction.update({ embeds: [utils.embed(interaction, successMessage)], components: [] });
}

async function handleSettingsDeleteButton(interaction) {
    const suggestionData = utils.findDataByMessageId(interaction.message.reference.messageId);

    if (!suggestionData) return sendReply(interaction, "Öneri bulunamadı.", true, "Hata");

    const message = await interaction.channel.messages.fetch(suggestionData.messageId);

    db.delete(`suggestion_${message.id}`)

    await message.delete();

    return interaction.update({ embeds: [utils.embed(interaction, "Öneri başarıyla silindi!")], components: [] });
}

function createButton(customId, label, style, disabled = false) {
    return new ButtonBuilder().setCustomId(customId).setLabel(label).setStyle(style).setDisabled(disabled);
}

function createActionRow(suggestionData, disabled = false) {
    return new ActionRowBuilder().addComponents(
        createButton("approve", `(${suggestionData.approveVotes.length}) Onayla`, "Success", disabled),
        createButton("reject", `(${suggestionData.rejectVotes.length}) Reddet`, "Danger", disabled),
        createButton("settings", "⚙️", "Secondary", disabled)
    );
}

function determineColor(successCount, rejectCount) {
    return successCount > rejectCount ? "Green" : (successCount === rejectCount ? "Yellow" : "Red");
}

function sendReply(interaction, message, isError, title, followUp = false, edit = false) {
    const method = followUp ? "followUp" : edit ? "editReply" : "reply";
    return interaction[method]({
        embeds: [utils.embed(interaction, message, isError, title)],
        ephemeral: true,
    });
}

module.exports = handleSuggestionSystem;

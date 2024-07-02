const { ActivityType, Events } = require("discord.js");

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    client.user.setActivity({
      name: `Raven Altapilar`,
      type: ActivityType.Listening,
    });
  },
};

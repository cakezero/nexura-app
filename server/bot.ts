import { firstMessage } from "@/models/msg.model";
import { Client, Events, GatewayIntentBits } from "discord.js";
import { BOT_TOKEN } from "@/utils/env.utils";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Logged in as ${readyClient.user?.tag}`);
});

client.on(Events.MessageCreate, async (message) => {
	if (message.author.bot) return;
	if (!message.guild) return;

	const user_id = message.author.id;
	const guild_id = message.guild.id;
	const channel_id = message.channelId;

	// Upsert per-guild so the verify-fallback queries (which filter by
	// {user_id, guild_id}) always match the most recent message the user
	// sent inside the quest's guild. Previously the lookup was global
	// (only {user_id}), so a user who had ever sent a message in ANY
	// Discord server would never get a record for a different guild.
	await firstMessage.findOneAndUpdate(
		{ user_id, guild_id },
		{ user_id, guild_id, channel_id },
		{ upsert: true, new: true },
	);
});

client.login(BOT_TOKEN);

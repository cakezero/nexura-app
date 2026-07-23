const { Client, GatewayIntentBits, Events } = require("discord.js");
import logger from "@/config/logger";
import { firstMessage } from "@/models/msg.model";

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
	],
});

client.on(Events.MessageCreate, async (message: any) => {
	if (message.author.bot) return;
	if (!message.guild) return;

	const user_id = message.author.id;
	const guild_id = message.guild.id;
	const channel_id = message.channelId;

	// Upsert per {user_id, guild_id, channel_id} so each channel gets its
	// own record. The verify-fallback queries try {user_id, guild_id, channel_id}
	// first, then {user_id, guild_id} as a broader fallback. Previously the
	// lookup was global (only {user_id}), so a user who had ever sent a message
	// in ANY Discord server would never get a record for a different guild.
	await firstMessage.findOneAndUpdate(
		{ user_id, guild_id, channel_id },
		{ user_id, guild_id, channel_id },
		{ upsert: true, new: true },
	);
});

// Catches Discord API and WebSocket errors — prevents process crash
client.on("error", (error: any) => {
    console.error("[client] Discord client error:", error.message);
});

// Logs Discord.js internal warnings
client.on("warn", (message: any) => {
    console.warn("[client] Warning:", message);
});

// Logs disconnection, reconnection, and resume events
client.on("shardDisconnect", (event: any) => {
    console.warn("[client] Bot disconnected. Code:", event.code);
});

client.on("shardReconnecting", () => {
    console.log("[client] Reconnecting to Discord...");
});

client.on("shardResume", () => {
    console.log("[client] Connection resumed.");
});

export default client;
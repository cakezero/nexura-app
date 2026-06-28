import express from "express";
import cors from "cors";
import { Client, Events, GatewayIntentBits } from "discord.js";
import helmet from "helmet";
import { port, BOT_TOKEN, SERVER_ENV } from "@/utils/env.utils";
import DB from "@/config/db";
import logger from "@/config/logger";
import appRoutes from "@/routes";
import { firstMessage } from "@/models/msg.model";
import { startAdminActivityCron } from "@/utils/adminActivityCron";
import { startRelicHodlCron } from "@/utils/relicHodlCron";
import { initRedis } from "@/config/redis";

const server = express();

server.use(cors({ origin: SERVER_ENV.ALLOWED_ORIGINS }));
server.use(helmet());
server.set("trust proxy", 1);
server.use(express.json());
server.use(express.urlencoded({ extended: true }));

server.use((req, res, next) => {
	const start = Date.now();
	const originalUrl = req.url;
	res.on("finish", () => {
		const duration = Date.now() - start;
		const logMsg = `${req.method} ${originalUrl} ${res.statusCode} ${duration}ms`;
		console.log(`[REQUEST] ${logMsg}`);
		if (req.body && Object.keys(req.body).length > 0) {
			console.log(`[BODY]`, JSON.stringify(req.body, null, 2));
		}
	});
	next();
});

server.use("/api", appRoutes);

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent
	]
});

client.once(Events.ClientReady, (readyClient) => {
	logger.info(`Logged in as ${readyClient.user?.tag}`);
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

server.listen(port, async () => {
	await DB();
	
	// Start admin activity cron job
	startAdminActivityCron();

	// Start relic hodl cron job
	startRelicHodlCron();

	if (BOT_TOKEN) {
		await client.login(BOT_TOKEN);
	} else {
		logger.warn("BOT_TOKEN not set – Discord bot disabled");
	}  logger.info(`Server is running on port ${port}`);

  // Fire-and-forget Redis init; initRedis() resolves once the connect either
  // succeeds or hits REDIS_CONNECT_TIMEOUT_MS (default 5s). Never blocks the
  // HTTP server so cache outages can never blackhole startup again.
  initRedis().catch((error: any) =>
    logger.error(`❌ initRedis crashed unexpectedly: ${error?.message}`),
  );
});

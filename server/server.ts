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
	
	const alreadySentMessage = await firstMessage.findOne({ user_id });

	if (!alreadySentMessage) {
		await firstMessage.create({
			user_id,
			guild_id,
			channel_id,
		});
	}
});

server.listen(port, async () => {
	await DB();
	
	// Start admin activity cron job
	startAdminActivityCron();
	
	if (BOT_TOKEN) {
		await client.login(BOT_TOKEN);
	} else {
		logger.warn("BOT_TOKEN not set – Discord bot disabled");
	}
	logger.info(`Server is running on port ${port}`);
});

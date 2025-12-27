import * as dotenv from "dotenv";

dotenv.config({ quiet: true });

export const port = process.env.PORT || "5600";
export const DB_URI = process.env.DB_URI as string;
export const environment = process.env.ENVIRONMENT as "development" | "production";
export const network = process.env.NETWORK as "testnet" | "mainnet" | undefined;
export const JWT_SECRET = process.env.JWT_SECRET as string;
export const REFRESH_SECRET = process.env.REFRESH_SECRET as string;
export const DISCORD_JWT_SECRET = process.env.DISCORD_JWT_SECRET as string;
export const PRIVATE_KEY = process.env.PRIVATE_KEY as `0x${string}`;
export const AWS_REGION = process.env.AWS_REGION as string;
export const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY as string;
export const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID as string;
export const AWS_S3_BUCKET = process.env.AWS_S3_BUCKET as string;
export const CLIENT_ID = process.env.CLIENT_ID as string;
export const MAIN_REDIRECT_URI = process.env.MAIN_REDIRECT_URI as string;
export const DEV_REDIRECT_URI = process.env.DEV_REDIRECT_URI as string;
export const CLIENT_REDIRECT_URI = process.env.CLIENT_REDIRECT_URI as string;
export const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET as string;
export const BOT_TOKEN = process.env.BOT_TOKEN as string;

export const REDIRECT_URI = environment === "development" ? DEV_REDIRECT_URI : MAIN_REDIRECT_URI;

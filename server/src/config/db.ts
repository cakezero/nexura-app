import mongoose from "mongoose";
import { DB_URI } from "@/utils/env.utils";
import logger from "./logger";

const connectDB = async () => {
	try {
		const connect = await mongoose.connect(DB_URI, { family: 4 });
		logger.info(
			`\x1b[36m%s\x1b[0m`,
			`DB: MongoDB Connected: ${connect.connection.host}`
		);
	} catch (error: any) {
		logger.error(
			`\x1b[31m%s\x1b[0m`,
			`DB: MongoDB Connection Failure: ${error.message}`
		);
		// Do not exit — let the server keep running so other routes are accessible
	}
};

export default connectDB;

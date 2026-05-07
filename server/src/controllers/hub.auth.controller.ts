import { BAD_REQUEST, OK, INTERNAL_SERVER_ERROR, CREATED, NOT_FOUND } from "@/utils/status.utils";
import {
	validateHubAdminData,
	getMissingFields,
	validateSuperAdminData,
	JWT,
	getRefreshToken,
	hashPassword,
	generateOTP
} from "@/utils/utils";
import logger from "@/config/logger";
import { server } from "@/models/server.model";
import { uploadImg } from "@/utils/img.utils";
import {
	CLIENT_URL,
	DISCORD_HUB_CLIENT_REDIRECT_URI,
	DISCORD_HUB_REDIRECT_URI,
	DISCORD_CLIENT_ID,
	DISCORD_CLIENT_SECRET,
	BOT_TOKEN,
} from "@/utils/env.utils";
import { hubAdmin, hub, userHubAdmin, userHub } from "@/models/hub.model";
import bcrypt from "bcrypt";
import axios from "axios";
import { resetEmail, resetPasswordOTPEmail } from "@/utils/sendMail";
import { OTP } from "@/models/otp.model";
import { REDIS } from "@/utils/redis.utils";

const headers = {
	"Content-Type": "application/x-www-form-urlencoded",
	"Accept-encoding": "application/x-www-form-urlencoded",
};

export const signIn = async (req: GlobalRequest, res: GlobalResponse) => {
	try {
		const { email, password }: { email: string; password: string } = req.body;

		if (!email || !password) {
			res.status(BAD_REQUEST).json({ error: "send the required data: email and password" });
			return;
		}

		const adminExists = await hubAdmin.findOne({ email }).lean();
		if (!adminExists) {
			res.status(BAD_REQUEST).json({ error: "invalid signin credentials" });
			return;
		}

		const comparePassword = await bcrypt.compare(password, adminExists.password);
		if (!comparePassword) {
			res.status(BAD_REQUEST).json({ error: "invalid signin credentials" });
			return;
		}

		const id = adminExists._id.toString();

		const accessToken = JWT.sign(id);
		const refreshToken = getRefreshToken(id);

		res.cookie("hubRefreshToken", refreshToken, {
			httpOnly: true,
			secure: true,
			maxAge: 30 * 24 * 60 * 60,
		});

		res.status(OK).json({
			message: "signed in!",
			accessToken,
			admin: {
				_id: adminExists._id,
				name: adminExists.name,
				email: adminExists.email,
				role: adminExists.role,
				hub: hubId,
			},
		});
	} catch (error) {
		logger.error(error);
		res
			.status(INTERNAL_SERVER_ERROR)
			.json({ error: "Error signing in" });
	}
};

export const superAdminSignUp = async (req: GlobalRequest, res: GlobalResponse) => {
	try {
		const { error } = validateSuperAdminData(req.body);
		if (error) {
			const missingFields = getMissingFields(error);
			res.status(BAD_REQUEST).json({ error: `these field(s) are/is required: ${missingFields}` });
			return;
    }

    const { name, email, password } = req.body;

    const emailExists = await hubAdmin.exists({ email: email.trim().toLowerCase() });
    if (emailExists) {
      res.status(BAD_REQUEST).json({ error: "An account with this email already exists. Please sign in instead." });
      return;
    }

    const hashedPassword = await hashPassword(password);

		const superAdmin = await hubAdmin.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      role: "superadmin",
    });

		const accessToken = JWT.sign(superAdmin._id.toString());
		const refreshToken = getRefreshToken(superAdmin._id.toString());

		res.cookie("hubRefreshToken", refreshToken, {
			httpOnly: true,
			secure: true,
			maxAge: 30 * 24 * 60 * 60,
		});

		res.status(CREATED).json({ message: "super admin created", accessToken });
	} catch (error: any) {
		logger.error(error);
		const isDuplicate = error?.code === 11000;
		res.status(isDuplicate ? BAD_REQUEST : INTERNAL_SERVER_ERROR).json({
      error: isDuplicate ? "An account with this email already exists. Please sign in instead." : "Error creating super admin",
    });
	}
}

export const hubDiscordCallback = async (req: GlobalRequest, res: GlobalResponse) => {
	try {
		const { code } = req.query as { code: string };

		if (!code) {
			res.send("Please sign-in/connect discord again");
			return;
		}

		const params = new URLSearchParams({
			client_id: DISCORD_CLIENT_ID,
			client_secret: DISCORD_CLIENT_SECRET,
			redirect_uri: DISCORD_HUB_REDIRECT_URI,
			code,
			grant_type: "authorization_code",
		});

		const { data: { access_token, refresh_token } } = await axios.post("https://discord.com/api/v10/oauth2/token", params, { headers });

		const { data } = await axios.get("https://discord.com/api/v10/users/@me/guilds", {
			headers: {
				...headers,
				Authorization: `Bearer ${access_token}`,
			}
		});

		const serversCreated = await server.create({ servers: data });

		res.redirect(DISCORD_HUB_CLIENT_REDIRECT_URI + `?id=${serversCreated._id}`);
	} catch (error: any) {
		console.error(error);
		console.error("DISCORD HUB TOKEN ERROR STATUS:", error.response?.status);
		console.error("DISCORD HUB TOKEN ERROR DATA:", error.response?.data);
		res.status(INTERNAL_SERVER_ERROR).json({ error: "Error signing in with discord" });
	}
}

export const fetchServers = async (req: GlobalRequest, res: GlobalResponse) => {
	try {
		const { id } = req.query as { id: string };
		if (!id) {
			res.status(BAD_REQUEST).json({ error: "discord session id is required" });
			return;
		}

		const discordServers = await server.findById(id);
		if (!discordServers) {
			res.status(INTERNAL_SERVER_ERROR).json({ error: "kindly authenticate your discord" });
			return;
		}

		res.json({ message: "servers fetched", servers: discordServers.servers });
	} catch (error) {
		logger.error(error);
		res.status(INTERNAL_SERVER_ERROR).json({ error: "Error fetching discord servers" });
	}
}

export const fetchRoles = async (req: GlobalRequest, res: GlobalResponse) => {
	try {
		const { id, serverId } = req.query as { id: string; serverId: string };
		if (!id || !serverId) {
			res.status(BAD_REQUEST).json({ error: "discord session id and server id are required" });
			return;
		}

		const discordServers = await server.findById(id);
		if (!discordServers) {
			res.status(INTERNAL_SERVER_ERROR).json({ error: "kindly authenticate your discord" });
			return;
		}

		const { data } = await axios.get(`https://discord.com/api/v10/guilds/${serverId}/roles`, {
			headers: {
				...headers,
				Authorization: `Bot ${BOT_TOKEN}`,
			}
		});

		res.json({ message: "roles fetched", roles: data });
	} catch (error: any) {
		console.error(error);
		console.error("DISCORD HUB TOKEN ERROR STATUS:", error.response?.status);
		console.error("DISCORD HUB TOKEN ERROR DATA:", error.response?.data);
		res.status(INTERNAL_SERVER_ERROR).json({ error: "Error fetching discord roles" });
	}
}

export const fetchChannels = async (req: GlobalRequest, res: GlobalResponse) => {
	try {
		const { id, serverId } = req.query as { id: string; serverId: string };
		if (!id || !serverId) {
			res.status(BAD_REQUEST).json({ error: "discord session id and server id are required" });
			return;
		}

		const discordServers = await server.findById(id);
		if (!discordServers) {
			res.status(INTERNAL_SERVER_ERROR).json({ error: "kindly authenticate your discord" });
			return;
		}

		const { data } = await axios.get(`https://discord.com/api/v10/guilds/${serverId}/channels`, {
			headers: {
				...headers,
				Authorization: `Bot ${BOT_TOKEN}`,
			}
		});

		const channels = Array.isArray(data)
			? data
				.filter((channel: any) => channel && [0, 5].includes(Number(channel.type)))
				.map((channel: any) => ({ id: channel.id, name: channel.name, type: channel.type }))
			: [];

		res.json({ message: "channels fetched", channels });
	} catch (error: any) {
		console.error(error);
		console.error("DISCORD HUB CHANNELS ERROR STATUS:", error.response?.status);
		console.error("DISCORD HUB CHANNELS ERROR DATA:", error.response?.data);
		res.status(INTERNAL_SERVER_ERROR).json({ error: "Error fetching discord channels" });
	}
}

export const hubAdminSignUp = async (req: GlobalRequest, res: GlobalResponse) => {
	try {

		const { email, code } = req.body;
		const { error } = validateHubAdminData(req.body);

		if (error) {
			const missingFields = getMissingFields(error);
			res.status(BAD_REQUEST).json({ error: `these field(s) are/is required: ${missingFields}` });
			return;
		}

		const otp = await OTP.findOne({ code, email }).lean();
		if (!otp) {
			res.status(BAD_REQUEST).json({ error: "otp has expired" });
			return;
		}

		const now = new Date();

		if (otp.expiresAt < now) {
			res.status(BAD_REQUEST).json({ error: "otp has expired" });
			return;
		};

		const adminExists = await hubAdmin.findOne({ email }).lean();
		if (adminExists) {
			res.status(BAD_REQUEST).json({ error: "email is already in use" });
			return;
		}

		req.body.hub = otp.hubId;
		req.body.role = otp.role || "admin";
		req.body.password = await hashPassword(req.body.password);

		const admin = await hubAdmin.create(req.body);

		const id = admin._id.toString();

		const accessToken = JWT.sign(id);
		const refreshToken = getRefreshToken(id);

		res.cookie("hubRefreshToken", refreshToken, {
			httpOnly: true,
			secure: true,
			maxAge: 30 * 24 * 60 * 60,
		});

		await OTP.deleteOne({ code });

		res.status(OK).json({
			message: "hub admin signed up!",
			accessToken,
			admin: {
				_id: admin._id,
				name: admin.name,
				email: admin.email,
				role: admin.role,
				hub: admin.hub,
			},
		});
	} catch (error) {
		logger.error(error);
		res
			.status(INTERNAL_SERVER_ERROR)
			.json({ error: "Error signing up hub admin" });
	}
};

export const forgotPassword = async (req: GlobalRequest, res: GlobalResponse) => {
	try {
		const { email } = req.body;

		if (!email) {
			res.status(BAD_REQUEST).json({ error: "email is required" });
			return;
		}

		const hubAdminExists = await hubAdmin.findOne({ email: email.trim().toLowerCase() }).lean();
		if (!hubAdminExists) {
			res.status(NOT_FOUND).json({ error: "email associated with admin is invalid or does not exist" });
			return;
		}

		const code = generateOTP();
		const hubId = hubAdminExists.hub?.toString();

		await OTP.findOneAndUpdate(
			{ email: hubAdminExists.email },
			{
				email: hubAdminExists.email,
				code,
				hubId,
				expiresAt: new Date(Date.now() + 5 * 60 * 1000),
			},
			{ upsert: true, new: true, setDefaultsOnInsert: true }
		);

		await resetPasswordOTPEmail(hubAdminExists.email, code);

		res.status(OK).json({ message: "password reset code sent!" });
	} catch (error: any) {
		logger.error(error);
		res
			.status(INTERNAL_SERVER_ERROR)
			.json({ error: "Error sending password reset code" });
	}
};

export const resetPassword = async (req: GlobalRequest, res: GlobalResponse) => {
	try {
		const { email, code, password } = req.body;

		if (!email || !code || !password) {
			res.status(BAD_REQUEST).json({ error: "email, code, and password are required" });
			return;
		}

		const otp = await OTP.findOne({ email: email.trim().toLowerCase(), code }).lean();
		if (!otp) {
			res.status(BAD_REQUEST).json({ error: "invalid or expired code" });
			return;
		}

		const adminExists = await hubAdmin.findOne({ email: email.trim().toLowerCase() });
		if (!adminExists) {
			res.status(NOT_FOUND).json({ error: "admin not found" });
			return;
		}

		const hashedPassword = await hashPassword(password);

		adminExists.password = hashedPassword;
		await adminExists.save();

		await OTP.deleteOne({ _id: otp._id });

		const id = adminExists._id.toString();
		const accessToken = JWT.sign(id);
		const refreshToken = getRefreshToken(id);

		res.cookie("hubRefreshToken", refreshToken, {
			httpOnly: true,
			secure: true,
			maxAge: 30 * 24 * 60 * 60,
		});

		res.status(OK).json({
			message: "admin password reset successful!",
			accessToken,
			admin: {
				_id: adminExists._id,
				name: adminExists.name,
				email: adminExists.email,
				role: adminExists.role,
				hub: hubId,
			},
		});
	} catch (error) {
		logger.error(error);
		res
			.status(INTERNAL_SERVER_ERROR)
			.json({ error: "Error resetting admin password" });
	}
};

export const logout = async (req: GlobalRequest, res: GlobalResponse) => {
	try {

		const { token } = req;

		await REDIS.set({ key: `logout:${token}`, data: { token }, ttl: 7 * 24 * 60 * 60 });

		res.clearCookie("hubRefreshToken");
		res.status(OK).json({ message: "admin logged out!" });
	} catch (error) {
		logger.error(error);
		res
			.status(INTERNAL_SERVER_ERROR)
			.json({ error: "Error logging out admin" });
	}
};

export const userHubSignIn = async (req: GlobalRequest, res: GlobalResponse) => {
	try {
		const { email, password }: { email: string; password: string } = req.body;

		if (!email || !password) {
			res.status(BAD_REQUEST).json({ error: "send the required data: email and password" });
			return;
		}

		const adminExists = await userHubAdmin.findOne({ email }).lean();
		if (!adminExists) {
			res.status(BAD_REQUEST).json({ error: "invalid signin credentials" });
			return;
		}

		const comparePassword = await bcrypt.compare(password, adminExists.password);
		if (!comparePassword) {
			res.status(BAD_REQUEST).json({ error: "invalid signin credentials" });
			return;
		}

		const id = adminExists._id.toString();

    // Auto-create hub if admin has none
    let hubId = adminExists.hub;
    if (!hubId) {
      const createdHub = await userHub.create({
        name: adminExists.name,
        description: "",
        website: "",
        xAccount: "",
        logo: "",
        superAdmin: adminExists._id,
      });
      hubId = createdHub._id;
      await userHubAdmin.findByIdAndUpdate(adminExists._id, { hub: hubId });
    }

		const accessToken = JWT.sign(id);
		const refreshToken = getRefreshToken(id);

		res.cookie("userHubRefreshToken", refreshToken, {
			httpOnly: true,
			secure: true,
			maxAge: 30 * 24 * 60 * 60,
		});

		res.status(OK).json({
			message: "signed in!",
			accessToken,
			admin: {
				_id: adminExists._id,
				name: adminExists.name,
				email: adminExists.email,
				hub: adminExists.hub,
			},
		});
	} catch (error) {
		logger.error(error);
		res
			.status(INTERNAL_SERVER_ERROR)
			.json({ error: "Error signing in" });
	}
};

export const userHubAdminSignUp = async (req: GlobalRequest, res: GlobalResponse) => {
	try {
		const { error } = validateSuperAdminData(req.body);
		if (error) {
			const missingFields = getMissingFields(error);
			res.status(BAD_REQUEST).json({ error: `these field(s) are/is required: ${missingFields}` });
			return;
    }

    const { name, email, password } = req.body;

    const emailExists = await userHubAdmin.exists({ email: email.trim().toLowerCase() });
    if (emailExists) {
      res.status(BAD_REQUEST).json({ error: "An account with this email already exists. Please sign in instead." });
      return;
    }

    const hashedPassword = await hashPassword(password);

		const superAdmin = await userHubAdmin.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
    });

    // Create a hub for the new admin immediately
    const createdHub = await userHub.create({
      name: name.trim(),
      description: "",
      website: "",
      xAccount: "",
      logo: "",
      superAdmin: superAdmin._id,
    });

    // Link the hub to the admin
    await userHubAdmin.findByIdAndUpdate(superAdmin._id, { hub: createdHub._id });

		const accessToken = JWT.sign(superAdmin._id.toString());
		const refreshToken = getRefreshToken(superAdmin._id.toString());

		res.cookie("userHubRefreshToken", refreshToken, {
			httpOnly: true,
			secure: true,
			maxAge: 30 * 24 * 60 * 60,
		});

		res.status(CREATED).json({ message: "user hub admin created", accessToken, admin: { _id: superAdmin._id.toString(), name: superAdmin.name, email: superAdmin.email, role: "superadmin", hub: createdHub._id.toString() } });
	} catch (error: any) {
		logger.error(error);
		const isDuplicate = error?.code === 11000;
		res.status(isDuplicate ? BAD_REQUEST : INTERNAL_SERVER_ERROR).json({
      error: isDuplicate ? "An account with this email already exists. Please sign in instead." : "Error creating super admin",
    });
	}
}

export const userHubLogout = async (req: GlobalRequest, res: GlobalResponse) => {
  try {

		const { token } = req;

		await REDIS.set({ key: `logout:${token}`, data: { token }, ttl: 7 * 24 * 60 * 60 });

		res.clearCookie("userHubRefreshToken");
		res.status(OK).json({ message: "user hub admin logged out!" });
	} catch (error) {
		logger.error(error);
		res
			.status(INTERNAL_SERVER_ERROR)
			.json({ error: "Error logging out user hub admin" });
	}
}

export const userHubForgotPassword = async (req: GlobalRequest, res: GlobalResponse) => {
	try {
		const { email } = req.body;

		if (!email) {
			res.status(BAD_REQUEST).json({ error: "email is required" });
			return;
		}

		const hubAdminExists = await userHubAdmin.findOne({ email: email.trim().toLowerCase() }).lean();
		if (!hubAdminExists) {
			res.status(NOT_FOUND).json({ error: "email associated with admin is invalid or does not exist" });
			return;
		}

		const code = generateOTP();
		const hubId = hubAdminExists.hub?.toString();

		await OTP.findOneAndUpdate(
			{ email: hubAdminExists.email },
			{
				email: hubAdminExists.email,
				code,
				hubId,
				expiresAt: new Date(Date.now() + 5 * 60 * 1000),
			},
			{ upsert: true, new: true, setDefaultsOnInsert: true }
		);

		await resetPasswordOTPEmail(hubAdminExists.email, code);

		res.status(OK).json({ message: "password reset code sent!" });
	} catch (error) {
		logger.error(error);
		res
			.status(INTERNAL_SERVER_ERROR)
			.json({ error: "Error sending password reset code" });
	}
};

export const userHubResetPassword = async (req: GlobalRequest, res: GlobalResponse) => {
	try {
		const { email, code, password } = req.body;

		if (!email || !code || !password) {
			res.status(BAD_REQUEST).json({ error: "email, code, and password are required" });
			return;
		}

		const otp = await OTP.findOne({ email: email.trim().toLowerCase(), code }).lean();
		if (!otp) {
			res.status(BAD_REQUEST).json({ error: "invalid or expired code" });
			return;
		}

		const adminExists = await userHubAdmin.findOne({ email: email.trim().toLowerCase() });
		if (!adminExists) {
			res.status(NOT_FOUND).json({ error: "admin not found" });
			return;
		}

		const hashedPassword = await hashPassword(password);

		adminExists.password = hashedPassword;
		await adminExists.save();

		await OTP.deleteOne({ _id: otp._id });

		const id = adminExists._id.toString();
		const accessToken = JWT.sign(id);
		const refreshToken = getRefreshToken(id);

		res.cookie("userHubRefreshToken", refreshToken, {
			httpOnly: true,
			secure: true,
			maxAge: 30 * 24 * 60 * 60,
		});

		res.status(OK).json({
			message: "admin password reset successful!",
			accessToken,
			admin: {
				_id: adminExists._id,
				name: adminExists.name,
				email: adminExists.email,
				hub: adminExists.hub,
			},
		});
	} catch (error) {
		logger.error(error);
		res
			.status(INTERNAL_SERVER_ERROR)
			.json({ error: "Error resetting admin password" });
	}
};
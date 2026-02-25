import { BAD_REQUEST, OK, INTERNAL_SERVER_ERROR, CREATED, NOT_FOUND } from "@/utils/status.utils";
import {
  validateHubAdminData,
  getMissingFields,
  validateSuperAdminData,
  JWT,
  getRefreshToken,
  hashPassword
} from "@/utils/utils";
import logger from "@/config/logger";
import { uploadImg } from "@/utils/img.utils";
import { CLIENT_URL } from "@/utils/env.utils";
import { hubAdmin, hub } from "@/models/hub.model";
import bcrypt from "bcrypt";
import { resetEmail } from "@/utils/sendMail";
import { OTP } from "@/models/otp.model";
import { REDIS } from "@/utils/redis.utils";

export const signIn = async (req: GlobalRequest, res: GlobalResponse) => {
	try {
		const { email, password }: { email: string; password: string } = req.body;

		if (!email || !password) {
			res.status(BAD_REQUEST).json({ error: "send the required data: email and password" });
			return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const adminExists = await hubAdmin.findOne({ email: normalizedEmail }).lean();
    if (!adminExists) {
      res.status(BAD_REQUEST).json({ error: "invalid signin credentials" });
      return;
    }

    const comparePassword = await bcrypt.compare(password, adminExists.password);
    if (!comparePassword) {
      // Migration fallback: accounts created while password hashing was broken
      // stored passwords as plain text — migrate them on successful plain-text match
      if (password === adminExists.password) {
        // Rehash and persist the corrected password
        const hashedPassword = await hashPassword(password);
        await hubAdmin.findByIdAndUpdate(adminExists._id, { password: hashedPassword });
      } else {
        res.status(BAD_REQUEST).json({ error: "invalid signin credentials" });
        return;
      }
    }

    const id = adminExists._id.toString();

    // Auto-create a hub for accounts that were created before the hub-creation fix
    if (!adminExists.hub) {
      const existingHub = await hub.findOne({ superAdmin: adminExists._id }).lean();
      if (existingHub) {
        await hubAdmin.findByIdAndUpdate(adminExists._id, { hub: existingHub._id });
      } else {
        const newHub = await hub.create({
          name: adminExists.name,
          address: (adminExists as any).address || `0x${id}`,
          logo: (adminExists as any).logo || "",
          description: (adminExists as any).description || "",
          superAdmin: adminExists._id,
          xpAllocated: 0,
          campaignsCreated: 0,
        });
        await hubAdmin.findByIdAndUpdate(adminExists._id, { hub: newHub._id });
      }
    }

		const accessToken = JWT.sign(id);
		const refreshToken = getRefreshToken(id);

		res.cookie("refreshToken", refreshToken, {
			httpOnly: true,
			secure: true,
			maxAge: 30 * 24 * 60 * 60,
		});

		res.status(OK).json({ message: "signed in!", accessToken });
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

    const { name, email, password, address, description } = req.body;
    const normalizedEmail = (email as string).toLowerCase().trim();

    const existingAdmin = await hubAdmin.findOne({ email: normalizedEmail }).lean();
    if (existingAdmin) {
      res.status(BAD_REQUEST).json({ error: "email is already in use" });
      return;
    }

    const existingHub = await hub.findOne({
      $or: [
        { name: (name as string).trim() },
        ...(address ? [{ address }] : []),
      ],
    }).lean();
    if (existingHub) {
      res.status(BAD_REQUEST).json({ error: "a hub with that name or address already exists" });
      return;
    }

    // Upload logo if provided
    let logoUrl = "";
    if (req.file) {
      logoUrl = await uploadImg({
        file: req.file.buffer,
        filename: req.file.originalname,
        folder: "hub-logos",
      });
    }

    const hashedPassword = await hashPassword(password);

    // Create the superadmin user first (without hub reference — added after hub is created)
    const newAdmin = await hubAdmin.create({
      name: (name as string).trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: "superadmin",
      address: address ?? "",
      logo: logoUrl,
      description: description ?? "",
    });

    // Create the hub entity linked to this superadmin
    const newHub = await hub.create({
      name: (name as string).trim(),
      address: address ?? "",
      logo: logoUrl,
      description: description ?? "",
      superAdmin: newAdmin._id,
      xpAllocated: 0,
      campaignsCreated: 0,
    });

    // Link the admin back to its hub
    await hubAdmin.findByIdAndUpdate(newAdmin._id, { hub: newHub._id });

    const id = newAdmin._id.toString();
    const accessToken = JWT.sign(id);
    const refreshToken = getRefreshToken(id);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      maxAge: 30 * 24 * 60 * 60,
    });

    res.status(CREATED).json({
      accessToken,
      project: { name: newAdmin.name, logo: logoUrl },
    });
  } catch (error) {
    logger.error(error);
    res.status(INTERNAL_SERVER_ERROR).json({ error: "error creating super admin" });
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
    req.body.role = "admin";

		const admin = await hubAdmin.create(req.body);

		const id = admin._id.toString();

		const accessToken = JWT.sign(id);
		const refreshToken = getRefreshToken(id);

		res.cookie("refreshToken", refreshToken, {
			httpOnly: true,
			secure: true,
			maxAge: 30 * 24 * 60 * 60,
    });

		await OTP.deleteOne({ code });

		res.status(OK).json({ message: "hub admin signed up!", accessToken });
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

    const hubAdminExists = await hubAdmin.findOne({ email }).lean();
    if (!hubAdminExists) {
      res.status(NOT_FOUND).json({ error: "email associated with admin is invalid or does not exist" });
      return;
    }

    const id = hubAdminExists._id.toString();
    const clientLink = `${CLIENT_URL}/hub/reset-password?token=`;

		const token = JWT.sign(id, "10m");
		const link = clientLink + token;

		await resetEmail(email, link);

		res.status(OK).json({ message: "password reset email sent!" });
	} catch (error) {
		logger.error(error);
		res
			.status(INTERNAL_SERVER_ERROR)
			.json({ error: "Error sending password reset email" });
	}
};

export const resetPassword = async (req: GlobalRequest, res: GlobalResponse) => {
	try {
		const { token, password } = req.body;

		if (!token || !password) {
			res.status(BAD_REQUEST).json({ error: "send token and password" });
			return;
    }

    const accessTokenUsed = await REDIS.get(`reset-access-token:${token}`);
    if (accessTokenUsed) {
      res.status(BAD_REQUEST).json({ error: "access token already used, request a new one to change your password" });
      return;
  	}

    const { id } = await JWT.verify(token) as { id: string };

		const adminExists = await hubAdmin.findById(id);
		if (!adminExists) {
			res.status(BAD_REQUEST).json({ error: "id associated with admin is invalid" });
			return;
    }

    const hashedPassword = await hashPassword(password);

		adminExists.password = hashedPassword;
		await adminExists.save();

		await REDIS.set({ key: `reset-access-token:${token}`, data: { token }, ttl: 10 * 60 });

		res.status(OK).json({ message: "admin password reset successful!" });
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

		res.clearCookie("refreshToken");
		res.status(OK).json({ message: "admin logged out!" });
	} catch (error) {
		logger.error(error);
		res
			.status(INTERNAL_SERVER_ERROR)
			.json({ error: "Error logging out admin" });
	}
};

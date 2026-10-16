import { OTP } from "@/models/otp.model";
import { hubAdmin } from "@/models/hub.model";
import { addHubAdminEmail } from "@/utils/sendMail";
import { generateOTP } from "@/utils/utils";
import { CLIENT_URL } from "@/utils/env.utils";
import { BAD_REQUEST, INTERNAL_SERVER_ERROR } from "@/utils/status.utils";

/** Error with the HTTP status the caller should respond with. */
export class InviteError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/**
 * Creates (or refreshes) a hub admin invitation and emails it.
 * If the email can't be sent, the invitation is rolled back and the error is rethrown.
 */
export async function createHubInvite({ hubId, email, role, clientUrl }: {
  hubId: string;
  email: string;
  role?: string;
  clientUrl?: string;
}): Promise<void> {
  if (!email) throw new InviteError(BAD_REQUEST, "admin email is required");
  if (!hubId) throw new InviteError(BAD_REQUEST, "create a hub to continue");

  const validRole = role === "superadmin" ? "superadmin" : "admin";
  const normalizedEmail = String(email).trim().toLowerCase();

  const existingAdmin = await hubAdmin.findOne({ email: normalizedEmail }).lean();
  if (existingAdmin) throw new InviteError(BAD_REQUEST, "email is already in use");

  let code = "";
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = generateOTP();
    const codeExists = await OTP.exists({ code: candidate });
    if (!codeExists) {
      code = candidate;
      break;
    }
  }
  if (!code) throw new InviteError(INTERNAL_SERVER_ERROR, "Failed to generate invite code");

  const existingInvite = await OTP.findOne({ email: normalizedEmail, hubId }).lean();

  await OTP.findOneAndUpdate(
    { email: normalizedEmail, hubId },
    {
      email: normalizedEmail,
      code,
      hubId,
      role: validRole,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // Use the client's origin for the invite link so it works in dev/prod
  const origin = clientUrl || CLIENT_URL;
  try {
    await addHubAdminEmail(normalizedEmail, code, origin);
  } catch (error) {
    if (existingInvite) {
      await OTP.findOneAndUpdate(
        { email: normalizedEmail, hubId },
        { code: existingInvite.code, role: existingInvite.role, expiresAt: existingInvite.expiresAt }
      );
    } else {
      await OTP.deleteOne({ email: normalizedEmail, hubId });
    }
    throw error;
  }
}

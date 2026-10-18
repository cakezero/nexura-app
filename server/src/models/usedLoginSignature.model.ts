import mongoose from "mongoose";

/** Wallet sign-in signatures already used, so a captured one can't sign in again. Removed after they expire. */
const usedLoginSignatureSchema = new mongoose.Schema({
  hash: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true, expires: 0 },
});

export const usedLoginSignature = mongoose.model("used-login-signatures", usedLoginSignatureSchema);

import mongoose from "mongoose";

const verifiedEmailSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  }
}, { timestamps: true });

export const verifiedEmail = mongoose.model("verified-email", verifiedEmailSchema);

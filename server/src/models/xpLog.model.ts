import mongoose from "mongoose";

const xpLogSchema = new mongoose.Schema({
  address: { type: String, required: true, lowercase: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ["success", "failed"], required: true },
  type: { type: String, enum: ["single", "batch"], required: true },
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: "admin" },
  timestamp: { type: Date, default: Date.now }
});

export const xpLog = mongoose.model("xpLog", xpLogSchema);

import mongoose, { Schema } from "mongoose";

const graphContributionSchema = new Schema({
  key: { type: String, required: true, unique: true },
  kind: { type: String, enum: ["joined", "finished"], required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
  address: { type: String, required: true },
  campaign: { type: mongoose.Schema.Types.ObjectId, ref: "campaign", required: true },
  status: { type: String, enum: ["pending", "written", "failed"], default: "pending" },
  tripleId: { type: String, default: null },
  txHash: { type: String, default: null },
  attempts: { type: Number, default: 0 },
  lastError: { type: String, default: null },
  writtenAt: { type: Date, default: null },
}, { timestamps: true });

graphContributionSchema.index({ status: 1, createdAt: 1 });

export const graphContribution = mongoose.model("graph-contributions", graphContributionSchema);

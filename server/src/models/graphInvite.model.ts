import mongoose, { Schema } from "mongoose";

const graphInviteSchema = new Schema({
  campaign: { type: mongoose.Schema.Types.ObjectId, ref: "campaign", required: true },
  inviter: { type: String, required: true },
  invitee: { type: String, required: true },
  status: { type: String, enum: ["pending", "paid"], default: "pending" },
  amount: { type: String, default: null },
  txHash: { type: String, default: null },
  paidAt: { type: Date, default: null },
}, { timestamps: true });

graphInviteSchema.index({ campaign: 1, invitee: 1 }, { unique: true });
graphInviteSchema.index({ inviter: 1, createdAt: -1 });
graphInviteSchema.index({ txHash: 1 }, { unique: true, partialFilterExpression: { txHash: { $type: "string" } } });

export const graphInvite = mongoose.model("graph-invites", graphInviteSchema);

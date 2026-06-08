import mongoose from "mongoose";

const tokenModelSchema = new mongoose.Schema({
  tokenId: {
    type: String,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true
  },
  nft: {
    type: String,
    required: true
  }
}, { timestamps: true });

export const tokenModel = mongoose.model("token-model", tokenModelSchema);
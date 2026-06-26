import mongoose from "mongoose";

const ecosystemDappSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  category: {
    type: String,
    required: true,
    enum: ["defi", "nft", "gaming", "social", "tooling", "other"],
    default: "other",
  },
  image: {
    type: String,
    required: true,
  },
  link: {
    type: String,
    required: true,
  },
  xpReward: {
    type: Number,
    required: true,
    default: 0,
  },
  isLegacy: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

export const ecosystemDapp = mongoose.model("ecosystem-dapps", ecosystemDappSchema);

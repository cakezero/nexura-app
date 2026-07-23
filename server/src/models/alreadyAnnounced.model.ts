import mongoose from "mongoose";

const alreadyAnnouncedSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true
  },
  discordId: {
    type: String,
    required: true
  },
  milestone: {
    type: Number,
    required: true
  }
}, { timestamps: true });

export const alreadyAnnounced = mongoose.model("already-announced", alreadyAnnouncedSchema);
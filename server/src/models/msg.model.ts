import mongoose from "mongoose";

const firstMessageSchema = new mongoose.Schema({
  user_id: {
    type: String,
    required: true,
  },
  guild_id: {
    type: String,
    required: true,
  },
  channel_id: {
    type: String,
    required: false,
  }
}, { timestamps: true });

// Per-channel uniqueness: a user can have one record per {user_id, guild_id, channel_id}.
// This allows the same user to be tracked independently across different channels
// within the same guild (needed for send-message-discord task verification).
firstMessageSchema.index(
  { user_id: 1, guild_id: 1, channel_id: 1 },
  { unique: true, name: "user_guild_channel_unique" },
);

export const firstMessage = mongoose.model("first-msgs", firstMessageSchema);

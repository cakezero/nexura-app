import mongoose from "mongoose";

const tokenModelSchema = new mongoose.Schema({
  
}, { timestamps: true });

export const tokenModel = mongoose.model("token-model", tokenModelSchema);
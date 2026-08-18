import mongoose from "mongoose";

const providerTokenStoreSchema = new mongoose.Schema(
  {
    providerName: {
      type: String,
      required: true,
      unique: true,
    },
    accessToken: {
      type: String,
    },
    refreshToken: {
      type: String,
    },
    expiresAt: {
      type: Date,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.model("ProviderTokenStore", providerTokenStoreSchema);

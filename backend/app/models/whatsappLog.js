import mongoose from "mongoose";
import { WHATSAPP_MESSAGE_STATUS } from "../constants/whatsapp.js";

const whatsappLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    orderId: {
      type: String,
      trim: true,
      index: true,
    },
    shipmentId: {
      type: String,
      trim: true,
      index: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    eventType: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    templateName: {
      type: String,
      required: true,
      trim: true,
    },
    templateLanguage: {
      type: String,
      default: "en",
    },
    templateParams: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    messageId: {
      type: String,
      trim: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(WHATSAPP_MESSAGE_STATUS),
      default: WHATSAPP_MESSAGE_STATUS.PENDING,
      index: true,
    },
    sentAt: {
      type: Date,
      default: null,
      index: true,
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
    readAt: {
      type: Date,
      default: null,
    },
    failedAt: {
      type: Date,
      default: null,
    },
    errorCode: {
      type: String,
      default: "",
    },
    errorMessage: {
      type: String,
      default: "",
    },
    dedupeKey: {
      type: String,
      default: "",
      unique: true,
      sparse: true,
      index: true,
    },
    isMock: {
      type: Boolean,
      default: false,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

whatsappLogSchema.index({ createdAt: -1 });
whatsappLogSchema.index({ eventType: 1, status: 1, createdAt: -1 });
whatsappLogSchema.index({ orderId: 1, eventType: 1 });

export default mongoose.models.WhatsAppLog ||
  mongoose.model("WhatsAppLog", whatsappLogSchema);

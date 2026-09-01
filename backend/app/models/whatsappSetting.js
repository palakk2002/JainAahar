import mongoose from "mongoose";
import { DEFAULT_WHATSAPP_EVENT_TOGGLES } from "../constants/whatsapp.js";

const whatsappSettingSchema = new mongoose.Schema(
  {
    enabled: {
      type: Boolean,
      default: true,
    },
    phoneNumberId: {
      type: String,
      default: "",
      trim: true,
    },
    businessAccountId: {
      type: String,
      default: "",
      trim: true,
    },
    eventToggles: {
      orderPlaced: {
        type: Boolean,
        default: DEFAULT_WHATSAPP_EVENT_TOGGLES.orderPlaced,
      },
      orderConfirmed: {
        type: Boolean,
        default: DEFAULT_WHATSAPP_EVENT_TOGGLES.orderConfirmed,
      },
      paymentSuccess: {
        type: Boolean,
        default: DEFAULT_WHATSAPP_EVENT_TOGGLES.paymentSuccess,
      },
      paymentFailed: {
        type: Boolean,
        default: DEFAULT_WHATSAPP_EVENT_TOGGLES.paymentFailed,
      },
      orderPacked: {
        type: Boolean,
        default: DEFAULT_WHATSAPP_EVENT_TOGGLES.orderPacked,
      },
      shipmentCreated: {
        type: Boolean,
        default: DEFAULT_WHATSAPP_EVENT_TOGGLES.shipmentCreated,
      },
      orderShipped: {
        type: Boolean,
        default: DEFAULT_WHATSAPP_EVENT_TOGGLES.orderShipped,
      },
      outForDelivery: {
        type: Boolean,
        default: DEFAULT_WHATSAPP_EVENT_TOGGLES.outForDelivery,
      },
      orderDelivered: {
        type: Boolean,
        default: DEFAULT_WHATSAPP_EVENT_TOGGLES.orderDelivered,
      },
      orderCancelled: {
        type: Boolean,
        default: DEFAULT_WHATSAPP_EVENT_TOGGLES.orderCancelled,
      },
      deliveryFailed: {
        type: Boolean,
        default: DEFAULT_WHATSAPP_EVENT_TOGGLES.deliveryFailed,
      },
      refundInitiated: {
        type: Boolean,
        default: DEFAULT_WHATSAPP_EVENT_TOGGLES.refundInitiated,
      },
      refundCompleted: {
        type: Boolean,
        default: DEFAULT_WHATSAPP_EVENT_TOGGLES.refundCompleted,
      },
    },
    defaultLanguage: {
      type: String,
      default: "en",
    },
    webhookVerified: {
      type: Boolean,
      default: false,
    },
    lastWebhookAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.WhatsAppSetting ||
  mongoose.model("WhatsAppSetting", whatsappSettingSchema);

import mongoose from "mongoose";

const deliveryAssignmentSchema = new mongoose.Schema(
  {
    orderMongoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    orderId: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["broadcasting", "assigned", "superseded", "timeout", "cancelled"],
      default: "broadcasting",
    },
    winnerDeliveryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Delivery",
    },
    radiusMeters: {
      type: Number,
      default: 5000,
    },
    attempt: {
      type: Number,
      default: 1,
    },
    expiresAt: Date,
    candidateIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Delivery",
      },
    ],
    meta: {
      type: mongoose.Schema.Types.Mixed,
    },
    // Third-Party Provider Extensions
    providerName: { type: String, default: "internal" },
    externalShipmentId: { type: String, index: true },
    trackingUrl: { type: String },
    providerStatus: { type: String },
    providerQuote: { type: mongoose.Schema.Types.Mixed },
    webhookEvents: [{ type: mongoose.Schema.Types.Mixed }],
    lastWebhookAt: { type: Date },
    shipmentCreatedAt: { type: Date },
    shipmentCancelledAt: { type: Date },
    failureReason: { type: String },
    retryCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

deliveryAssignmentSchema.index({ orderId: 1, createdAt: -1 });

export default mongoose.model("DeliveryAssignment", deliveryAssignmentSchema);

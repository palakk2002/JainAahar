import mongoose from "mongoose";

const deliveryShipmentSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      index: true,
    },
    orderMongoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
    providerName: {
      type: String,
      required: true,
      index: true,
    },
    externalShipmentId: {
      type: String,
      unique: true,
      sparse: true,
    },
    status: {
      type: String,
      enum: ["pending", "created", "in_transit", "delivered", "cancelled", "failed"],
      default: "pending",
      index: true,
    },
    trackingUrl: {
      type: String,
    },
    label: {
      type: String, // base64 label PDF or URL
    },
    quote: {
      type: mongoose.Schema.Types.Mixed,
    },
    timeline: [
      {
        status: { type: String },
        timestamp: { type: Date, default: Date.now },
        location: { type: mongoose.Schema.Types.Mixed },
        raw: { type: mongoose.Schema.Types.Mixed },
      },
    ],
    etaTimestamp: {
      type: Date,
    },
    webhookLog: [
      {
        receivedAt: { type: Date, default: Date.now },
        payload: { type: mongoose.Schema.Types.Mixed },
        processed: { type: Boolean, default: false },
      },
    ],
    idempotencyKey: {
      type: String,
      unique: true,
      sparse: true,
    },
  },
  { timestamps: true }
);

deliveryShipmentSchema.index({ orderId: 1, providerName: 1 });

export default mongoose.model("DeliveryShipment", deliveryShipmentSchema);

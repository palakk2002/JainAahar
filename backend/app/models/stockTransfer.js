import mongoose from "mongoose";

/**
 * StockTransfer — inter-warehouse stock transfer record.
 *
 * Flow:
 *   REQUESTED → APPROVED → IN_TRANSIT → RECEIVED
 *   (any stage) → CANCELLED
 *
 * Stock movement:
 *   - source warehouse available decreases when APPROVED
 *   - destination warehouse available increases when RECEIVED
 *
 * Every state change generates InventoryTransaction records.
 */

export const TRANSFER_STATUS = Object.freeze({
  REQUESTED: "REQUESTED",
  APPROVED: "APPROVED",
  IN_TRANSIT: "IN_TRANSIT",
  RECEIVED: "RECEIVED",
  CANCELLED: "CANCELLED",
});

export const TRANSFER_TRANSITIONS = {
  [TRANSFER_STATUS.REQUESTED]: [TRANSFER_STATUS.APPROVED, TRANSFER_STATUS.CANCELLED],
  [TRANSFER_STATUS.APPROVED]: [TRANSFER_STATUS.IN_TRANSIT, TRANSFER_STATUS.CANCELLED],
  [TRANSFER_STATUS.IN_TRANSIT]: [TRANSFER_STATUS.RECEIVED, TRANSFER_STATUS.CANCELLED],
  [TRANSFER_STATUS.RECEIVED]: [],
  [TRANSFER_STATUS.CANCELLED]: [],
};

const transferItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    name: { type: String, default: "" },
    sku: { type: String, default: "" },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

const stockTransferSchema = new mongoose.Schema(
  {
    /** Human-readable transfer ID — TRF-XXXXXX */
    transferId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    fromWarehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
      required: true,
      index: true,
    },

    toWarehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: Object.values(TRANSFER_STATUS),
      default: TRANSFER_STATUS.REQUESTED,
      index: true,
    },

    items: [transferItemSchema],

    /** Warehouse user who requested the transfer */
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    /** Admin or warehouse manager who approved */
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    /** Warehouse user at destination who received */
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    requestedAt: { type: Date, default: Date.now },
    approvedAt: { type: Date, default: null },
    inTransitAt: { type: Date, default: null },
    receivedAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },

    cancelReason: { type: String, default: "" },
    notes: { type: String, default: "" },
  },
  { timestamps: true },
);

/** Source warehouse — list pending/active outbound transfers */
stockTransferSchema.index({ fromWarehouse: 1, status: 1, createdAt: -1 });

/** Destination warehouse — list incoming transfers */
stockTransferSchema.index({ toWarehouse: 1, status: 1, createdAt: -1 });

/** Admin overview */
stockTransferSchema.index({ status: 1, createdAt: -1 });

/**
 * Validates whether a transfer status transition is allowed.
 */
export function isValidTransferTransition(from, to) {
  const allowed = TRANSFER_TRANSITIONS[from] || [];
  return allowed.includes(to);
}

export default mongoose.model("StockTransfer", stockTransferSchema);

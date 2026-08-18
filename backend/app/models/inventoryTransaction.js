import mongoose from "mongoose";

/**
 * InventoryTransaction — complete, immutable audit trail for all warehouse stock changes.
 *
 * Every operation that changes WarehouseInventory quantities must create one record here.
 * This model is append-only (never update/delete records).
 *
 * Type enum:
 *   INWARD            — stock received into warehouse
 *   OUTWARD           — stock sent out (non-fulfillment)
 *   ADJUSTMENT_INCREASE — manual adjustment upward
 *   ADJUSTMENT_DECREASE — manual adjustment downward
 *   RESERVATION       — stock reserved for order fulfillment
 *   RESERVATION_RELEASE — reservation reversed (cancellation)
 *   FULFILLMENT       — stock consumed by completed fulfillment
 *   TRANSFER_OUT      — stock moved to another warehouse
 *   TRANSFER_IN       — stock received from another warehouse
 *   DAMAGED           — stock moved to damaged quarantine
 *   RETURN_RESTOCK    — returned item moved back to available
 */

export const INVENTORY_TRANSACTION_TYPES = Object.freeze({
  INWARD: "INWARD",
  OUTWARD: "OUTWARD",
  ADJUSTMENT_INCREASE: "ADJUSTMENT_INCREASE",
  ADJUSTMENT_DECREASE: "ADJUSTMENT_DECREASE",
  RESERVATION: "RESERVATION",
  RESERVATION_RELEASE: "RESERVATION_RELEASE",
  FULFILLMENT: "FULFILLMENT",
  TRANSFER_OUT: "TRANSFER_OUT",
  TRANSFER_IN: "TRANSFER_IN",
  DAMAGED: "DAMAGED",
  RETURN_RESTOCK: "RETURN_RESTOCK",
});

const inventoryTransactionSchema = new mongoose.Schema(
  {
    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
      required: true,
      index: true,
    },

    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },

    /** Mirrors Product.sku for display without a join */
    sku: {
      type: String,
      trim: true,
      default: "",
    },

    type: {
      type: String,
      enum: Object.values(INVENTORY_TRANSACTION_TYPES),
      required: true,
      index: true,
    },

    /** Positive = increase, negative = decrease */
    quantity: {
      type: Number,
      required: true,
    },

    /** Inventory quantity in the affected stock bucket before this operation */
    beforeQty: {
      type: Number,
      required: true,
    },

    /** Inventory quantity in the affected stock bucket after this operation */
    afterQty: {
      type: Number,
      required: true,
    },

    /**
     * External reference ID.
     * E.g. orderId, fulfillmentId, transferId, adjustmentRef
     */
    reference: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },

    /** Human-readable reason for the transaction */
    reason: {
      type: String,
      trim: true,
      default: "",
    },

    /** Additional notes */
    notes: {
      type: String,
      trim: true,
      default: "",
    },

    /** Who performed this operation (ObjectId) */
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    /** Model name of the performer — "Warehouse" | "Admin" */
    performedByModel: {
      type: String,
      enum: ["Warehouse", "Admin"],
      required: true,
    },
  },
  { timestamps: true },
);

/** Most common queries: transactions per warehouse+product over time */
inventoryTransactionSchema.index({ warehouse: 1, product: 1, createdAt: -1 });

/** Per-warehouse transaction history (recent first) */
inventoryTransactionSchema.index({ warehouse: 1, createdAt: -1 });

/** Look up transactions by external reference (order, transfer, etc.) */
inventoryTransactionSchema.index({ reference: 1, createdAt: -1 });

/** Filter by type for reporting */
inventoryTransactionSchema.index({ type: 1, warehouse: 1, createdAt: -1 });

export default mongoose.model("InventoryTransaction", inventoryTransactionSchema);

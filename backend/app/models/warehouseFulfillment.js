import mongoose from "mongoose";

/**
 * WarehouseFulfillment — the operational link between a customer Order and a Warehouse.
 *
 * A fulfillment is created when Admin (or the system) assigns an order to a warehouse.
 * It tracks the physical pick/pack lifecycle independently of the Order workflow status.
 *
 * Relationship:
 *   Order (customer-facing)     ← one-to-one →    WarehouseFulfillment (operational)
 *
 * Status lifecycle:
 *   ASSIGNED → ACCEPTED → PICKING → PACKING → PACKED → READY_TO_SHIP
 *   [ Future Shiprocket: READY_TO_SHIP → SHIPPED → COMPLETED ]
 *
 * Cancellation is allowed at ASSIGNED or ACCEPTED stage (before picking begins).
 */

export const FULFILLMENT_STATUS = Object.freeze({
  ASSIGNED: "ASSIGNED",
  ACCEPTED: "ACCEPTED",
  PICKING: "PICKING",
  PACKING: "PACKING",
  PACKED: "PACKED",
  READY_TO_SHIP: "READY_TO_SHIP",
  // Future Shiprocket phase:
  SHIPPED: "SHIPPED",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
});

/** Valid forward transitions — enforced in fulfillment service */
export const FULFILLMENT_TRANSITIONS = {
  [FULFILLMENT_STATUS.ASSIGNED]: [FULFILLMENT_STATUS.ACCEPTED, FULFILLMENT_STATUS.CANCELLED],
  [FULFILLMENT_STATUS.ACCEPTED]: [FULFILLMENT_STATUS.PICKING, FULFILLMENT_STATUS.CANCELLED],
  [FULFILLMENT_STATUS.PICKING]: [FULFILLMENT_STATUS.PACKING],
  [FULFILLMENT_STATUS.PACKING]: [FULFILLMENT_STATUS.PACKED],
  [FULFILLMENT_STATUS.PACKED]: [FULFILLMENT_STATUS.READY_TO_SHIP],
  [FULFILLMENT_STATUS.READY_TO_SHIP]: [FULFILLMENT_STATUS.SHIPPED],
  [FULFILLMENT_STATUS.SHIPPED]: [FULFILLMENT_STATUS.COMPLETED],
  [FULFILLMENT_STATUS.COMPLETED]: [],
  [FULFILLMENT_STATUS.CANCELLED]: [],
};

const fulfillmentItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    name: { type: String, default: "" },
    sku: { type: String, default: "" },
    image: { type: String, default: "" },
    requiredQty: { type: Number, required: true, min: 1 },
    pickedQty: { type: Number, default: 0, min: 0 },
    shortQty: { type: Number, default: 0, min: 0 },
    shortReason: { type: String, default: "" },
    status: {
      type: String,
      enum: ["PENDING", "PICKED", "SHORT"],
      default: "PENDING",
    },
  },
  { _id: false },
);

const warehouseFulfillmentSchema = new mongoose.Schema(
  {
    /** Human-readable fulfillment ID — FUL-XXXXXX */
    fulfillmentId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    /** Reference to the customer Order */
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },

    /** Mirrors Order.orderId for display without a join */
    orderId: {
      type: String,
      required: true,
    },

    /** The warehouse responsible for fulfillment */
    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: Object.values(FULFILLMENT_STATUS),
      default: FULFILLMENT_STATUS.ASSIGNED,
      index: true,
    },

    /** Items to be picked/packed — copied from order.items at assignment time */
    items: [fulfillmentItemSchema],

    // ── Timestamps ────────────────────────────────────────────────────
    assignedAt: { type: Date, default: Date.now },
    acceptedAt: { type: Date, default: null },
    pickingStartedAt: { type: Date, default: null },
    packingStartedAt: { type: Date, default: null },
    packedAt: { type: Date, default: null },
    readyAt: { type: Date, default: null },
    shippedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },

    cancelReason: { type: String, default: "" },

    /**
     * Who assigned this fulfillment.
     * Either an Admin ObjectId or the string "system".
     */
    assignedBy: {
      type: mongoose.Schema.Types.Mixed,
      default: "system",
    },

    /** Warehouse notes for internal use */
    notes: { type: String, default: "" },

    /**
     * Whether a short-pick was reported.
     * Admin is notified when this becomes true.
     */
    hasShortPick: { type: Boolean, default: false },

    // ── Future Shiprocket fields (nullable, not yet implemented) ───────
    shiprocketOrderId: { type: String, default: null },
    awbCode: { type: String, default: null },
    courierName: { type: String, default: null },
    trackingUrl: { type: String, default: null },
    shipmentStatus: { type: String, default: null },
  },
  { timestamps: true },
);

/** Warehouse dashboard — active fulfillments per warehouse */
warehouseFulfillmentSchema.index({ warehouse: 1, status: 1 });

/** Admin overview — all fulfillments for an order */
warehouseFulfillmentSchema.index({ order: 1, status: 1 });

/** Admin list view — recent fulfillments */
warehouseFulfillmentSchema.index({ createdAt: -1 });

/**
 * Validates whether a status transition is allowed.
 * Returns true if allowed, false otherwise.
 */
export function isValidFulfillmentTransition(from, to) {
  const allowed = FULFILLMENT_TRANSITIONS[from] || [];
  return allowed.includes(to);
}

export default mongoose.model("WarehouseFulfillment", warehouseFulfillmentSchema);
